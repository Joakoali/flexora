import { expect, test } from "@playwright/test";
import es from "../app/[lang]/dictionaries/es.json";
import en from "../app/[lang]/dictionaries/en.json";
import ca from "../app/[lang]/dictionaries/ca.json";

const DICTS = { es, en, ca } as const;

for (const lang of ["es", "en", "ca"] as const) {
  const t = DICTS[lang].closing.form;

  test(`contacto ${lang}: envío correcto muestra el éxito y permite enviar otro`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
    await form.getByRole("checkbox", { name: t.projectTypes.webapp }).check();
    await form.getByRole("checkbox", { name: t.projectTypes.ecommerce }).check();
    await form.getByLabel(t.messageLabel).fill("Hola, quiero una web app.");

    // Tiempo mínimo anti-bot: 2000 ms desde el montaje.
    await page.waitForTimeout(2100);
    await form.getByRole("button", { name: t.submit }).click();

    const title = page.getByRole("heading", { name: t.successTitle });
    await expect(title).toBeVisible();
    await expect(title).toBeFocused();
    await expect(page.getByRole("form", { name: t.formLabel })).toHaveCount(0);

    await page.getByRole("button", { name: t.sendAnother }).click();
    const again = page.getByRole("form", { name: t.formLabel });
    await expect(again.getByLabel(t.nameLabel, { exact: true })).toHaveValue("");
  });

  test(`contacto ${lang}: email que pasa el navegador pero no el servidor muestra el error y conserva el nombre`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    // type=email del navegador acepta "ana@example"; el servidor exige un punto en el dominio.
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example");
    await page.waitForTimeout(2100);
    await form.getByRole("button", { name: t.submit }).click();

    await expect(form.getByText(t.errors.invalid)).toBeVisible();
    await expect(form.getByLabel(t.emailLabel, { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
  });
}
