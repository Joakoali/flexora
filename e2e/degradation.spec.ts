import { expect, test, type Locator } from "@playwright/test";

test("con reduced-motion no hay animaciones corriendo y el campo es estático", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/es");
  await expect(page.locator('[data-variant="hero"]')).toHaveAttribute("data-mode", "fallback");
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && (a.effect?.getTiming().duration as number) > 1).length,
  );
  expect(running).toBe(0);
  await ctx.close();
});

test("sin WebGL el hero muestra el fallback y la página no rompe", async ({ browser }) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/es");
  await expect(page.locator('[data-variant="hero"]')).toHaveAttribute("data-mode", "fallback");
  await expect(page.locator('[data-variant="hero"] .flex-field__fallback')).toBeAttached();
  expect(errors).toEqual([]);
  await ctx.close();
});

// Opacidad efectiva: la propia por las de todos sus ancestros. La entrada del copy anima el
// bloque (p. ej. el contenedor del CTA) y no el botón, así que mirar solo la opacidad del
// elemento daría 1 aunque el usuario lo vea invisible.
const effectiveOpacity = (el: Locator) =>
  el.evaluate((node) => {
    let o = 1;
    for (let n: Element | null = node; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  });

// El hero siempre está en el primer viewport: su copy (incluido el h1, candidato a LCP) no
// puede depender de JavaScript ni de la hidratación para dejar de estar en opacity 0.
test.describe("hero sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const lang of ["es", "en", "ca"] as const) {
    test(`hero ${lang}: el h1, el CTA y los chips se ven sin JS`, async ({ page }) => {
      await page.goto(`/${lang}`);
      const hero = page.locator("#hero");
      // La entrada es una animación CSS que termina sola: poll reintenta hasta que llega a 1.
      for (const target of [
        hero.getByRole("heading", { level: 1 }),
        hero.locator(".btn-primary"),
        hero.locator(".hero__chips"),
      ]) {
        await expect.poll(() => effectiveOpacity(target)).toBe(1);
      }
    });
  }

  // La regla global de reduced-motion acorta la duración pero no el delay escalonado: sin
  // cortar la animación, el copy seguiría en opacity 0 hasta 240 ms antes de aparecer.
  test.describe("con reduced-motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("el copy del hero aparece completo, sin animación ni delay", async ({ page }) => {
      await page.goto("/es");
      const hero = page.locator("#hero");
      // animationName y no getAnimations(): con fill `backwards` una animación terminada ya no
      // aparece en getAnimations() y el test dependería de la carrera contra el delay de 240 ms.
      const names = await hero.locator(".hero__copy > *").evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).animationName),
      );
      expect(names.length).toBeGreaterThan(0);
      expect(names.filter((name) => name !== "none")).toEqual([]);
      expect(await effectiveOpacity(hero.getByRole("heading", { level: 1 }))).toBe(1);
      expect(await effectiveOpacity(hero.locator(".btn-primary"))).toBe(1);
    });
  });
});
