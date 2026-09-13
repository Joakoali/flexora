import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
for (const lang of ["es", "en"]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/${lang}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `public/og-${lang}.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
}
await browser.close();
console.log("OG images written");
