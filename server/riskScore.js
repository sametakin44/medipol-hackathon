// AYNA — Basit risk skorları (Council henüz yok — Adım 4'te gerçek skorlama gelecek).
// Üç skor: virallik, polarizasyon, itibarRiski. Hepsi 0-100 arası.
// Bu sadece tweet metnine bakan saf bir heuristik; ileride 8 persona yorumunun
// sentiment dağılımına dayalı gerçek bir formül koyacağız.

const POLARIZING_TR = [
  "asla", "kesinlikle", "her zaman", "hiçbir zaman",
  "felaket", "rezalet", "muhteşem", "harika", "iğrenç",
  "yasak", "yasaklan", "olmamalı", "olmalı", "şart",
  "düşman", "hain", "vatan", "millet", "ahlak", "ahlaksız",
  "haram", "günah", "rezil",
];

const REPUTATION_RISK_TR = [
  "aptal", "salak", "geri zekalı", "mal", "manyak",
  "iğrenç", "tiksinç", "nefret",
  "yalancı", "düzenbaz", "sahtekar", "şarlatan",
  "öl", "geber", "kahrolsun",
  "boykot", "iflas", "rezil et", "ifşa",
];

function lower(s) {
  return s.toLocaleLowerCase("tr-TR");
}

function countMatches(text, words) {
  const t = lower(text);
  let n = 0;
  for (const w of words) {
    const re = new RegExp(`(^|\\W)${w}`, "g");
    const m = t.match(re);
    if (m) n += m.length;
  }
  return n;
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeRiskScores(tweet) {
  if (!tweet || typeof tweet !== "string") {
    return { virallik: 0, polarizasyon: 0, itibarRiski: 0 };
  }

  const len = tweet.length;
  const exclam = (tweet.match(/!/g) || []).length;
  const question = (tweet.match(/\?/g) || []).length;
  const emoji = (tweet.match(/\p{Extended_Pictographic}/gu) || []).length;
  const upperWords = (tweet.match(/\b[A-ZÇĞİÖŞÜ]{3,}\b/g) || []).length;
  const polarCount = countMatches(tweet, POLARIZING_TR);
  const riskCount = countMatches(tweet, REPUTATION_RISK_TR);

  // Virallik: kısa + yüksek duygu (ünlem/emoji/CAPS) yüksek skor.
  const lengthBoost = len <= 80 ? 25 : len <= 160 ? 15 : 5;
  const virallik = clamp(
    25 + lengthBoost + exclam * 6 + emoji * 4 + upperWords * 5 + polarCount * 3
  );

  // Polarizasyon: kutuplaştırıcı kelime sayısı + soru/ünlem yoğunluğu.
  const polarizasyon = clamp(
    15 + polarCount * 14 + upperWords * 4 + exclam * 3 + question * 2
  );

  // İtibar riski: hakaret/saldırgan ifade + kutup.
  const itibarRiski = clamp(
    5 + riskCount * 25 + upperWords * 4 + polarCount * 4
  );

  return { virallik, polarizasyon, itibarRiski };
}
