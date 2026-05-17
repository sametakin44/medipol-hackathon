// Mirror — Demo seed screenshot.
// Ruhi Çenet seed chip'ine tıkla, simulate akışını bekle, 1080p PNG kaydet.
// AYNA_DEMO_MODE=1 ile server çalışırken bile bu tweet cache'de OLMADIĞI için
// canlı simülasyon olur — bu yüzden timeout cömert.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../docs/screenshots/step-seed-1080p.png");
const URL = "http://localhost:5173/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: "tr-TR",
  });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });

  // Hazır seed chip'ine tıkla
  const seedChip = page.getByRole("button", { name: /Ruhi Çenet/i });
  await seedChip.waitFor({ state: "visible", timeout: 10_000 });
  await seedChip.click();
  console.log("[shot] Ruhi seed tıklandı");

  // Simüle Et
  await page.getByRole("button", { name: /Simüle Et/i }).click();
  console.log("[shot] Simüle Et tıklandı");

  // Persona stream + council (canlı modda ~25s)
  await page
    .getByText(/canlı modelden üretildi/i)
    .waitFor({ state: "visible", timeout: 180_000 });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`[shot] saved: ${OUT}`);

  await ctx.close();
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
