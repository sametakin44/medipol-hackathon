// AYNA — Türkçe doğallık testi (model × prompt matrisi).
//
// Çalıştırma:
//   node scripts/turkce-test.js
// veya
//   node --env-file=.env scripts/turkce-test.js
//
// .env içinde OPENROUTER_API_KEY tanımlı olmalı.
// Çıktı: scripts/turkce-test-sonuc.html (model × prompt matrisi).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv } from "../server/loadEnv.js";
loadDotEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_HTML = path.resolve(__dirname, "turkce-test-sonuc.html");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";

// Test edilecek aday modeller. OpenRouter slug'ları zamanla değişebilir;
// script çalışmadan önce /api/v1/models endpoint'inden mevcudiyet kontrol edilir,
// bulunmayanlar atlanır ve raporda belirtilir.
const CANDIDATE_MODELS = [
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini",
  "google/gemma-3-27b-it",
  "qwen/qwen-2.5-72b-instruct",
  "meta-llama/llama-3.1-70b-instruct",
];

const PROMPTS = [
  {
    id: "argo",
    label: "Argo",
    user: "Bir gence ait, kızgın ama esprili, argo içeren kısa bir tweet yorumu yaz. SADECE yorumu yaz, başlık koyma, tırnak koyma. 1-2 cümle.",
  },
  {
    id: "sarkazm",
    label: "Sarkazm",
    user: "Alaycı, iğneleyici ama kibar görünen kısa bir alıntı tweet yaz. SADECE tweet metnini yaz, başlık koyma, tırnak koyma. 1-2 cümle.",
  },
  {
    id: "persona",
    label: "Persona (endişeli ebeveyn)",
    user: "Endişeli bir ebeveynin samimi, kısa sosyal medya yorumunu yaz. SADECE yorumu yaz, başlık koyma, tırnak koyma. 1-2 cümle.",
  },
];

const SYSTEM = "Sen Türkçe yazan, Türkiye'de yaşayan bir Twitter kullanıcısısın. Cevapların doğal Türk insanının yazışına benzemeli; çeviri kokmamalı.";

function buildHeaders() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !key.trim()) {
    throw new Error("OPENROUTER_API_KEY tanımsız. .env dosyasına ekleyin.");
  }
  return {
    Authorization: `Bearer ${key.trim()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost:5173",
    "X-Title": process.env.OPENROUTER_APP_NAME || "AYNA-Turkce-Test",
  };
}

async function fetchAvailableModels() {
  // Bu endpoint anahtar zorunlu değil; yine de header'ı eklemek bir şeyi bozmaz.
  const headers = {};
  try {
    headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY?.trim() ?? ""}`;
  } catch {
    // ignore
  }
  const res = await fetch(MODELS_URL, { headers });
  if (!res.ok) {
    throw new Error(`Model listesi alınamadı: HTTP ${res.status}`);
  }
  const json = await res.json();
  const ids = new Set((json?.data ?? []).map((m) => m.id));
  return ids;
}

async function callModel({ model, userPrompt }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content?.trim();
    if (!content) return { ok: false, error: "boş içerik" };
    return { ok: true, text: content };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    clearTimeout(t);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHtml({ models, skipped, results }) {
  const head = `
<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>AYNA — Türkçe model doğallık testi</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; background:#0b0d10; color:#e7e9ea; margin:24px; }
  h1 { font-weight:600; letter-spacing:-.02em; }
  .meta { color:#9aa0a6; font-size:13px; margin-bottom:16px; }
  table { border-collapse: collapse; width:100%; }
  th, td { border:1px solid #2a2d31; padding:12px; vertical-align:top; }
  th { background:#15181c; text-align:left; font-weight:600; }
  td.model { background:#0f1216; font-weight:600; width:220px; }
  td.cell { white-space:pre-wrap; font-size:14px; line-height:1.5; max-width:420px; }
  .err { color:#ef4444; font-size:12px; }
  .skipped { margin-top:24px; padding:12px; background:#1a1410; border:1px solid #3a2820; color:#fbbf24; font-size:13px; }
  .ts { color:#71767b; font-size:11px; }
</style>
</head>
<body>
<h1>AYNA — Türkçe model doğallık testi</h1>
<div class="meta">
  Tarih: ${new Date().toISOString()} · ${models.length} model × ${PROMPTS.length} prompt
</div>
`;

  const promptHeaders = PROMPTS.map(
    (p) => `<th>${escapeHtml(p.label)}</th>`
  ).join("");

  const rows = models
    .map((model) => {
      const cells = PROMPTS.map((p) => {
        const r = results[`${model}::${p.id}`];
        if (!r) return `<td class="cell"><span class="err">çalıştırılmadı</span></td>`;
        if (!r.ok) return `<td class="cell"><span class="err">${escapeHtml(r.error)}</span></td>`;
        return `<td class="cell">${escapeHtml(r.text)}</td>`;
      }).join("");
      return `<tr><td class="model">${escapeHtml(model)}</td>${cells}</tr>`;
    })
    .join("");

  const skippedBlock = skipped.length
    ? `<div class="skipped">⚠️ Atlanan modeller (OpenRouter'da bulunamadı veya hata): <br>${skipped
        .map((s) => `<code>${escapeHtml(s.model)}</code> — ${escapeHtml(s.reason)}`)
        .join("<br>")}</div>`
    : "";

  return `${head}
<table>
  <thead><tr><th>Model</th>${promptHeaders}</tr></thead>
  <tbody>${rows}</tbody>
</table>
${skippedBlock}
<p class="ts">Çıktı dosyası: scripts/turkce-test-sonuc.html</p>
</body>
</html>`;
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    console.error("HATA: OPENROUTER_API_KEY .env içinde tanımsız.");
    console.error("Çözüm: .env.example dosyasını .env olarak kopyalayın ve OPENROUTER_API_KEY satırını doldurun.");
    process.exit(1);
  }

  console.log("OpenRouter model listesi alınıyor…");
  let available;
  try {
    available = await fetchAvailableModels();
  } catch (err) {
    console.error("Model listesi alınamadı, slug doğrulaması atlanıyor:", err.message);
    available = null;
  }

  const skipped = [];
  const okModels = [];
  for (const m of CANDIDATE_MODELS) {
    if (available && !available.has(m)) {
      skipped.push({ model: m, reason: "OpenRouter slug listesinde yok" });
      continue;
    }
    okModels.push(m);
  }

  console.log(`Test edilecek: ${okModels.length} model, atlanan: ${skipped.length}`);
  if (skipped.length) {
    skipped.forEach((s) => console.log(`  - atlandı: ${s.model} (${s.reason})`));
  }

  // model × prompt matrisini paralel topla (toplam = okModels.length * PROMPTS.length çağrı)
  const jobs = [];
  for (const model of okModels) {
    for (const p of PROMPTS) {
      jobs.push(
        callModel({ model, userPrompt: p.user }).then((r) => ({
          key: `${model}::${p.id}`,
          r,
          model,
          promptId: p.id,
        }))
      );
    }
  }

  const settled = await Promise.all(jobs);
  const results = {};
  for (const { key, r, model, promptId } of settled) {
    results[key] = r;
    if (r.ok) {
      console.log(`✓ ${model} [${promptId}] (${r.text.length} karakter)`);
    } else {
      console.log(`✗ ${model} [${promptId}] — ${r.error}`);
    }
  }

  const html = renderHtml({ models: okModels, skipped, results });
  fs.writeFileSync(OUTPUT_HTML, html, "utf-8");
  console.log(`\nÇıktı yazıldı: ${OUTPUT_HTML}`);
}

main().catch((err) => {
  console.error("Beklenmedik hata:", err);
  process.exit(1);
});
