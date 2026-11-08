import { expect, test } from "@playwright/test";
import { effectiveOpacity } from "./helpers";

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

// Reveal deja su contenido en opacity 0 hasta que un IntersectionObserver (JS) le pone data-visible.
// Sin JS (o con la hidratación caída) eso es contenido invisible para siempre, formulario incluido;
// `@media (scripting: none)` lo muestra en su lugar final. toBeVisible() ignora la opacidad, de ahí
// que se compare la opacidad efectiva.
test.describe("secciones con Reveal sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const lang of ["es", "en", "ca"] as const) {
    test(`${lang}: Servicios, Trabajos, Proceso y Cierre se ven sin JS`, async ({ page }) => {
      await page.goto(`/${lang}`);
      const targets = {
        "h2 de Servicios": page.locator("#services-title"),
        "paso de Proceso": page.locator("#process .process__step").first(),
        "portada de una tarjeta de Trabajos": page.locator("#work .work-card__cover").first(),
        "título de una tarjeta de Trabajos": page.locator("#work .work-card h3").first(),
        "título del Cierre": page.locator("#closing-title"),
        "formulario de contacto": page.locator("#contact form"),
      };
      for (const [name, target] of Object.entries(targets)) {
        expect(await effectiveOpacity(target), `opacidad efectiva de ${name}`).toBe(1);
      }
    });
  }

  test("los chevrones de Servicios no quedan desplazados (su estado inicial también depende de data-reveal)", async ({ page }) => {
    await page.goto("/es");
    for (const chevron of [page.locator(".svis__chev--a").first(), page.locator(".svis__chev--b").first()]) {
      await expect(chevron).toHaveCSS("transform", "none");
    }
  });
});
