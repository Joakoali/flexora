import { expect, test } from "@playwright/test";

test.describe(() => {
  test.use({ colorScheme: "dark" });
  test("el switch cambia el tema y persiste tras recargar", async ({ page }) => {
    await page.goto("/es");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.locator("[data-theme-switch]").click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });
});

test("sin elección guardada respeta el sistema", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await ctx.close();
});

test("el cambio de idioma conserva la ruta", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
