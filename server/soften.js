// AYNA — "Yumuşat" Tree-of-Thoughts mantığı.
//
// 1) Orchestrator (openai/gpt-4o) 3 farklı yumuşatma DALI üretir — PARALEL:
//    - "olculu"            : sertlik ve mutlak yargıları yumuşat
//    - "soruya-cevir"      : iddiaları soru formuna çevir
//    - "kisiselden-genele" : kişisel hedeflemeyi genel gözlem diline al
// 2) Değerlendirici (softenEvaluator, gemini-2.5-flash — ucuz):
//    - Her dala iki skor verir: riskDusus (0-100) ve niyetKorunma (0-100)
//    - En iyi dalı seçer ve kısa gerekçe yazar.
// 3) Dönen JSON: { yumusatilmisTweet (seçilen), neDegisti, secilenDal, branches[], ... }

import { callOnce, extractJsonBlock } from "./openrouter.js";
import { MODEL_ROLES } from "../src/config.js";

const STRATEGIES = [
  {
    id: "olculu",
    label: "Ölçülü",
    instruction:
      "Bu strateji: tweet'in sertliğini ve mutlak yargılarını yumuşat. 'asla', 'her zaman', 'tamamen', 'derhal' gibi mutlak sözcükleri kırp. Aşağılayıcı sıfatları ('çöp', 'rezalet') çıkar. Niyet aynen kalır, sadece ton ılımlaşır.",
  },
  {
    id: "soruya-cevir",
    label: "Soruya çevir",
    instruction:
      "Bu strateji: tweet'in iddialarını SORU formuna çevir. 'X olmalı' → 'X olmalı mı?'. 'Y mahvediyor' → 'Y'nin gerçek etkisi nedir?'. Asıl mesaj korunur ama hüküm kipi sorgulama kipine döner. Niyetin tartışmaya açılması.",
  },
  {
    id: "kisiselden-genele",
    label: "Kişiselden genele",
    instruction:
      "Bu strateji: tweet bir kişiyi/grubu/jenerasyonu hedefliyorsa, hedeflemeyi kaldır. Fenomeni/olayı genel kategoride ele al. 'X mahvediyor' → 'X olgusunun etkileri tartışılır'. Suçlama dili → gözlem dili.",
  },
];

const BRANCH_SYSTEM = `Sen sosyal medyada paylaşım öncesi risk azaltma uzmanısın. Kullanıcının orijinal tweet'inin ASIL NİYETİNİ korumalı, sadece riski (linç/polarizasyon/itibar zararı) düşürecek dili kırpmalısın.

GENEL KURALLAR:
- Tweet'in ana fikri ve duruşu DEĞİŞMEZ. Sadece sertliği, mutlaklığı, kişisel saldırıyı sönümle.
- Türkçesi DOĞAL kalsın — bir Türk kullanıcının kendi yazacağı gibi. Çeviri kokan veya kuru/resmi dil YASAK.
- 280 karakteri aşma.
- Hashtag, etiket, emoji EKLEMA. Orijinalde varsa koru.

ÇIKTI FORMATI — ZORUNLU JSON (BAŞKA HİÇBİR ŞEY):
{
  "yumusatilmisTweet": "yeniden yazılmış tweet",
  "neDegisti": "1 cümle: bu stratejide ne yaptın"
}

SADECE JSON döndür.`;

const EVALUATOR_SYSTEM = `Sen risk azaltma değerlendiricisisin. Aşağıdaki orijinal tweet ve 3 yumuşatma alternatifini değerlendireceksin.

HER ALTERNATİF İÇİN İKİ SKOR (0-100):
- riskDusus    : Orijinale göre tahmini risk düşüşü. (Mutlak/saldırgan ifade yumuşadı mı? Linç çekme ihtimali ne kadar azaldı?) 0 = aynı, 100 = tamamen güvenli.
- niyetKorunma : Orijinal mesajın ana fikrini ne kadar koruyor. 0 = niyet kaybolmuş, 100 = aynı söylüyor.

EN İYİ ALTERNATİF: en yüksek (riskDusus + niyetKorunma) toplamı OLAN alternatif. Eşitlik durumunda niyetKorunma'yı önceliklendir.

ÇIKTI FORMATI — ZORUNLU JSON:
{
  "skorlar": [
    { "strategy": "olculu",            "riskDusus": 0-100, "niyetKorunma": 0-100 },
    { "strategy": "soruya-cevir",      "riskDusus": 0-100, "niyetKorunma": 0-100 },
    { "strategy": "kisiselden-genele", "riskDusus": 0-100, "niyetKorunma": 0-100 }
  ],
  "secilen": "olculu" | "soruya-cevir" | "kisiselden-genele",
  "gerekce": "1 cümle: neden bu alternatifi seçtin"
}

SADECE JSON döndür.`;

function parseJsonStrict(raw, hint) {
  const block = extractJsonBlock(raw);
  if (!block) throw new Error(`JSON bloğu bulunamadı (${hint})`);
  try {
    return JSON.parse(block);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON parse hatası (${hint}): ${msg}`, { cause: err });
  }
}

function clampScore(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function buildGerekceBlock(gerekce) {
  if (!gerekce) return "";
  if (typeof gerekce === "object") {
    const lines = [];
    if (gerekce.virallik) lines.push(`- virallik: ${gerekce.virallik}`);
    if (gerekce.polarizasyon) lines.push(`- polarizasyon: ${gerekce.polarizasyon}`);
    if (gerekce.itibarRiski) lines.push(`- itibarRiski: ${gerekce.itibarRiski}`);
    if (!lines.length) return "";
    return `\n\nCOUNCIL'IN RİSK GEREKÇELERİ:\n${lines.join("\n")}`;
  }
  if (typeof gerekce === "string" && gerekce.trim()) {
    return `\n\nCOUNCIL GEREKÇESİ:\n${gerekce.trim()}`;
  }
  return "";
}

async function runOneBranch({ tweet, gerekce, strategy }) {
  const model = MODEL_ROLES.orchestrator;
  const user = `ORİJİNAL TWEET:
"""${tweet}"""${buildGerekceBlock(gerekce)}

STRATEJİ: ${strategy.label}
${strategy.instruction}

Yukarıdaki tweet'i BU STRATEJİYLE yumuşat. JSON döndür.`;

  console.log(`[soften:tot] -> ${strategy.id} (${model})`);
  const t0 = Date.now();
  try {
    const raw = await callOnce({
      model,
      system: BRANCH_SYSTEM,
      user,
      maxTokens: 320,
      temperature: 0.55,
    });
    const parsed = parseJsonStrict(raw, `branch:${strategy.id}`);
    const yumusatilmisTweet = String(parsed?.yumusatilmisTweet ?? "").trim();
    const neDegisti = String(parsed?.neDegisti ?? "").trim();
    if (!yumusatilmisTweet) throw new Error("yumusatilmisTweet boş");
    console.log(`[soften:tot] <- ${strategy.id} ${Date.now() - t0}ms`);
    return {
      strategy: strategy.id,
      label: strategy.label,
      yumusatilmisTweet,
      neDegisti: neDegisti || "(açıklama yok)",
      model,
    };
  } catch (err) {
    console.log(`[soften:tot] !! ${strategy.id} ${Date.now() - t0}ms ${err?.message || err}`);
    return {
      strategy: strategy.id,
      label: strategy.label,
      yumusatilmisTweet: "",
      neDegisti: "",
      error: err?.message || String(err),
      model,
    };
  }
}

async function runEvaluator({ tweet, branches }) {
  const model = MODEL_ROLES.softenEvaluator;
  // Sadece yumuşatılmış metin üretilmiş dalları değerlendiriciye ver.
  const valid = branches.filter((b) => b.yumusatilmisTweet);
  if (valid.length === 0) {
    return null;
  }

  const block = valid
    .map(
      (b) =>
        `Strateji "${b.strategy}":\n  Metin: ${b.yumusatilmisTweet}\n  Değişiklik notu: ${b.neDegisti}`
    )
    .join("\n\n");

  const user = `ORİJİNAL TWEET:
"""${tweet}"""

3 YUMUŞATMA ALTERNATİFİ:
${block}

Üç alternatifi rubriğe göre puanla ve en iyisini seç.`;

  console.log(`[soften:tot] -> evaluator (${model})`);
  const t0 = Date.now();
  try {
    const raw = await callOnce({
      model,
      system: EVALUATOR_SYSTEM,
      user,
      maxTokens: 300,
      temperature: 0.2,
    });
    const parsed = parseJsonStrict(raw, "evaluator");
    const skorlar = Array.isArray(parsed?.skorlar) ? parsed.skorlar : [];
    const skorMap = new Map();
    for (const s of skorlar) {
      if (typeof s?.strategy === "string") {
        skorMap.set(s.strategy, {
          riskDusus: clampScore(s.riskDusus),
          niyetKorunma: clampScore(s.niyetKorunma),
        });
      }
    }
    const secilen = String(parsed?.secilen ?? "").trim();
    const gerekce = String(parsed?.gerekce ?? "").trim();
    console.log(`[soften:tot] <- evaluator ${Date.now() - t0}ms — seçilen=${secilen}`);
    return { skorMap, secilen, gerekce, model };
  } catch (err) {
    console.log(`[soften:tot] !! evaluator ${Date.now() - t0}ms ${err?.message || err}`);
    return null;
  }
}

function pickFallbackBranch(branches, evalResult) {
  // Değerlendirici döndüyse ve seçim geçerliyse onu kullan; aksi halde en uzun başarılı dal.
  if (evalResult?.secilen) {
    const found = branches.find(
      (b) => b.strategy === evalResult.secilen && b.yumusatilmisTweet
    );
    if (found) return found;
  }
  // Toplam skor (riskDusus + niyetKorunma) max
  if (evalResult?.skorMap?.size) {
    let best = null;
    let bestScore = -1;
    for (const b of branches) {
      const s = evalResult.skorMap.get(b.strategy);
      if (!s || !b.yumusatilmisTweet) continue;
      const total = s.riskDusus + s.niyetKorunma;
      if (total > bestScore) {
        bestScore = total;
        best = b;
      }
    }
    if (best) return best;
  }
  // Evaluator çalışmadı — başarılı ilk dal
  return branches.find((b) => b.yumusatilmisTweet) || branches[0];
}

/**
 * @param {{ tweet: string, gerekce?: object|string }} args
 * @returns {Promise<object>}
 */
export async function soften({ tweet, gerekce }) {
  const t0 = Date.now();

  // 3 dalı PARALEL üret.
  const branches = await Promise.all(
    STRATEGIES.map((s) => runOneBranch({ tweet, gerekce, strategy: s }))
  );

  // Değerlendirici (ucuz, hızlı). Hata olursa null döner.
  const evalResult = await runEvaluator({ tweet, branches });

  const selected = pickFallbackBranch(branches, evalResult);

  // Branches'ı kullanıcı dostu hale getir (skorlar dahil)
  const enrichedBranches = branches.map((b) => {
    const s = evalResult?.skorMap?.get(b.strategy);
    return {
      strategy: b.strategy,
      label: b.label,
      yumusatilmisTweet: b.yumusatilmisTweet,
      neDegisti: b.neDegisti,
      skor: s ? { riskDusus: s.riskDusus, niyetKorunma: s.niyetKorunma } : null,
      error: b.error,
    };
  });

  return {
    yumusatilmisTweet: selected.yumusatilmisTweet || "",
    neDegisti: selected.neDegisti || "",
    secilenDal: selected.strategy,
    secimGerekcesi: evalResult?.gerekce || "",
    branches: enrichedBranches,
    model: MODEL_ROLES.orchestrator,
    evaluatorModel: evalResult?.model || MODEL_ROLES.softenEvaluator,
    elapsedMs: Date.now() - t0,
  };
}
