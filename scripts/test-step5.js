// AYNA — Adım 5 entegrasyon testleri.
// 1) Kutuplaştırıcı tweet ile council çalıştır → 3 üyenin (A, B, C) skor ürettiğini doğrula.
// 2) Aynı tweet'i hemen tekrar çalıştır → cache hit logla.
// 3) /api/soften çağır → yeni tweet ürettir.
// 4) Yumuşatılmış tweet'i simulate et → before/after skor karşılaştırması.
// 5) Mizahçı persona çıktısını topla.

const POLARIZING = "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak.";

async function runSim(tweet) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:3001/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet }),
  });
  if (!res.ok) throw new Error(`simulate HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
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
        if (eventName === "persona") personas.push(data);
        if (eventName === "risk") risk = data;
        if (eventName === "done") done = data;
      } catch {
        // ignore
      }
    }
  }
  return { tweet, personas, risk, done, elapsed: Date.now() - t0 };
}

async function softenTweet(tweet, gerekce) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:3001/api/soften", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet, gerekce }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`soften HTTP ${res.status}: ${j?.error || ""}`);
  }
  const j = await res.json();
  return { ...j, elapsed: Date.now() - t0 };
}

(async () => {
  console.log("=== 1) KUTUPLAŞTIRICI tweet — ilk simülasyon (cache MISS bekleniyor) ===");
  console.log(`Tweet: "${POLARIZING}"`);
  const first = await runSim(POLARIZING);
  console.log(`personalar: ${first.personas.length}/8, toplam: ${first.elapsed}ms`);
  console.log(
    `RİSK (source=${first.risk?.source}, fromCache=${first.risk?.fromCache ?? false}, cacheState=${first.done?.cacheState}):` +
      `  V=${first.risk?.virallik} P=${first.risk?.polarizasyon} İ=${first.risk?.itibarRiski}`
  );

  console.log("\n--- mizahçı persona çıktısı (Sharp model sonrası) ---");
  const mizah1 = first.personas.find((p) => p.personaId === "esprili-mizahci");
  if (mizah1) {
    console.log(`  model=${mizah1.model} (${mizah1.roleKey})`);
    console.log(`  yorum: "${mizah1.comment}"`);
  }

  console.log("\n=== 2) Aynı tweet — ikinci simülasyon (cache HIT bekleniyor) ===");
  const second = await runSim(POLARIZING);
  console.log(`personalar: ${second.personas.length}/8, toplam: ${second.elapsed}ms`);
  console.log(
    `cacheState=${second.done?.cacheState}, fromCache=${second.risk?.fromCache ?? false}` +
      `  → V=${second.risk?.virallik} P=${second.risk?.polarizasyon} İ=${second.risk?.itibarRiski}`
  );

  console.log("\n=== 3) /api/soften — orchestrator tweet'i yeniden yazıyor ===");
  const soft = await softenTweet(POLARIZING, first.risk?.gerekce);
  console.log(`süre: ${soft.elapsed}ms, model: ${soft.model}`);
  console.log(`yumusatilmisTweet: "${soft.yumusatilmisTweet}"`);
  console.log(`neDegisti: "${soft.neDegisti}"`);

  console.log("\n=== 4) Yumuşatılmış tweet'i simulate — before/after karşılaştırma ===");
  const after = await runSim(soft.yumusatilmisTweet);
  console.log(`personalar: ${after.personas.length}/8, toplam: ${after.elapsed}ms`);
  console.log(
    `RİSK: V=${after.risk?.virallik} P=${after.risk?.polarizasyon} İ=${after.risk?.itibarRiski}` +
      `  (source=${after.risk?.source}, cacheState=${after.done?.cacheState})`
  );

  console.log("\n--- DELTA (önce → sonra) ---");
  const before = first.risk;
  const aft = after.risk;
  console.log(`virallik     : ${before.virallik}  →  ${aft.virallik}   (Δ ${aft.virallik - before.virallik})`);
  console.log(`polarizasyon : ${before.polarizasyon}  →  ${aft.polarizasyon}   (Δ ${aft.polarizasyon - before.polarizasyon})`);
  console.log(`itibarRiski  : ${before.itibarRiski}  →  ${aft.itibarRiski}   (Δ ${aft.itibarRiski - before.itibarRiski})`);

  const mizah2 = after.personas.find((p) => p.personaId === "esprili-mizahci");
  if (mizah2) {
    console.log(`\nmizahçı (yumuşatılmış tweet'e tepki): "${mizah2.comment}"`);
  }

  // 3 council üyesinin de skor ürettiğini doğrulamak için server log'una bakılır.
  console.log("\nNot: 3 council üyesinin skor ürettiği server log'undan doğrulanır ([council] stage1 ok: ...).");
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
