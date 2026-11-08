import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DURATION, EASE_IN_OUT, EASE_LOOP, EASE_OUT, FAB, MENU, REVEAL, SHOWCASE } from "@/lib/motion";

const css = readFileSync("app/globals.css", "utf8");

const SEMANTIC = ["--bg", "--surface", "--fg", "--fg-muted", "--border", "--accent", "--accent-soft", "--switch-half", "--danger"];

// Los strings esperados se derivan de lib/motion.ts (fuente única), no se repiten a mano acá.
const ms = (n: number) => `${n}ms`;
const seconds = (n: number) => `${n / 1000}s`; // los loops largos se escriben en segundos
const px = (n: number) => `${n}px`;

type Mirror = [variable: string, format: (n: number) => string];

/**
 * Una entrada por clave de la constante. `vars` es un Record tipado por las claves de `source`: sumar
 * una clave sin darle variable CSS no compila (tsc) y, en runtime, tira el error de acá abajo.
 */
function mirror<T extends Record<string, number>>(name: string, source: T, vars: Record<keyof T, Mirror>) {
  return Object.entries(source).map(([key, value]) => {
    const entry = (vars as Record<string, Mirror | undefined>)[key];
    if (!entry) throw new Error(`${name}.${key} no tiene variable CSS asignada en tokens.test.ts`);
    return { source: `${name}.${key}`, variable: `--${entry[0]}`, expected: entry[1](value) };
  });
}

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

  it("cada token de lib/motion.ts está espejado en :root con el valor exacto que deriva de la constante", () => {
    const root = css.match(/:root\s*{([^}]*)}/)?.[1] ?? "";
    const mirrors = [
      { source: "EASE_OUT", variable: "--ease-out", expected: EASE_OUT },
      { source: "EASE_IN_OUT", variable: "--ease-in-out", expected: EASE_IN_OUT },
      { source: "EASE_LOOP", variable: "--ease-loop", expected: EASE_LOOP },
      ...mirror("DURATION", DURATION, { fast: ["dur-fast", ms], base: ["dur-base", ms], slow: ["dur-slow", ms] }),
      ...mirror("REVEAL", REVEAL, { offsetPx: ["reveal-offset", px], staggerMs: ["reveal-stagger", ms] }),
      ...mirror("SHOWCASE", SHOWCASE, {
        durationMs: ["dur-showcase", ms],
        delayMs: ["showcase-delay", ms],
        staggerMs: ["showcase-stagger", ms],
        loopMs: ["showcase-loop", seconds],
        loopPhaseMs: ["showcase-loop-phase", seconds],
      }),
      ...mirror("MENU", MENU, { delayMs: ["menu-delay", ms] }),
      ...mirror("FAB", FAB, { delayMs: ["fab-delay", ms] }),
    ];
    for (const { source, variable, expected } of mirrors) {
      const declared = root.match(new RegExp(`(?<![\\w-])${variable}:\\s*([^;]+);`))?.[1]?.trim();
      expect(declared, `${variable} (espejo de ${source} en lib/motion.ts) falta o difiere en :root`).toBe(expected);
    }
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

// ---------- Guard: sin duraciones, delays ni curvas literales en las animaciones ----------

type Declaration = { context: string[]; property: string; value: string };

/** Recorre el CSS (sin comentarios) con una pila de bloques: soporta @media/@supports/@keyframes anidados. */
function declarations(source: string): Declaration[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Declaration[] = [];
  const stack: string[] = [];
  let buffer = "";
  let parens = 0;
  let quote: string | null = null;
  for (const ch of code) {
    if (quote) {
      buffer += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buffer += ch;
      continue;
    }
    if (ch === "(") parens++;
    if (ch === ")") parens--;
    if (parens === 0 && ch === "{") {
      stack.push(buffer.trim().replace(/\s+/g, " "));
      buffer = "";
      continue;
    }
    if (parens === 0 && (ch === ";" || ch === "}")) {
      const text = buffer.trim();
      const colon = text.indexOf(":");
      if (text && colon > 0) {
        out.push({ context: [...stack], property: text.slice(0, colon).trim().toLowerCase(), value: text.slice(colon + 1).trim() });
      }
      buffer = "";
      if (ch === "}") stack.pop();
      continue;
    }
    buffer += ch;
  }
  return out;
}

const MOTION_PROPERTIES = new Set([
  "animation",
  "animation-delay",
  "animation-duration",
  "animation-timing-function",
  "transition",
  "transition-delay",
  "transition-duration",
  "transition-timing-function",
]);
const TIME_LITERAL = /^[+-]?(\d+\.?\d*|\.\d+)(ms|s)$/i;
const EASING_KEYWORDS = new Set(["ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start", "step-end"]);

type Violation = { rule: string; property: string; value: string; literals: string[] };

/** Literales de duración/delay y curvas en declaraciones de animation/transition fuera de `:root` (donde viven los tokens). */
function findMotionLiterals(source: string): Violation[] {
  const violations: Violation[] = [];
  for (const { context, property, value } of declarations(source)) {
    if (!MOTION_PROPERTIES.has(property) || context.at(-1) === ":root") continue;
    // Tokens por identificador/número: `--ease-out` o `-4s` (con signo) son uno solo, así que
    // `var(--ease-out)` y `linear-gradient` no matchean la keyword `ease-out`/`linear`.
    const tokens = value.match(/[A-Za-z0-9_.+-]+/g) ?? [];
    const functions = value.match(/(?<![\w-])(?:cubic-bezier|steps|linear)(?=\()/g) ?? [];
    const literals = [...tokens.filter((t) => TIME_LITERAL.test(t) || EASING_KEYWORDS.has(t.toLowerCase())), ...functions];
    if (literals.length) violations.push({ rule: context.join(" > "), property, value: value.replace(/\s+/g, " "), literals });
  }
  return violations;
}

/**
 * Deuda preexistente de la PR de tokens: literales que quedaron fuera de alcance. Cada entrada nombra
 * la regla, la propiedad y los literales exactos; cambiar el valor o sumar otro literal en la misma
 * regla vuelve a fallar. La lista no puede tener entradas muertas: al tokenizar una, hay que borrarla.
 */
const MOTION_LITERAL_DEBT: { rule: string; property: string; literals: string[]; why: string }[] = [
  {
    rule: "@media (prefers-reduced-motion: reduce) > *, *::before, *::after",
    property: "animation-duration",
    literals: ["0.001ms"],
    why: "No es deuda: idioma estándar de reduced-motion (colapsa toda animación sin apagarla). No es un valor de diseño.",
  },
  {
    rule: "@media (prefers-reduced-motion: reduce) > *, *::before, *::after",
    property: "transition-duration",
    literals: ["0.001ms"],
    why: "Ídem animation-duration: idioma de reduced-motion, no un valor de diseño.",
  },
  {
    rule: "@supports (animation-timeline: scroll()) > html",
    property: "animation",
    literals: ["linear"],
    why: "@keyframes hero-progress: animación guiada por scroll, no por tiempo; `linear` es lo que la mapea 1:1 al scroll. No hay duración.",
  },
  {
    rule: "@media (hover: none) > .hero__wordmark-text",
    property: "animation",
    literals: ["6s"],
    why: "Deuda: @keyframes breathe (respiración del wordmark sin puntero). Falta un token de duración de loop ambiental.",
  },
  {
    rule: ".marquee__scroller",
    property: "animation",
    literals: ["28s", "linear"],
    why: "Deuda: @keyframes marquee (franja de clientes). 28 s y la curva lineal deberían ser tokens de loop.",
  },
  {
    rule: "[data-reveal][data-visible] .work-card__window img",
    property: "animation",
    literals: ["8s", "ease-in-out"],
    why: "Deuda: @keyframes work-scroll (scroll de la captura en las cards de Work). Mismo gesto que el loop del showcase: debería usar var(--ease-loop) y un token de duración.",
  },
];

describe("animaciones sin duraciones ni curvas literales", () => {
  it("el escáner distingue literales de tokens (anidados, calc con signo, var(--ease-*), comentarios, :root)", () => {
    const sample = `
      :root { --dur: 120ms; transition: color 99ms ease; }
      /* .fake { animation: x 5s linear; } */
      @media (min-width: 900px) {
        .a { animation: pop var(--dur-slow) var(--ease-out) both; animation-delay: calc(var(--i) * var(--step) * -1); }
        .b { animation-delay: calc(var(--i) * -4s); background: linear-gradient(red, blue); }
        .c { transition: opacity .5s ease-in-out, transform 200ms cubic-bezier(0.2, 0, 0, 1) !important }
        .d { content: "a;b{c}"; animation: none }
      }
      @keyframes k { from { opacity: 0 } }
      .e { transition-timing-function: linear; animation-duration: var(--dur-fast); }
    `;
    expect(findMotionLiterals(sample)).toEqual([
      { rule: "@media (min-width: 900px) > .b", property: "animation-delay", value: "calc(var(--i) * -4s)", literals: ["-4s"] },
      {
        rule: "@media (min-width: 900px) > .c",
        property: "transition",
        value: "opacity .5s ease-in-out, transform 200ms cubic-bezier(0.2, 0, 0, 1) !important",
        literals: [".5s", "ease-in-out", "200ms", "cubic-bezier"],
      },
      { rule: ".e", property: "transition-timing-function", value: "linear", literals: ["linear"] },
    ]);
  });

  it("globals.css no suma duraciones, delays ni curvas literales: usar los tokens de lib/motion.ts", () => {
    const all = declarations(css).filter(({ property }) => MOTION_PROPERTIES.has(property));
    // Sin esto, si el recorrido dejara de encontrar declaraciones el guard aprobaría en silencio.
    expect(all.length, "no se encontró ninguna declaración de animation/transition").toBeGreaterThan(20);

    const used = new Set<number>();
    const offenders: string[] = [];
    for (const v of findMotionLiterals(css)) {
      const index = MOTION_LITERAL_DEBT.findIndex(
        (d) => d.rule === v.rule && d.property === v.property && v.literals.every((l) => d.literals.includes(l.toLowerCase())),
      );
      if (index >= 0) {
        used.add(index);
        continue;
      }
      offenders.push(
        `${v.rule} { ${v.property}: ${v.value} } usa ${v.literals.map((l) => `\`${l}\``).join(", ")}. ` +
          "Usá un token de lib/motion.ts: duraciones y delays con var(--dur-fast|base|slow), --dur-showcase, --showcase-delay|stagger|loop|loop-phase, " +
          "--reveal-stagger, --menu-delay o --fab-delay; curvas con var(--ease-out), var(--ease-in-out) o var(--ease-loop). " +
          "Si falta uno, agregalo a lib/motion.ts y espejalo en :root.",
      );
    }
    expect(offenders, offenders.join("\n")).toEqual([]);

    const dead = MOTION_LITERAL_DEBT.filter((_, i) => !used.has(i)).map((d) => `${d.rule} { ${d.property} }`);
    expect(dead, `Deuda ya saldada: borrala de MOTION_LITERAL_DEBT (${dead.join("; ")})`).toEqual([]);
  });
});
