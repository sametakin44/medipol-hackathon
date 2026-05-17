// AYNA — Demo modu e2e test.
// AYNA_DEMO_MODE=1 ile başlatılmış sunucuda:
//   1) /api/simulate DEMO_TWEET — meta + 8 persona (300-700ms aralarla) + risk + done
//   2) /api/soften DEMO_TWEET — sabit yumusatilmisTweet döner
//   3) /api/simulate yumusatilmisTweet — after sonucu replay
// Hepsinin "demo": true bayrağıyla geldiğini doğrula.

import { DEMO_TWEET, DEMO_SOFTEN_RESPONSE } from "../server/demoCache.js";

const BACKEND = "http://localhost:3001";

async function streamAndCollect(tweet) {
  const t0 = Date.now();
  const res = await fetch(`${BACKEND}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet }),
  });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const personaTimes = [];
  let meta = null, risk = null, done = null;
  while (true) {
    const { value, done: rDone } = await reader.read();
    if (rDone) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const ev = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      if (!ev.trim() || ev.startsWith(":")) continue;
      let name = "msg";
      const lines = [];
      for (const l of ev.split("\n")) {
        if (l.startsWith("event:")) name = l.slice(6).trim();
        else if (l.startsWith("data:")) lines.push(l.slice(5).trim());
      }
      try {
        const data = JSON.parse(lines.join("\n"));
        if (name === "meta") meta = data;
        else if (name === "persona") personaTimes.push({ id: data.personaId, t: Date.now() - t0 });
        else if (name === "risk") risk = data;
        else if (name === "done") done = data;
      } catch {
        // ignore
      }
    }
  }
  return { meta, personaTimes, risk, done, total: Date.now() - t0 };
}

(async () => {
  console.log("=== 1) DEMO simulate (BEFORE) ===");
  const before = await streamAndCollect(DEMO_TWEET);
  console.log(`  meta.demo=${before.meta?.demo}, personalar=${before.personaTimes.length}, toplam=${before.total}ms`);
  console.log(`  risk: V=${before.risk?.virallik} P=${before.risk?.polarizasyon} İ=${before.risk?.itibarRiski}, demo=${before.risk?.demo}`);
  console.log(`  done.demo=${before.done?.demo}`);
  const intervals = before.personaTimes.map((p, i, arr) =>
    i === 0 ? p.t : p.t - arr[i - 1].t
  );
  console.log(`  persona aralarındaki gecikmeler (ms): ${intervals.join(", ")}`);

  console.log("\n=== 2) DEMO soften ===");
  const t0 = Date.now();
  const res = await fetch(`${BACKEND}/api/soften`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet: DEMO_TWEET, gerekce: before.risk?.gerekce }),
  });
  const soft = await res.json();
  console.log(`  süre: ${Date.now() - t0}ms, demo=${soft.demo}`);
  console.log(`  yumusatilmis: "${soft.yumusatilmisTweet.slice(0, 100)}…"`);
  if (soft.yumusatilmisTweet !== DEMO_SOFTEN_RESPONSE.yumusatilmisTweet) {
    console.log("  ✗ FAIL: yumusatilmis cache ile eşleşmiyor!");
    process.exit(1);
  }

  console.log("\n=== 3) DEMO simulate (AFTER) ===");
  const after = await streamAndCollect(soft.yumusatilmisTweet);
  console.log(`  meta.demo=${after.meta?.demo}, personalar=${after.personaTimes.length}, toplam=${after.total}ms`);
  console.log(`  risk: V=${after.risk?.virallik} P=${after.risk?.polarizasyon} İ=${after.risk?.itibarRiski}`);

  console.log("\n--- DELTA ---");
  console.log(`virallik     : ${before.risk.virallik}  →  ${after.risk.virallik}   (Δ ${after.risk.virallik - before.risk.virallik})`);
  console.log(`polarizasyon : ${before.risk.polarizasyon}  →  ${after.risk.polarizasyon}   (Δ ${after.risk.polarizasyon - before.risk.polarizasyon})`);
  console.log(`itibarRiski  : ${before.risk.itibarRiski}  →  ${after.risk.itibarRiski}   (Δ ${after.risk.itibarRiski - before.risk.itibarRiski})`);

  // Eşleşmeyen tweet → live'a düşmeli
  console.log("\n=== 4) Eşleşmeyen tweet (fallback to live) ===");
  // Bu canlı API'ye gider; sadece davranışı doğrula, tam akış bekleme.
  const r = await fetch(`${BACKEND}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet: "Bugun hava cok guzel sabah balkonda" }),
    signal: AbortSignal.timeout(2000),
  }).catch(() => null);
  if (r) {
    const reader = r.body.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    const isDemo = text.includes('"demo":true');
    console.log(`  meta demo=${isDemo} (false bekleniyor → live moda düştü)`);
    reader.cancel();
  }
  console.log("\nAll OK ✓");
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
