// AYNA — Persona payload'undan X (Twitter) etkileşim sayılarını TÜRET.
// Yeni API yok; sadece intensity + willEngage + stance + persona'ya göre deterministik sayı.
// Aynı personaId her zaman aynı tabanı verir (yeniden render'da sıçramaz).

// Persona "reach" (takipçi tabanı katsayısı) — gerçekçi profillere göre.
const PERSONA_REACH = {
  "apolitik-z": 1.0,
  "muhafazakar-ebeveyn": 0.4,
  "liberal-akademisyen": 1.2,
  "anonim-troll": 2.5,
  "marka-yoneticisi": 0.5,
  "gazeteci": 2.0,
  "esprili-mizahci": 3.0,
  "siradan-takipci": 0.2,
};

// Basit, deterministik bir hash → [0, 1) jitter.
function hashJitter(personaId, salt) {
  const s = `${personaId}|${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 32-bit unsigned'a düşür ve 0-1'e normalize et.
  return ((h >>> 0) % 100000) / 100000;
}

export function computeEngagement(payload) {
  if (!payload?.personaId) {
    return { replies: 0, retweets: 0, likes: 0, views: 0 };
  }
  const id = payload.personaId;
  const reach = PERSONA_REACH[id] ?? 1;
  const intensity = Number(payload.intensity || 0); // 0-5
  const willEngage = Boolean(payload.willEngage);
  const stance = payload.stance || "notr";

  // "alaycı" yorumlar X'te daha çok beğeni alır; "destek" sıradan; "karşıt" tartışma çeker (retweet boost).
  const stanceBoost =
    stance === "alayci" ? 1.25 : stance === "karsit" ? 1.1 : stance === "destek" ? 0.95 : 0.85;

  const j = hashJitter(id, "likes");
  const engageMult = willEngage ? 1.45 : 0.7;

  // Beğeni tabanı: intensity 1→~30, 5→~600, reach ile çarpılır, jitter ±35%
  const baseLikes = 28 * Math.pow(intensity || 1, 1.8) * reach * stanceBoost * engageMult;
  const likes = Math.max(1, Math.round(baseLikes * (0.65 + j * 0.7)));

  const retweets = Math.max(0, Math.round(likes * (0.07 + hashJitter(id, "rt") * 0.06)));
  const replies = Math.max(0, Math.round(likes * (0.12 + hashJitter(id, "re") * 0.10)));
  const views = Math.max(likes * 8, Math.round(likes * (28 + hashJitter(id, "vw") * 12)));

  return { replies, retweets, likes, views };
}

/**
 * Türkçe sayı formatı: 1234 → "1,2B"  (Türkçe binlik = B), 12_345 → "12,3B", 1_234_567 → "1,2Mn".
 * X arayüzü Türkçe'de "1,2 B" (bin) kullanır; ben "B" ekiyle gidiyorum, M yerine "Mn".
 */
export function formatTrCount(n) {
  if (n == null || isNaN(n)) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} B`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} Mn`;
}
