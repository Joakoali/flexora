import { expect, test } from "@playwright/test";

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
