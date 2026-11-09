import type { Locator } from "@playwright/test";

// Opacidad efectiva: la propia por las de todos sus ancestros. Reveal y la entrada del copy animan
// el bloque contenedor (p. ej. el div del CTA o del formulario) y no el elemento en sí, así que mirar solo
// su opacidad daría 1 aunque el usuario lo vea invisible. `toBeVisible()` de Playwright tampoco sirve:
// ignora la opacidad.
export const effectiveOpacity = (el: Locator) =>
  el.evaluate((node) => {
    let o = 1;
    for (let n: Element | null = node; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  });
