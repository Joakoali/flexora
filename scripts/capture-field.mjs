import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const theme of ["dark", "light"]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript((t) => localStorage.setItem("flexora-theme", t), theme);
  await page.goto(`${base}/es`, { waitUntil: "networkidle" });
  await page.mouse.move(1000, 380);
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      .site-header, .hero__content { visibility: hidden !important; }
    `;
    document.head.appendChild(style);
  });
  await page.waitForTimeout(1500);
  const canvas = page.locator('[data-variant="hero"] canvas');
  await canvas.screenshot({ path: `public/field-fallback-${theme}.jpg`, type: "jpeg", quality: 82 });
  await page.close();
}
await browser.close();
console.log("field fallbacks written");
