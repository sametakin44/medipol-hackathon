// AYNA — Adım 3 "money shot" ekran görüntüsü.
// http://localhost:5173 üzerinden:
//   1) Sayfayı aç
//   2) Önceden yüklü örnek tweet'i kullan ya da yeni bir tweet yaz
//   3) "Simüle Et"e bas
//   4) "done" durumu için 8 personaya kadar bekle (max 60 sn)
//   5) Tam ekran (1600x900) PNG kaydet → docs/screenshots/step3-money-shot.png
//
// Çalıştırma:
//   node scripts/screenshot.js [--tweet="..." ] [--out=path.png]

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
  "Yapay zeka artık tüm yazarları işsiz bırakacak. Bence 5 yıl içinde edebiyat ölür."
);
const OUT = path.resolve(
  __dirname,
  "..",
  argFor("out", "docs/screenshots/step3-money-shot.png")
);

(async () => {
  console.log(`[shot] hedef: ${URL}`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
    locale: "tr-TR",
  });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    const t = msg.type();
    if (t === "error" || t === "warning") {
      console.log(`[browser:${t}] ${msg.text()}`);
    }
  });
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) {
      console.log(`[shot] page navigated → ${f.url()}`);
    }
  });
  page.on("load", () => console.log("[shot] page load event"));

  await page.goto(URL, { waitUntil: "networkidle" });

  // Textarea'yı bul ve tweet'i yaz
  const textarea = page.locator("textarea").first();
  await textarea.waitFor({ state: "visible", timeout: 10_000 });
  // React controlled input için: önce fokus, sonra triple-click ile seç, sonra type.
  await textarea.click({ clickCount: 3 });
  await page.keyboard.press("Delete");
  await textarea.type(TWEET, { delay: 4 });
  // Doğrulama
  const filledValue = await textarea.inputValue();
  console.log(`[shot] textarea içeriği (${filledValue.length} char): ${filledValue.slice(0, 60)}…`);

  // "Simüle Et" butonu
  const button = page.getByRole("button", { name: /Simüle Et/i });
  await button.waitFor({ state: "visible", timeout: 5_000 });
  await button.click();
  console.log("[shot] Simüle Et tıklandı");

  // Council eklenince toplam süre ~25s. 90s timeout güvenli.
  try {
    await page.getByText(/canlı modelden üretildi/i).waitFor({
      state: "visible",
      timeout: 90_000,
    });
    console.log("[shot] streaming + council tamamlandı");
  } catch {
    console.log("[shot] timeout: 'canlı modelden üretildi' görünmedi; yine de ekran görüntüsü alınacak");
  }

  // Risk gauge animasyonlarının da bitmesi için biraz daha bekle
  await page.waitForTimeout(2000);

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`[shot] kaydedildi: ${OUT}`);

  await ctx.close();
  await browser.close();
})().catch((err) => {
  console.error("[shot] hata:", err);
  process.exit(1);
});
