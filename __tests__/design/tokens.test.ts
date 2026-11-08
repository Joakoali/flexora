import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

const SEMANTIC = ["--bg", "--surface", "--fg", "--fg-muted", "--border", "--accent", "--accent-soft", "--switch-half", "--danger"];

describe("design tokens", () => {
  it("define cada token semántico en oscuro (:root) y en claro ([data-theme=light])", () => {
    const root = css.match(/:root\s*{([^}]*)}/)?.[1] ?? "";
    const light = css.match(/\[data-theme="light"\]\s*{([^}]*)}/)?.[1] ?? "";
    for (const token of SEMANTIC) {
      expect(root, `${token} en :root`).toContain(`${token}:`);
      expect(light, `${token} en light`).toContain(`${token}:`);
    }
  });

  it("usa los valores exactos del spec", () => {
    expect(css).toContain("--bg: #09090b");
    expect(css).toContain("--accent: #7a3bff");
    expect(css).toContain("--bg: #f6f5fa");
    expect(css).toContain("--accent: #6a2bf2");
  });

  it("expone las variables de motion con los valores del spec", () => {
    expect(css).toContain("--ease-out: cubic-bezier(0.23, 1, 0.32, 1)");
    expect(css).toContain("--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)");
    expect(css).toContain("--dur-fast: 120ms");
    expect(css).toContain("--dur-base: 200ms");
    expect(css).toContain("--dur-slow: 500ms");
  });

  it("alinea la jerarquía al hero: h2 de sección más chico que el H1 y ritmo vertical unificado", () => {
    expect(css).toContain("--text-h2: clamp(1.625rem, 3.4vw, 3rem)");
    expect(css).toContain("--section-y: clamp(4rem, 8vw, 7rem)");
    const rule = (selector: string) =>
      css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.#]/g, "\\$&")}\\s*{([^}]*)}`))?.[1] ?? "";
    expect(rule(".section")).toContain("var(--section-y)");
    expect(rule(".closing__content")).toContain("var(--section-y)");
    expect(rule(".closing")).not.toContain("min-height");
    expect(rule(".closing__title")).not.toContain("font-size");
  });

  it("la entrada del showcase sale de tokens y no de duraciones sueltas", () => {
    expect(css).toContain("--dur-showcase: 900ms");
    expect(css).toContain("--showcase-delay: 350ms");
    expect(css).toContain("--showcase-stagger: 140ms");
    const win = css.match(/\.hero-showcase__win\s*{([^}]*)}/)?.[1] ?? "";
    expect(win).toContain("var(--dur-showcase)");
    expect(win).toContain("var(--showcase-delay)");
    expect(win).toContain("var(--showcase-stagger)");
    expect(win).not.toMatch(/\b(900|350|140)ms\b/);
  });

  it("los títulos de sección no tienen ancho máximo: ocupan una sola línea en desktop", () => {
    for (const name of ["services", "work", "process"]) {
      const rule = css.match(new RegExp(`\\.${name}__title\\s*{([^}]*)}`))?.[1] ?? "";
      expect(rule, `.${name}__title`).not.toContain("max-width");
    }
  });

  it("el marquee de clientes es una franja discreta: tipografía bien por debajo del H1 del hero", () => {
    const item = css.match(/\.marquee__item\s*{([^}]*)}/)?.[1] ?? "";
    expect(item).toContain("font-size: clamp(1.25rem, 2.2vw, 2rem)");
  });

  it("el hero reparte el aire por igual y el marquee sube sobre el hueco muerto de la escena", () => {
    const content = css.match(/\.hero__content\s*{([^}]*)}/)?.[1] ?? "";
    expect(content).not.toContain("padding-bottom");
    const marquee = css.match(/\.marquee\s*{([^}]*)}/)?.[1] ?? "";
    expect(marquee).toContain("margin-top: calc(-1 * max(0px, (100dvh - 814px) * 0.44))");
  });

  it("el botón flotante de WhatsApp es de Flexora en reposo y verde de WhatsApp en hover/foco", () => {
    expect(css).toContain("--whatsapp-brand: #25d366");
    const fab = css.match(/\.wa-fab\s*{([^}]*)}/)?.[1] ?? "";
    expect(fab).toContain("position: fixed");
    expect(fab).toContain("background: var(--surface)");
    expect(fab).toContain("color: var(--accent-text)");
    expect(fab).toContain("border-radius: var(--radius-md)");
    expect(css).toMatch(/\.wa-fab:focus-visible[^{]*{[^}]*var\(--whatsapp-brand\)/);
    expect(css).toMatch(/@media \(hover: hover\)\s*{\s*\.wa-fab:hover/);
  });

  it("el footer deja lugar al botón flotante para no taparse", () => {
    const footer = css.match(/\.site-footer\s*{([^}]*)}/)?.[1] ?? "";
    expect(footer).toContain("--fab-size");
  });

  it("el live region del error de formulario nunca se oculta: sin display:none ni :empty que lo saque del árbol de accesibilidad", () => {
    // Un aria-live que nace con contenido (o sale de display:none) no se anuncia en lectores de pantalla.
    const rules = [...css.matchAll(/([^{}]+){([^{}]*)}/g)]
      .map(([, selector, body]) => ({ selector: selector.trim(), body }))
      .filter(({ selector }) => /contact-form__form-(error|status)/.test(selector));
    expect(rules.length).toBeGreaterThan(0);
    for (const { selector, body } of rules) {
      expect(selector, selector).not.toContain(":empty");
      expect(body, selector).not.toMatch(/display:\s*none/);
      expect(body, selector).not.toMatch(/visibility:\s*hidden/);
    }
  });

  describe("breakpoints de ancho", () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, ""); // los comentarios pueden citar el par viejo
    const widths = (kind: "min" | "max") =>
      [...code.matchAll(new RegExp(`\\(${kind}-width:\\s*(\\d+)px\\)`, "g"))].map(([, px]) => Number(px));

    it("no hay pares max/min-width con hueco", () => {
      // Un par como (max-width: 899px) + (min-width: 900px) deja sin cubrir los viewports
      // fraccionarios entre 899 y 900 (zoom, HiDPI): no aparece ni el menú ni la nav.
      const mins = new Set(widths("min"));
      const maxs = widths("max");
      // Sin estas dos guardas, si dejaran de matchear el bucle no verificaría nada en silencio.
      expect(mins.size, "no se encontró ningún (min-width: Npx)").toBeGreaterThan(0);
      expect(maxs.length, "no se encontró ningún (max-width: Npx)").toBeGreaterThan(0);
      for (const max of maxs) {
        expect(mins.has(max + 1), `(max-width: ${max}px) deja un hueco con (min-width: ${max + 1}px)`).toBe(false);
      }
    });

    it("la hamburguesa y la nav de escritorio son complementarias en 900px", () => {
      // Se fijan los dos lados: si cualquiera se corre, aparece un hueco (o un solapamiento) cerca de 900px.
      expect(code, "la nav de escritorio debe aparecer desde (min-width: 900px)").toMatch(
        /@media \(min-width: 900px\)\s*{\s*\.site-header__nav\s*{/,
      );
      expect(code, "la hamburguesa debe ser el complemento exacto de la nav: (width < 900px)").toMatch(
        /@media \(width < 900px\)\s*{\s*\.site-header__menu\s*{/,
      );
    });
  });

  it("no usa ease-in ni transition: all", () => {
    expect(css).not.toMatch(/[^-]ease-in[^-]/);
    expect(css).not.toContain("transition: all");
  });
});
