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

  test(`contacto ${lang}: si el POST de la action falla (red caída) la página no se rompe y se conserva lo escrito`, async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`/${lang}`);
    // Server Actions viajan como POST con el header next-action: se abortan como si no hubiera conexión.
    await page.route("**/*", (route) => {
      const request = route.request();
      return request.method() === "POST" && "next-action" in request.headers() ? route.abort() : route.continue();
    });

    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();
    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
    await form.getByLabel(t.messageLabel).fill("Hola, quiero una web app.");
    await page.waitForTimeout(2100);
    await form.getByRole("button", { name: t.submit }).click();

    await expect(form.getByText(t.errors.send_failed, { exact: false })).toBeVisible();
    await expect(form.getByRole("link", { name: t.errors.sendFailedLink })).toBeVisible();
    // Sin el wrapper de la action, Next reemplaza toda la página por su pantalla de error.
    await expect(page.getByText(/This page couldn.t load/)).toHaveCount(0);
    expect(pageErrors).toEqual([]);

    // Conserva lo que la persona escribió y la página sigue interactiva.
    await expect(form.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
    await expect(form.getByLabel(t.emailLabel, { exact: true })).toHaveValue("ana@example.com");
    await expect(form.getByLabel(t.messageLabel)).toHaveValue("Hola, quiero una web app.");
    const button = form.getByRole("button", { name: t.submit });
    await expect(button).toBeEnabled();
    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test 2");
    await expect(form.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test 2");
  });

  test(`contacto ${lang}: el HTML inicial trae los campos de la server action para enviar sin JS`, async ({ request }) => {
    const html = await (await request.get(`/${lang}`)).text();
    // Si el form se arma con un wrapper común en vez de la server action, React los omite.
    expect(html).toMatch(/name="\$ACTION_REF_\d+"/);
    expect(html).toMatch(/name="\$ACTION_\d+:0"/);
    expect(html).not.toContain("React form unexpectedly submitted");
  });

  test.describe(`contacto ${lang}: sin JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("el form se envía igual (progressive enhancement) y muestra el éxito", async ({ page }) => {
      await page.goto(`/${lang}`);
      const form = page.getByRole("form", { name: t.formLabel });
      await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
      await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
      await form.getByRole("button", { name: t.submit }).click();

      await expect(page.getByRole("heading", { name: t.successTitle })).toBeVisible();
      await expect(page.getByRole("form", { name: t.formLabel })).toHaveCount(0);
    });
  });
}
