import { expect, test, type Page } from "@playwright/test";
import { effectiveOpacity } from "./helpers";

// Layout del cierre (#contact). Con dos columnas iguales alineadas arriba, la introducción (~110 px) quedaba
// contra un formulario de ~630 px y sobraban ~520 px vacíos debajo de WhatsApp/mail. Ahora la introducción
// reparte el alto del formulario (título y frase arriba, WhatsApp y mail abajo, al ras del panel) y el
// formulario se compacta: Nombre y Email comparten fila cuando el panel tiene ancho para eso.
// Las dos columnas solo valen donde el formulario entra compacto. A 1024 px el panel de una columna de
// escritorio es demasiado angosto para la fila Nombre/Email, el formulario vuelve a medir ~630 px y el hueco
// reaparece: ahí va apilado. El viewport se fija en cada caso (el corte es por ancho, no por proyecto).
const CASES = [
  { width: 390, height: 844, columns: 1, inputs: "apilados" },
  { width: 768, height: 1024, columns: 1, inputs: "fila" },
  { width: 1024, height: 768, columns: 1, inputs: "fila" },
  { width: 1100, height: 800, columns: 2, inputs: "fila" },
  { width: 1280, height: 720, columns: 2, inputs: "fila" },
] as const;

/** Tolerancia de alineación: redondeo de subpíxeles entre tracks de la grilla. */
const ALIGNED = 2;

async function measure(page: Page) {
  await page.goto("/es");
  await page.evaluate(() => document.fonts.ready);
  const panel = page.locator("#contact .contact-form");
  await panel.scrollIntoViewIfNeeded();
  // Reveal anima opacidad y desplazamiento, con escalón entre bloques: hasta que termina el último (el
  // panel), las cajas no son las finales ni comparables entre sí.
  await expect.poll(() => effectiveOpacity(panel)).toBe(1);
  return page.locator("#contact").evaluate((section) => {
    const box = (selector: string) => {
      const el = section.querySelector(selector);
      if (!el) throw new Error(`no se encontró ${selector} dentro de #contact`);
      const { top, bottom, left, right } = el.getBoundingClientRect();
      return { top, bottom, left, right };
    };
    return {
      title: box("#closing-title"),
      actions: box(".closing__actions"),
      panel: box(".contact-form"),
      name: box('input[name="name"]'),
      email: box('input[name="email"]'),
    };
  });
}

for (const { width, height, columns, inputs } of CASES) {
  test.describe(`cierre a ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    if (columns === 2) {
      test("dos columnas: título arriba y WhatsApp/mail abajo, al ras del panel del formulario", async ({ page }) => {
        const { title, actions, panel } = await measure(page);
        expect(panel.left, "el formulario va a la derecha de la introducción").toBeGreaterThan(actions.right);
        expect(Math.abs(title.top - panel.top), "el título arranca a la altura del panel").toBeLessThanOrEqual(ALIGNED);
        expect(
          Math.abs(actions.bottom - panel.bottom),
          "WhatsApp/mail terminan a la altura del panel: no queda hueco debajo",
        ).toBeLessThanOrEqual(ALIGNED);
      });
    } else {
      test("apilado: la introducción arriba y el formulario debajo, desde el mismo margen", async ({ page }) => {
        const { title, actions, panel } = await measure(page);
        expect(actions.top, "WhatsApp/mail van debajo del título").toBeGreaterThanOrEqual(title.bottom);
        expect(panel.top, "el formulario va debajo de WhatsApp/mail").toBeGreaterThanOrEqual(actions.bottom);
        expect(Math.abs(panel.left - title.left), "el formulario arranca en el margen del título").toBeLessThanOrEqual(ALIGNED);
      });
    }

    if (inputs === "fila") {
      test("Nombre y Email comparten fila", async ({ page }) => {
        const { name, email } = await measure(page);
        expect(Math.abs(name.top - email.top), "Nombre y Email a la misma altura").toBeLessThanOrEqual(1);
        expect(email.left, "Email va a la derecha de Nombre").toBeGreaterThan(name.right);
      });
    } else {
      test("Nombre y Email van apilados: en una fila quedarían demasiado angostos", async ({ page }) => {
        const { name, email } = await measure(page);
        expect(email.top, "Email va debajo de Nombre").toBeGreaterThanOrEqual(name.bottom);
      });
    }
  });
}
