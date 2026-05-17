// AYNA — Persona JSON parse fallback'inin elle testi.
// Çalıştırma: node scripts/test-json-fallback.js

import { __test__ } from "../server/openrouter.js";

const { parsePersonaJson, normalizePayload, extractJsonBlock } = __test__;

const cases = [
  {
    name: "Düz JSON",
    input: `{"comment":"ne alaka","stance":"alayci","intensity":4,"willEngage":false,"replyType":"reply"}`,
    expectOk: true,
  },
  {
    name: "Markdown fenced JSON",
    input: "```json\n{\"comment\":\"ay aynen\",\"stance\":\"destek\",\"intensity\":2,\"willEngage\":true,\"replyType\":\"reply\"}\n```",
    expectOk: true,
  },
  {
    name: "JSON öncesi/sonrası metin",
    input: 'İşte cevabım: {"comment":"hmm","stance":"notr","intensity":1,"willEngage":false,"replyType":"reply"} umarım yardımcı olur',
    expectOk: true,
  },
  {
    name: "Tamamen bozuk metin",
    input: "bu hiç JSON değil",
    expectOk: false,
  },
  {
    name: "JSON ama eksik alan",
    input: `{"comment":"selam"}`,
    expectOk: true, // normalize default'larla geçer
  },
  {
    name: "JSON ama geçersiz stance",
    input: `{"comment":"x","stance":"asdf","intensity":99,"willEngage":"yes","replyType":"weird"}`,
    expectOk: true, // normalize tüm değerleri sıkıştırır
  },
  {
    name: "Bozuk JSON (eksik kapanış)",
    input: `{"comment":"x", "stance":"notr"`,
    expectOk: false,
  },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  process.stdout.write(`  ${c.name} ... `);
  try {
    const result = parsePersonaJson(c.input);
    if (c.expectOk) {
      console.log("OK", JSON.stringify(result));
      passed++;
    } else {
      console.log("FAIL (beklenirken hata bekleniyordu, parse başarılı oldu)");
      failed++;
    }
  } catch (err) {
    if (!c.expectOk) {
      console.log(`OK (beklenen hata: ${err.message})`);
      passed++;
    } else {
      console.log(`FAIL: ${err.message}`);
      failed++;
    }
  }
}

console.log(`\nToplam: ${passed} ok, ${failed} fail`);
process.exit(failed ? 1 : 0);
