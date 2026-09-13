import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync(".impeccable/review", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const theme of ["dark", "light"]) {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await page.addInitScript((t) => localStorage.setItem("flexora-theme", t), theme);
    await page.goto("http://localhost:3000/es", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-visible", "")));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `.impeccable/review/${name}-${theme}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
