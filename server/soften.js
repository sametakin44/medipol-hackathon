// AYNA — "Yumuşat" endpoint mantığı.
// Orchestrator modeli, kullanıcının orijinal tweet'ini + council gerekçelerini girdi alır,
// niyeti koruyan ama riski düşüren yeniden yazılmış versiyon üretir.

import { callOnce, extractJsonBlock } from "./openrouter.js";
import { MODEL_ROLES } from "../src/config.js";

const SOFTEN_SYSTEM = `Sen sosyal medyada paylaşım önce risk azaltma uzmanısın. Kullanıcının orijinal tweet'inin ASIL NİYETİNİ ve fikrini korumalı, sadece kışkırtıcı / kategorik / linç çekecek dilini yumuşatmalısın.

KURALLAR:
- Tweet'in ana fikrini ve duruşunu DEĞİŞTİRME. Sadece sertliği, mutlaklığı, kişiselleştirmeyi kırp.
- Türkçesi DOĞAL kalsın — bir Türk kullanıcının kendi yazacağı gibi. Çeviri kokan veya kuru/resmi dil YASAK.
- Tweet uzunluğunda (280 karakteri aşma). Mümkünse orijinalle benzer uzunluk.
- "Bence", "düşünüyorum", "belki", "her zaman değil ama" gibi yumuşatıcılar uygun yerde serbest. Ama her cümlenin başına "bence" koyma — gerçek Türk Twitter dili gibi.
- Hashtag, etiket, emoji EKLEMA. Orijinalde varsa koru.
- "ASLA", "HER ZAMAN", "HİÇBİR", "TAMAMEN", "DERHAL", aşağılayıcı sıfatlar ("çöp", "rezalet" vb.) gibi kategorik / saldırgan ifadeleri sönümle.

ÇIKTI FORMATI — ZORUNLU JSON:
{
  "yumusatilmisTweet": "yeniden yazılmış tweet (Türkçe, doğal, niyeti korur)",
  "neDegisti": "1-2 cümle: hangi sertlik kırpıldı, niyet nasıl korundu"
}

SADECE JSON döndür. Markdown kod bloğu yok, açıklama yok.`;

function parseSoftenOutput(raw) {
  const block = extractJsonBlock(raw);
  if (!block) throw new Error("JSON bloğu bulunamadı (soften)");
  let parsed;
  try {
    parsed = JSON.parse(block);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON parse hatası (soften): ${msg}`, { cause: err });
  }
  const yumusatilmisTweet = String(parsed?.yumusatilmisTweet ?? "").trim();
  const neDegisti = String(parsed?.neDegisti ?? "").trim();
  if (!yumusatilmisTweet) throw new Error("yumusatilmisTweet boş");
  return { yumusatilmisTweet, neDegisti: neDegisti || "(açıklama yok)" };
}

/**
 * @param {{ tweet: string, gerekce?: object|string }} args
 * @returns {Promise<{yumusatilmisTweet:string, neDegisti:string, model:string, elapsedMs:number}>}
 */
export async function soften({ tweet, gerekce }) {
  const model = MODEL_ROLES.orchestrator;
  const t0 = Date.now();

  let gerekceBlock = "";
  if (gerekce && typeof gerekce === "object") {
    const lines = [];
    if (gerekce.virallik) lines.push(`- virallik: ${gerekce.virallik}`);
    if (gerekce.polarizasyon) lines.push(`- polarizasyon: ${gerekce.polarizasyon}`);
    if (gerekce.itibarRiski) lines.push(`- itibarRiski: ${gerekce.itibarRiski}`);
    if (lines.length) gerekceBlock = `\n\nCOUNCIL'IN RİSK GEREKÇELERİ (neden riskli olduğunu açıklayan notlar):\n${lines.join("\n")}`;
  } else if (typeof gerekce === "string" && gerekce.trim()) {
    gerekceBlock = `\n\nCOUNCIL GEREKÇESİ:\n${gerekce.trim()}`;
  }

  const user = `ORİJİNAL TWEET:
"""${tweet}"""${gerekceBlock}

Yukarıdaki tweet'i, ASIL NİYETİNİ koruyarak yumuşat. Sadece kışkırtıcı/kategorik dili kırp.`;

  console.log(`[soften] -> ${model}`);
  const raw = await callOnce({
    model,
    system: SOFTEN_SYSTEM,
    user,
    maxTokens: 320,
    temperature: 0.55,
  });
  const out = parseSoftenOutput(raw);
  const elapsedMs = Date.now() - t0;
  console.log(`[soften] <- ${model} ${elapsedMs}ms (${out.yumusatilmisTweet.length} chars)`);
  return { ...out, model, elapsedMs };
}
