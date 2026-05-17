// AYNA — 1080p (1920×1080) demo modu money shot.
// Sağ panelin scroll OLMADAN tam sığdığını gösterir.
// Çalıştırmadan önce: AYNA_DEMO_MODE=1 ile server'ı başlat (deterministik).

import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(
  __dirname,
  "..",
  "docs/screenshots/step-final-1080p.png"
);
const URL = process.env.URL || "http://localhost:5173/";
const TWEET =
  "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak.";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "tr-TR",
  });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });

  const textarea = page.locator("textarea").first();
  await textarea.click({ clickCount: 3 });
  await page.keyboard.press("Delete");
  await textarea.type(TWEET, { delay: 3 });

  await page.getByRole("button", { name: /Simüle Et/i }).click();
  await page
    .getByText(/canlı modelden üretildi/i)
    .waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: /Yumuşat ve tekrar dene/i }).click();
  await page
    .getByRole("button", { name: /Geri al/i })
    .waitFor({ state: "visible", timeout: 60_000 });
  await page
    .getByText(/canlı modelden üretildi/i)
    .waitFor({ state: "visible", timeout: 60_000 });

  // Animasyonların oturması için bekle
  await page.waitForTimeout(2500);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`saved: ${OUT}`);

  await ctx.close();
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
