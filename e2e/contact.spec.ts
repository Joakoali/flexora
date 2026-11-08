import { expect, test, type Locator, type Page } from "@playwright/test";
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

    // El POST sin JS recarga la página: sin un permalink a #contact el navegador la deja en el tope y la
    // persona no ve ni el éxito ni el error de campo, que quedan más abajo.
    test("tras enviar con éxito la página queda en #contact y el éxito se ve", async ({ page }) => {
      await page.goto(`/${lang}`);
      const form = page.getByRole("form", { name: t.formLabel });
      await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
      await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
      await form.getByRole("button", { name: t.submit }).click();

      const title = page.getByRole("heading", { name: t.successTitle });
      await expect(title).toBeVisible();
      expect(page.url()).toMatch(new RegExp(`/${lang}#contact$`));
      expect(await page.evaluate(() => window.scrollY), "la página no debe volver al tope").toBeGreaterThan(0);
      await expect(title).toBeInViewport({ ratio: 1 });
    });

    test("tras un error de campo la página queda en #contact, con el error a la vista y lo escrito conservado", async ({
      page,
    }) => {
      await page.goto(`/${lang}`);
      const form = page.getByRole("form", { name: t.formLabel });
      await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
      // type=email del navegador acepta "ana@example"; el servidor exige un punto en el dominio.
      await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example");
      await form.getByRole("button", { name: t.submit }).click();

      const error = page.getByRole("form", { name: t.formLabel }).getByText(t.errors.invalid);
      await expect(error).toBeVisible();
      expect(page.url()).toMatch(new RegExp(`/${lang}#contact$`));
      expect(await page.evaluate(() => window.scrollY), "la página no debe volver al tope").toBeGreaterThan(0);
      await expect(error).toBeInViewport({ ratio: 1 });
      const again = page.getByRole("form", { name: t.formLabel });
      await expect(again.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
      await expect(again.getByLabel(t.emailLabel, { exact: true })).toHaveValue("ana@example");
    });
  });
}

// WCAG 2.4.11 (foco no oculto): el header fijo (72 px) y el botón flotante de WhatsApp no pueden tapar el
// elemento enfocado. Sin scroll-padding el navegador da por "visible" todo lo que está dentro de la ventana,
// aunque esté debajo del header o del botón, y no scrollea. Se mide en una ventana baja (844x390), donde el
// form no entra entero y el borde inferior es el caso malo.
test.describe("contacto: el foco no queda tapado por el header fijo ni por el botón flotante", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  const t = es.closing.form;
  type Box = { x: number; y: number; width: number; height: number };
  const overlaps = (a: Box, b: Box) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
  const boxOf = async (target: Locator) => {
    const box = await target.boundingBox();
    if (!box) throw new Error("el elemento no tiene caja");
    return box;
  };

  /** Form listo para enviar con un email que el navegador acepta pero el servidor rechaza (`ana@example`). */
  async function prepare(page: Page) {
    await page.goto("/es");
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();
    // Reveal anima opacidad y desplazamiento del form: hasta que termina, las cajas no son las finales.
    await expect.poll(() => effectiveOpacity(form)).toBe(1);
    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example");
    await form.getByLabel(t.messageLabel).fill("Hola, quiero una web app.");
    await waitTimeGate(form);
    return { form, submit: form.getByRole("button", { name: t.submit }) };
  }

  /** Scrollea hasta que el borde inferior del botón coincide con el de la ventana. */
  async function toBottomEdge(submit: Locator) {
    const gap = await submit.evaluate((button) => {
      window.scrollBy(0, button.getBoundingClientRect().bottom - window.innerHeight);
      return button.getBoundingClientRect().bottom - window.innerHeight;
    });
    expect(Math.abs(gap), "el botón Enviar debe quedar en el borde inferior").toBeLessThan(1);
  }

  const focusWithoutScrolling = (target: Locator) => target.evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));

  test("error que solo detecta el servidor: el email enfocado no queda bajo el header ni el botón flotante", async ({ page }) => {
    const { form, submit } = await prepare(page);
    await focusWithoutScrolling(submit);
    await toBottomEdge(submit);

    // Precondición: con el botón al borde inferior, el email queda arriba del borde inferior del header (o
    // más arriba aún). Es el caso malo que justifica este viewport: si el layout cambia y el email deja de
    // estar ahí, el test ya no probaría que el foco lo trae de vuelta a la vista.
    const email = form.getByLabel(t.emailLabel, { exact: true });
    const header = await boxOf(page.getByRole("banner"));
    const before = await boxOf(email);
    expect(before.y, `el email (${JSON.stringify(before)}) debe quedar tapado por el header o más arriba (borde inferior del header: ${header.y + header.height})`).toBeLessThan(
      header.y + header.height,
    );

    await page.keyboard.press("Enter");

    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    const box = await boxOf(email);
    expect(overlaps(box, await boxOf(page.getByRole("banner"))), `el email (${JSON.stringify(box)}) queda bajo el header`).toBe(false);
    expect(overlaps(box, await boxOf(page.locator(".wa-fab"))), `el email (${JSON.stringify(box)}) queda bajo el botón flotante`).toBe(false);
  });

  test("Tab hasta Enviar con el botón al borde inferior: no queda bajo el botón flotante", async ({ page }) => {
    const { form, submit } = await prepare(page);
    await focusWithoutScrolling(form.getByLabel(t.messageLabel));
    await toBottomEdge(submit);

    await page.keyboard.press("Tab");

    await expect(submit).toBeFocused();
    const box = await boxOf(submit);
    expect(overlaps(box, await boxOf(page.locator(".wa-fab"))), `Enviar (${JSON.stringify(box)}) queda bajo el botón flotante`).toBe(false);
  });
});
