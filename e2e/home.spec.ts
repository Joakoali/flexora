import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "services", "work", "process", "contact"];

for (const lang of ["es", "en"] as const) {
  test(`home ${lang}: secciones, sin errores, sin scroll horizontal`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(`/${lang}`);
    await expect(page).toHaveTitle(/Flexora/);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    for (const id of SECTIONS) await expect(page.locator(`#${id}`)).toBeAttached();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeAttached();
    await expect(page.locator(".marquee")).toBeAttached();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test("/ redirige según Accept-Language", async ({ browser }) => {
  const en = await browser.newContext({ locale: "en-US", extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" } });
  const p1 = await en.newPage();
  await p1.goto("/");
  await expect(p1).toHaveURL(/\/en$/);
  await en.close();

  const es = await browser.newContext({ locale: "es-AR", extraHTTPHeaders: { "Accept-Language": "es-AR,es;q=0.9" } });
  const p2 = await es.newPage();
  await p2.goto("/");
  await expect(p2).toHaveURL(/\/es$/);
  await es.close();
});

test("el CTA del header lleva a WhatsApp", async ({ page }) => {
  await page.goto("/es");
  const cta = page.getByRole("banner").getByRole("link", { name: "Hablemos" });
  await expect(cta).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
});
