import { expect, test, type Locator } from "@playwright/test";
import { effectiveOpacity } from "./helpers";
import es from "../app/[lang]/dictionaries/es.json";
import en from "../app/[lang]/dictionaries/en.json";
import ca from "../app/[lang]/dictionaries/ca.json";

const DICTS = { es, en, ca } as const;

// El time-gate de 2 s corre desde que el effect de montaje setea startedAt (hidratación), no desde goto:
// se espera sobre ese mismo valor en vez de dormir un tiempo fijo.
async function waitTimeGate(form: Locator) {
  const startedAt = form.locator('input[name="startedAt"]');
  await expect
    .poll(
      async () => {
        const value = await startedAt.inputValue();
        return value ? Date.now() - Number(value) : 0; // vacío = todavía no hidrató
      },
      // Hidratar (con el fondo WebGL por software) + 2 s puede pasar los 5 s por defecto.
      { timeout: 10_000, intervals: [100] },
    )
    .toBeGreaterThan(2000);
}

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
    await waitTimeGate(form);
    await form.getByRole("button", { name: t.submit }).click();

    const title = page.getByRole("heading", { name: t.successTitle });
    await expect(title).toBeVisible();
    await expect(title).toBeFocused();
    await expect(page.getByRole("form", { name: t.formLabel })).toHaveCount(0);

    await page.getByRole("button", { name: t.sendAnother }).click();
    const again = page.getByRole("form", { name: t.formLabel });
    await expect(again.getByLabel(t.nameLabel, { exact: true })).toHaveValue("");
    // El botón enfocado se desmontó: el foco no puede quedar en <body>.
    await expect(again.getByLabel(t.nameLabel, { exact: true })).toBeFocused();
  });

  test(`contacto ${lang}: al cargar la página, incluso llegando por #contact, no roba el foco`, async ({ page }) => {
    await page.goto(`/${lang}#contact`);
    const form = page.getByRole("form", { name: t.formLabel });
    const name = form.getByLabel(t.nameLabel, { exact: true });
    await expect(name).toBeVisible();
    // Con startedAt seteado ya corrieron los effects de montaje: uno de foco mal puesto correría en el mismo
    // flush, así que el not.toBeFocused() de abajo no puede dar un falso verde por llegar antes de tiempo.
    await expect(form.locator('input[name="startedAt"]')).toHaveValue(/^\d+$/);
    await expect(name).not.toBeFocused();
  });

  test(`contacto ${lang}: email que pasa el navegador pero no el servidor muestra el error y conserva el nombre`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    // type=email del navegador acepta "ana@example"; el servidor exige un punto en el dominio.
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example");
    await waitTimeGate(form);
    await form.getByRole("button", { name: t.submit }).click();

    await expect(form.getByText(t.errors.invalid)).toBeVisible();
    await expect(form.getByLabel(t.emailLabel, { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
  });

  test(`contacto ${lang}: el live region del error de envío está siempre en el árbol y vacío no ocupa lugar`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    const status = form.locator('[aria-live="polite"]');
    await expect(status).toBeAttached();
    await expect(status).toHaveText("");
    // display:none o visibility:hidden lo sacan del árbol de accesibilidad y el aviso no se anuncia.
    await expect(status).not.toHaveCSS("display", "none");
    await expect(status).not.toHaveCSS("visibility", "hidden");

    // Sin huella visual: entre el mensaje y el botón queda un solo gap del form, como si no existiera.
    const layout = await form.evaluate((el) => {
      const textarea = el.querySelector("textarea")!.getBoundingClientRect();
      const submit = el.querySelector('button[type="submit"]')!.getBoundingClientRect();
      const live = el.querySelector('[aria-live="polite"]')!.getBoundingClientRect();
      return { distance: submit.top - textarea.bottom, rowGap: parseFloat(getComputedStyle(el).rowGap), liveHeight: live.height };
    });
    expect(layout.liveHeight).toBe(0);
    expect(layout.distance).toBeCloseTo(layout.rowGap, 1);
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
    await waitTimeGate(form);
    await form.getByRole("button", { name: t.submit }).click();

    await expect(form.getByText(t.errors.send_failed, { exact: false })).toBeVisible();
    // Con el error visible, entre el mensaje y el botón también queda un solo gap del form (el margen del mensaje).
    const withError = await form.evaluate((el) => {
      const message = el.querySelector('[aria-live="polite"] p')!.getBoundingClientRect();
      const submit = el.querySelector('button[type="submit"]')!.getBoundingClientRect();
      return { distance: submit.top - message.bottom, rowGap: parseFloat(getComputedStyle(el).rowGap) };
    });
    expect(withError.distance).toBeCloseTo(withError.rowGap, 1);
    await expect(form.getByRole("link", { name: t.errors.sendFailedLink })).toBeVisible();
    // El mensaje entró en el mismo live region que ya estaba montado.
    await expect(form.locator('[aria-live="polite"]')).toContainText(t.errors.send_failed);
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
      // toBeVisible() ignora la opacidad: sin Reveal.visible el form estaba en opacity 0 y el test daba verde.
      expect(await effectiveOpacity(form), "opacidad efectiva del formulario").toBe(1);
      expect(await effectiveOpacity(form.getByRole("button", { name: t.submit })), "opacidad efectiva del botón").toBe(1);
      await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
      await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
      await form.getByRole("button", { name: t.submit }).click();

      const title = page.getByRole("heading", { name: t.successTitle });
      await expect(title).toBeVisible();
      expect(await effectiveOpacity(title), "opacidad efectiva del éxito").toBe(1);
      await expect(page.getByRole("form", { name: t.formLabel })).toHaveCount(0);
    });
  });
}
