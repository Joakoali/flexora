import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const lang of ["es", "en"] as const) {
  test(`axe sin violaciones en /${lang}`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("el teclado llega al CTA de WhatsApp del header", async ({ page }) => {
  await page.goto("/es");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.href ?? "");
    if (href.startsWith("https://wa.me/")) return;
  }
  throw new Error("El CTA de WhatsApp no recibió foco en 12 tabs");
});
