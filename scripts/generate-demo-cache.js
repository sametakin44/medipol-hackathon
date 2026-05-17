// AYNA — Demo cache üretici.
// Gerçek API'yi BİR KEZ vurur, sonuçları server/demoCache.js'e ES modül olarak yazar.
// Sonrasında AYNA_DEMO_MODE=1 ile bu cache replay edilir.
//
// Çalıştırma:
//   AYNA_DEMO_MODE'u BOŞ bırak, normal canlı server'ı 3001'de ayakta tut, sonra:
//   node scripts/generate-demo-cache.js
//
// İsteğe bağlı: --tweet="..." ile farklı bir demo tweet'i seçebilirsin.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function argFor(name, fallback) {
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return fallback;
}

const BACKEND = argFor("backend", "http://localhost:3001");
const DEMO_TWEET = argFor(
  "tweet",
  "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak."
);
const OUT = path.resolve(__dirname, "../server/demoCache.js");

async function captureSimulate(tweet) {
  const res = await fetch(`${BACKEND}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet }),
  });
  if (!res.ok) throw new Error(`simulate HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let meta = null;
  const personas = [];
  let risk = null;
  let done = null;
  while (true) {
    const { value, done: rDone } = await reader.read();
    if (rDone) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const ev = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (!ev.trim() || ev.startsWith(":")) continue;
      let eventName = "message";
      const dataLines = [];
      for (const line of ev.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      try {
        const data = JSON.parse(dataLines.join("\n"));
        if (eventName === "meta") meta = data;
        else if (eventName === "persona") personas.push(data);
        else if (eventName === "risk") risk = data;
        else if (eventName === "done") done = data;
      } catch {
        // ignore
      }
    }
  }
  return { meta, personas, risk, done };
}

async function captureSoften(tweet, gerekce) {
  const res = await fetch(`${BACKEND}/api/soften`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet, gerekce }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`soften HTTP ${res.status}: ${j?.error || ""}`);
  }
  return res.json();
}

function emit(out) {
  // ESM module string. JSON.stringify ile gömüyoruz; pretty-print için 2 boşluk.
  return `// AYNA — Demo cache (otomatik üretildi).
// Üretici: scripts/generate-demo-cache.js
// Tarih: ${new Date().toISOString()}
//
// Bu dosya production cache değil — DEMO/video çekimi için sabit sonuç.
// AYNA_DEMO_MODE=1 ile server/index.js bu sabit cevapları SSE üzerinden replay eder.

export const DEMO_TWEET = ${JSON.stringify(out.demoTweet)};

export const DEMO_SIMULATE_BEFORE = ${JSON.stringify(out.before, null, 2)};

export const DEMO_SOFTEN_RESPONSE = ${JSON.stringify(out.soften, null, 2)};

export const DEMO_SIMULATE_AFTER = ${JSON.stringify(out.after, null, 2)};

// Demo modunda /api/simulate gelen tweet'i bu helper'la eşleştir.
export function matchDemoSimulate(tweet) {
  const t = (tweet || "").trim();
  if (t === DEMO_TWEET.trim()) return DEMO_SIMULATE_BEFORE;
  if (t === DEMO_SOFTEN_RESPONSE.yumusatilmisTweet.trim()) return DEMO_SIMULATE_AFTER;
  return null;
}

export function matchDemoSoften(tweet) {
  const t = (tweet || "").trim();
  if (t === DEMO_TWEET.trim()) return DEMO_SOFTEN_RESPONSE;
  return null;
}
`;
}

(async () => {
  console.log(`[demo-gen] backend: ${BACKEND}`);
  console.log(`[demo-gen] DEMO_TWEET: "${DEMO_TWEET}"`);

  console.log("[demo-gen] 1/3 simulate(DEMO_TWEET)…");
  const before = await captureSimulate(DEMO_TWEET);
  console.log(`  ✓ persona=${before.personas.length}/8, risk source=${before.risk?.source}`);

  console.log("[demo-gen] 2/3 soften(DEMO_TWEET, gerekce)…");
  const soften = await captureSoften(DEMO_TWEET, before.risk?.gerekce);
  console.log(`  ✓ yumusatilmis (${soften.yumusatilmisTweet.length} chars)`);

  console.log("[demo-gen] 3/3 simulate(yumusatilmis)…");
  const after = await captureSimulate(soften.yumusatilmisTweet);
  console.log(`  ✓ persona=${after.personas.length}/8, risk source=${after.risk?.source}`);

  // Sanity: persona count
  if (before.personas.length !== 8 || after.personas.length !== 8) {
    throw new Error("Eksik persona — cache üretimi başarısız sayılır");
  }

  const content = emit({
    demoTweet: DEMO_TWEET,
    before,
    soften,
    after,
  });

  fs.writeFileSync(OUT, content, "utf-8");
  console.log(`\n[demo-gen] yazıldı: ${OUT}`);
  console.log(`[demo-gen] before-risk: V=${before.risk?.virallik} P=${before.risk?.polarizasyon} İ=${before.risk?.itibarRiski}`);
  console.log(`[demo-gen] after-risk : V=${after.risk?.virallik}  P=${after.risk?.polarizasyon}  İ=${after.risk?.itibarRiski}`);
})().catch((err) => {
  console.error("[demo-gen] HATA:", err);
  process.exit(1);
});
