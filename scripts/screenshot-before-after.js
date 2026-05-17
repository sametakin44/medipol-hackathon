// AYNA — Adım 5 "Yumuşat" before/after money shot.
//
// Akış:
//   1) Sayfayı aç
//   2) Kutuplaştırıcı tweet'i textarea'ya yaz
//   3) Simüle Et — done bekle ("canlı modelden üretildi")
//   4) "Yumuşat ve tekrar dene" butonuna bas
//   5) Otomatik yeni simulate done bekle (göstergede önce → sonra delta görünür)
//   6) PNG kaydet → docs/screenshots/step5-money-shot.png

import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function argFor(name, fallback) {
  for (const a of process.argv.slice(2)) {
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return fallback;
}

const URL = argFor("url", "http://localhost:5173/");
const TWEET = argFor(
  "tweet",
  "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak."
);
const OUT = path.resolve(
  __dirname,
  "..",
  argFor("out", "docs/screenshots/step5-money-shot.png")
);

(async () => {
  console.log(`[shot] hedef: ${URL}`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
    locale: "tr-TR",
  });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") console.log(`[browser:${t}] ${msg.text()}`);
  });

  await page.goto(URL, { waitUntil: "networkidle" });

  // Tweet yaz
  const textarea = page.locator("textarea").first();
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  await textarea.click({ clickCount: 3 });
  await page.keyboard.press("Delete");
  await textarea.type(TWEET, { delay: 4 });

  // Simüle Et
  const simulate = page.getByRole("button", { name: /Simüle Et/i });
  await simulate.click();
  console.log("[shot] Simüle Et tıklandı");

  // İlk done — risk paneli dolar, council ~22s, buffer 120s
  await page
    .getByText(/canlı modelden üretildi/i)
    .waitFor({ state: "visible", timeout: 120_000 });
  console.log("[shot] ilk simulate tamamlandı");
  await page.waitForTimeout(800);

  // Yumuşat butonu
  const yumusat = page.getByRole("button", { name: /Yumuşat ve tekrar dene/i });
  await yumusat.waitFor({ state: "visible", timeout: 10_000 });
  await yumusat.click();
  console.log("[shot] Yumuşat tıklandı");

  // /api/soften ~2-5s, ardından otomatik simulate ~22s; total budget 150s
  // "Geri al" butonu before/after state'inin geldiğinin sinyali
  await page
    .getByRole("button", { name: /Geri al/i })
    .waitFor({ state: "visible", timeout: 150_000 });
  console.log("[shot] before/after gözüktü");

  // Yeni simulate'in done olduğundan emin ol
  await page
    .getByText(/canlı modelden üretildi/i)
    .waitFor({ state: "visible", timeout: 120_000 });
  console.log("[shot] ikinci simulate tamamlandı");

  // Animasyon settle
  await page.waitForTimeout(2200);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`[shot] kaydedildi: ${OUT}`);

  await ctx.close();
  await browser.close();
})().catch((err) => {
  console.error("[shot] hata:", err);
  process.exit(1);
});
