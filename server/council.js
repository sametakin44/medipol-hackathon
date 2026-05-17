// AYNA — LLM Council (Adım 4).
//
// Karpathy'nin "LLM Council" mimarisi, 3 aşama:
//   Aşama 1 — 3 council üyesi (councilA/B/C) PARALEL, tweet + 8 persona yorumunu girdi alır,
//             bağımsız olarak { virallik, polarizasyon, itibarRiski, gerekce } üretir.
//   Aşama 2 — Her üye, DİĞER iki üyenin skorlarını ANONİM görür (Değerlendirme A/B) ve
//             { kritik } üretir (1-2 cümle uzlaşma/eleştiri notu).
//   Aşama 3 — Başkan (councilA) tüm skorları + kritikleri sentezler, FİNAL skoru üretir.
//
// Çıktı (`runCouncil`):
//   { virallik, polarizasyon, itibarRiski, gerekce: { virallik, polarizasyon, itibarRiski }, council: {...debug...} }
//
// Hata davranışı:
//   - Aşama 1'de 3 üyeden 1-2 hata verirse, kalanlarla devam (en az 2 skor lazım).
//   - 3'ü de hata verirse: null döner. Çağıran (server/index.js) heuristic mock'a düşer.

import { callOnce, extractJsonBlock } from "./openrouter.js";
import { MODEL_ROLES } from "../src/config.js";

const COUNCIL_MEMBERS = ["councilA", "councilB", "councilC"];

const RUBRIC = `
PUANLAMA RUBRİĞİ (her metrik 0-100):
- 0-30  = SAKİN     : tweet zararsız, paylaşılabilir; reaksiyonlar ılımlı.
- 31-60 = DİKKAT   : tweet kayda değer tartışma çıkarabilir, dengeli ele alınmalı.
- 61-100 = YÜKSEK RİSK: tweet polarize ediyor / linç potansiyeli var / ciddi tepki çekecek.

ÜÇ METRİK:
- virallik       : Türkiye sosyal medya ortamında bu tweet ne kadar yayılır? Trend olma, alıntılanma, tartışma uyandırma potansiyeli.
- polarizasyon   : Persona yorumları arasındaki zıtlık + tweet'in bölücülük derecesi. Herkes hemfikirse düşük, iki keskin kamp varsa yüksek.
- itibarRiski    : Tweet sahibi için olası geri tepme. Linç ihtimali, kariyer/imaj zararı, gelecekteki utanç.

KRİTİK: Tam aralığı kullan! Sakin bir tweet 5-25 almalı, gerçek bombası olan tweet 75-95 almalı. Orta zona ("50 civarı") toplama eğilimine direnç.
Türk sosyal medya tonunu hesaba kat (kendine has linç dinamikleri, "alıntı tweet ifşa" geleneği).
`.trim();

function formatPersonaComments(personaResults) {
  return personaResults
    .map((r, i) => {
      const errFlag = r.error ? "  [HATA-FALLBACK]" : "";
      return `${i + 1}. [${r.personaId}] stance=${r.stance} intensity=${r.intensity} replyType=${r.replyType}${errFlag}\n   ${r.comment}`;
    })
    .join("\n\n");
}

function clampScore(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeStage1Payload(parsed) {
  return {
    virallik: clampScore(parsed?.virallik),
    polarizasyon: clampScore(parsed?.polarizasyon),
    itibarRiski: clampScore(parsed?.itibarRiski),
    gerekce: String(parsed?.gerekce ?? "").trim().slice(0, 400) || "(gerekçe boş)",
  };
}

function parseJsonStrict(raw, schemaHint) {
  const block = extractJsonBlock(raw);
  if (!block) throw new Error(`JSON bloğu bulunamadı (${schemaHint})`);
  try {
    return JSON.parse(block);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON parse hatası (${schemaHint}): ${msg}`, { cause: err });
  }
}

// ============ AŞAMA 1 ============

async function stage1OneMember({ memberKey, tweet, personaResults }) {
  const model = MODEL_ROLES[memberKey];
  if (!model) throw new Error(`MODEL_ROLES.${memberKey} tanımsız`);

  const system = `Sen bir sosyal medya risk değerlendirme uzmanısın. Türkçe Twitter / X kültürünü çok iyi bilirsin.

${RUBRIC}

ÇIKTI FORMATI — ZORUNLU JSON:
{
  "virallik": 0-100 arası TAM SAYI,
  "polarizasyon": 0-100 arası TAM SAYI,
  "itibarRiski": 0-100 arası TAM SAYI,
  "gerekce": "kısa metin, 1-2 cümle, her üç skorun nedenini özetle"
}

SADECE JSON döndür. Markdown kod bloğu yok, açıklama yok.`;

  const user = `TWEET:
"""${tweet}"""

8 PERSONA YORUMU:
${formatPersonaComments(personaResults)}

Bu tweet için 3 risk metriğini rubriğe göre puanla. Aralığın tamamını kullan.`;

  const raw = await callOnce({
    model,
    system,
    user,
    maxTokens: 400,
    temperature: 0.4,
  });

  const parsed = parseJsonStrict(raw, `stage1:${memberKey}`);
  return {
    memberKey,
    model,
    ...normalizeStage1Payload(parsed),
  };
}

async function stage1All({ tweet, personaResults }) {
  const settled = await Promise.allSettled(
    COUNCIL_MEMBERS.map((k) =>
      stage1OneMember({ memberKey: k, tweet, personaResults })
    )
  );
  const ok = [];
  const failed = [];
  for (let i = 0; i < settled.length; i++) {
    const s = settled[i];
    if (s.status === "fulfilled") {
      ok.push(s.value);
    } else {
      failed.push({
        memberKey: COUNCIL_MEMBERS[i],
        reason: s.reason?.message || String(s.reason),
      });
    }
  }
  return { ok, failed };
}

// ============ AŞAMA 2 ============
// Her üye, DİĞER iki üyenin skorlarını ANONİM görür.
// Üye A, B ve C'nin skorlarını "Değerlendirme A" ve "Değerlendirme B" olarak görür (rastgele etiketli).

function pickOthers(allStage1, ownIndex) {
  return allStage1.filter((_, i) => i !== ownIndex);
}

function anonLabel(i) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

async function stage2OneMember({ ownEval, others }) {
  const model = MODEL_ROLES[ownEval.memberKey];

  const system = `Sen bir sosyal medya risk değerlendirme uzmanısın. Diğer iki uzmanın bağımsız değerlendirmesini gördün. Senin görevin: onlarla hemfikir olduğun ve ayrıştığın noktaları KISA bir kritikte özetlemek.

ÇIKTI FORMATI — ZORUNLU JSON:
{
  "kritik": "1-2 cümle. Diğer uzmanların gözden kaçırdığı veya abarttığı noktayı işaret et; ya da neden onlarla hemfikir olduğunu söyle."
}

SADECE JSON döndür.`;

  const othersBlock = others
    .map(
      (o, i) =>
        `Değerlendirme ${anonLabel(i)}: virallik=${o.virallik}, polarizasyon=${o.polarizasyon}, itibarRiski=${o.itibarRiski}. Gerekçe: ${o.gerekce}`
    )
    .join("\n");

  const user = `SENİN DEĞERLENDİRMEN:
virallik=${ownEval.virallik}, polarizasyon=${ownEval.polarizasyon}, itibarRiski=${ownEval.itibarRiski}.
Gerekçe: ${ownEval.gerekce}

DİĞER UZMANLAR (anonim):
${othersBlock}

Bu iki değerlendirmeyi kısa şekilde kritikle.`;

  const raw = await callOnce({
    model,
    system,
    user,
    maxTokens: 200,
    temperature: 0.5,
  });

  const parsed = parseJsonStrict(raw, `stage2:${ownEval.memberKey}`);
  return {
    memberKey: ownEval.memberKey,
    kritik: String(parsed?.kritik ?? "").trim().slice(0, 400) || "(kritik boş)",
  };
}

async function stage2All({ stage1Ok }) {
  // En az 2 üye varsa çapraz kritik yapılabilir.
  if (stage1Ok.length < 2) return [];
  const settled = await Promise.allSettled(
    stage1Ok.map((own, i) =>
      stage2OneMember({
        ownEval: own,
        others: pickOthers(stage1Ok, i),
      })
    )
  );
  return settled
    .filter((s) => s.status === "fulfilled")
    .map((s) => s.value);
}

// ============ AŞAMA 3 — BAŞKAN ============

async function stage3President({ tweet, stage1Ok, stage2Critiques }) {
  // Başkan: tercihen councilA; ancak councilA stage1'de düştüyse mevcut ilk üyenin modeli.
  const presidentKey =
    stage1Ok.find((m) => m.memberKey === "councilA")?.memberKey ||
    stage1Ok[0].memberKey;
  const model = MODEL_ROLES[presidentKey];

  const system = `Sen bir LLM risk değerlendirme council'inin BAŞKANISIN. Üç bağımsız uzman puan verdi, sonra birbirlerini eleştirdi. Senin görevin: bu farklı görüşleri sentezleyip FİNAL skoru çıkarmak. Ortalama almak zorunda değilsin; en güçlü argümanın yönüne meyilli ol.

${RUBRIC}

ÇIKTI FORMATI — ZORUNLU JSON:
{
  "virallik": 0-100 arası TAM SAYI,
  "polarizasyon": 0-100 arası TAM SAYI,
  "itibarRiski": 0-100 arası TAM SAYI,
  "gerekce": {
    "virallik": "tek kısa cümle, neden bu skoru verdiğini açıkla",
    "polarizasyon": "tek kısa cümle",
    "itibarRiski": "tek kısa cümle"
  }
}

SADECE JSON döndür.`;

  const evalBlock = stage1Ok
    .map(
      (m, i) =>
        `Uzman ${anonLabel(i)}: virallik=${m.virallik}, polarizasyon=${m.polarizasyon}, itibarRiski=${m.itibarRiski}.\n  Gerekçe: ${m.gerekce}`
    )
    .join("\n\n");

  const critBlock =
    stage2Critiques.length > 0
      ? stage2Critiques
          .map((c, i) => `Kritik ${i + 1} (${c.memberKey}): ${c.kritik}`)
          .join("\n")
      : "(çapraz kritik yapılamadı)";

  const user = `TWEET:
"""${tweet}"""

UZMAN DEĞERLENDİRMELERİ:
${evalBlock}

ÇAPRAZ KRİTİKLER:
${critBlock}

FİNAL skoru ver. Üç metrik için ayrı ayrı 1 cümle gerekçe yaz.`;

  const raw = await callOnce({
    model,
    system,
    user,
    maxTokens: 400,
    temperature: 0.3,
  });

  const parsed = parseJsonStrict(raw, `stage3:president(${presidentKey})`);

  const ger = parsed?.gerekce || {};
  return {
    virallik: clampScore(parsed?.virallik),
    polarizasyon: clampScore(parsed?.polarizasyon),
    itibarRiski: clampScore(parsed?.itibarRiski),
    gerekce: {
      virallik: String(ger?.virallik ?? "").trim().slice(0, 240) || "(gerekçe yok)",
      polarizasyon: String(ger?.polarizasyon ?? "").trim().slice(0, 240) || "(gerekçe yok)",
      itibarRiski: String(ger?.itibarRiski ?? "").trim().slice(0, 240) || "(gerekçe yok)",
    },
    president: presidentKey,
    presidentModel: model,
  };
}

// ============ ANA AKIŞ ============

/**
 * 3 aşamalı LLM Council. Başarısız olursa null döner — çağıran heuristic'e düşer.
 * @param {{tweet:string, personaResults:Array}} args
 * @returns {Promise<null | {virallik, polarizasyon, itibarRiski, gerekce, council}>}
 */
export async function runCouncil({ tweet, personaResults }) {
  const t0 = Date.now();
  console.log(`[council] başlıyor (${COUNCIL_MEMBERS.length} üye)`);

  const stage1 = await stage1All({ tweet, personaResults });
  if (stage1.failed.length > 0) {
    for (const f of stage1.failed) {
      console.log(`[council] stage1 hata (${f.memberKey}): ${f.reason}`);
    }
  }
  if (stage1.ok.length < 2) {
    console.log(`[council] stage1 yetersiz (sadece ${stage1.ok.length} başarılı); null dönüyor`);
    return null;
  }
  console.log(`[council] stage1 ok: ${stage1.ok.map((m) => `${m.memberKey}(v${m.virallik},p${m.polarizasyon},i${m.itibarRiski})`).join("  ")}`);

  const stage2Critiques = await stage2All({ stage1Ok: stage1.ok });
  console.log(`[council] stage2 critiques: ${stage2Critiques.length}/${stage1.ok.length}`);

  let final;
  try {
    final = await stage3President({
      tweet,
      stage1Ok: stage1.ok,
      stage2Critiques,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[council] stage3 başkan hata: ${msg}`);
    return null;
  }

  console.log(
    `[council] FINAL ${Date.now() - t0}ms: v=${final.virallik} p=${final.polarizasyon} i=${final.itibarRiski}`
  );

  return {
    virallik: final.virallik,
    polarizasyon: final.polarizasyon,
    itibarRiski: final.itibarRiski,
    gerekce: final.gerekce,
    council: {
      stage1: stage1.ok,
      stage1Failed: stage1.failed,
      stage2: stage2Critiques,
      president: final.president,
      elapsedMs: Date.now() - t0,
    },
  };
}

// Test için iç fonksiyonları açığa çıkar.
export const __test__ = {
  normalizeStage1Payload,
  parseJsonStrict,
  formatPersonaComments,
  clampScore,
};
