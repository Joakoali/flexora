import { expect, test, type Page } from "@playwright/test";

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

// WCAG 1.4.10 (Reflow): a 320 px de ancho CSS la página no puede scrollear en horizontal.
// Aparte del test de arriba porque ese corre al ancho del proyecto (1280 en escritorio) y
// acá se mide en el límite: un hijo de grilla con nowrap que ensancha una columna `auto`
// solo se nota a este ancho. Se compara contra el ancho pedido y no contra innerWidth: en
// emulación mobile el viewport de layout crece hasta el contenido (innerWidth pasa a 347)
// y un desborde real quedaría enmascarado.
const REFLOW_WIDTH = 320;
for (const lang of ["es", "en", "ca"] as const) {
  test(`home ${lang}: sin scroll horizontal a ${REFLOW_WIDTH} px (reflow)`, async ({ page }) => {
    await page.setViewportSize({ width: REFLOW_WIDTH, height: 640 });
    await page.goto(`/${lang}`);
    await page.evaluate(() => document.fonts.ready);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(REFLOW_WIDTH + 1);
  });
}

// Celulares apaisados: con más de 640 px de ancho no corren los fallbacks de ancho del hero, y la
// escena es 100dvh con overflow hidden, así que lo que se pasa del alto queda cortado (no
// scrolleable). El copy entero, con sus CTA, tiene que entrar sin pisar el wordmark de arriba.
const LANDSCAPE_PHONES = [
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 740, height: 360 },
  { width: 915, height: 412 },
  { width: 932, height: 430 },
];
for (const viewport of LANDSCAPE_PHONES) {
  test.describe(`hero a ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const lang of ["es", "en", "ca"] as const) {
      test(`${lang}: el copy y los CTA entran en la escena`, async ({ page }) => {
        await page.goto(`/${lang}`);
        await page.evaluate(() => document.fonts.ready);
        // La entrada del copy desplaza 12 px: se mide con la animación terminada.
        await page.locator(".hero__copy").evaluate((el) =>
          Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)),
        );
        const box = async (selector: string) => {
          const b = await page.locator(selector).boundingBox();
          if (!b) throw new Error(`${selector} no tiene caja`);
          return { top: b.y, bottom: b.y + b.height };
        };
        const scene = await box(".hero__sticky");
        const wordmark = await box(".hero__wordmark");
        const copy = await box(".hero__copy");
        expect(copy.bottom).toBeLessThanOrEqual(scene.bottom);
        expect(copy.top).toBeGreaterThanOrEqual(wordmark.bottom);
        expect((await box(".hero__actions .btn-primary")).bottom).toBeLessThanOrEqual(scene.bottom);
        expect((await box(".hero__actions .btn-secondary")).bottom).toBeLessThanOrEqual(scene.bottom);
      });
    }
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

// globals.css oculta .site-header__cta con display:none en <= 640 px a propósito: ahí el CTA vive
// dentro del panel del menú. Cada modo se verifica donde existe, según el ancho del viewport
// (el mismo corte que el CSS) y no según el nombre del proyecto de Playwright.
const CTA_IN_MENU_MAX_WIDTH = 640;
const WHATSAPP_HREF = /^https:\/\/wa\.me\/\d+\?text=/;
const isCtaInMenu = (page: Page) => (page.viewportSize()?.width ?? Infinity) <= CTA_IN_MENU_MAX_WIDTH;

test("el CTA del header lleva a WhatsApp", async ({ page }) => {
  test.skip(isCtaInMenu(page), "En mobile el CTA vive en el panel del menú: lo cubre el test siguiente");
  await page.goto("/es");
  const cta = page.getByRole("banner").getByRole("link", { name: "Hablemos" });
  await expect(cta).toHaveAttribute("href", WHATSAPP_HREF);
});

test("en mobile el CTA del panel del menú lleva a WhatsApp", async ({ page }) => {
  test.skip(!isCtaInMenu(page), "En escritorio el CTA está en el header: lo cubre el test anterior");
  await page.goto("/es");
  const header = page.getByRole("banner");
  // Con el menú cerrado el CTA del header está oculto y el panel ni siquiera está montado.
  await expect(header.getByRole("link", { name: "Hablemos" })).toHaveCount(0);
  await header.getByRole("button", { name: "Menú" }).click();
  const cta = header.locator("#mobile-menu").getByRole("link", { name: "Hablemos" });
  await expect(cta).toHaveAttribute("href", WHATSAPP_HREF);
});
