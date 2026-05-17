// AYNA — Calm vs polarizing tweet risk skor karşılaştırması.
//
// İki tweet'i sırayla /api/simulate'a gönderir, SSE akışını okur, final risk skorlarını basar.

const TWEETS = [
  {
    label: "SAKİN",
    text: "Bugün hava çok güzel, sabah balkonda kahvemi içtim. Güzel bir gün olacak.",
  },
  {
    label: "KUTUPLAŞTIRICI",
    text: "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak.",
  },
];

async function runOne({ label, text }) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:3001/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tweet: text }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let personaCount = 0;
  let risk = null;
  let done = null;
  let errPayload = null;
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
        if (eventName === "persona") personaCount++;
        if (eventName === "risk") risk = data;
        if (eventName === "done") done = data;
        if (eventName === "error") errPayload = data;
      } catch {
        // ignore
      }
    }
  }

  const elapsed = Date.now() - t0;
  return { label, text, personaCount, risk, done, errPayload, elapsed };
}

(async () => {
  for (const t of TWEETS) {
    console.log(`\n=== ${t.label} ===`);
    console.log(`Tweet: "${t.text}"`);
    try {
      const r = await runOne(t);
      console.log(`personalar: ${r.personaCount}/8, toplam: ${r.elapsed}ms`);
      if (r.errPayload) {
        console.log("ERROR:", r.errPayload);
      } else if (r.risk) {
        console.log(
          `RİSK  → virallik=${r.risk.virallik}  polarizasyon=${r.risk.polarizasyon}  itibarRiski=${r.risk.itibarRiski}  (source=${r.risk.source})`
        );
        if (r.risk.gerekce) {
          if (typeof r.risk.gerekce === "object") {
            console.log("       Gerekçe:");
            console.log(`         virallik     : ${r.risk.gerekce.virallik}`);
            console.log(`         polarizasyon : ${r.risk.gerekce.polarizasyon}`);
            console.log(`         itibarRiski  : ${r.risk.gerekce.itibarRiski}`);
          } else {
            console.log(`       Gerekçe: ${r.risk.gerekce}`);
          }
        }
        if (r.risk.president) {
          console.log(`       Başkan: ${r.risk.president}  (council ${r.risk.elapsedMs}ms)`);
        }
      } else {
        console.log("(risk event gelmedi)");
      }
    } catch (err) {
      console.log("FAIL:", err.message);
    }
  }
})();
