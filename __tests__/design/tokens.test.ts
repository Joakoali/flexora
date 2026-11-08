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

  it("la entrada del showcase lee sus tokens (que no haya literales lo veda el guard de abajo)", () => {
    const win = css.match(/\.hero-showcase__win\s*{([^}]*)}/)?.[1] ?? "";
    expect(win).toContain("var(--dur-showcase)");
    expect(win).toContain("var(--showcase-delay)");
    expect(win).toContain("var(--showcase-stagger)");
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

  it("sin JavaScript (@media (scripting: none)) el contenido de Reveal se ve en su lugar final", () => {
    // Reveal arranca en opacity 0 y solo un JS que corra le pone data-visible: sin JS (o con la hidratación
    // caída) Servicios, Trabajos, Proceso y Cierre —el formulario incluido— quedarían invisibles.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // Cada bloque trae solo reglas planas (un nivel de llaves anidadas).
    const blocks = [...code.matchAll(/@media \(scripting: none\)\s*{((?:[^{}]*{[^{}]*})*)\s*}/g)].map(({ 1: body, index }) => ({
      index,
      rules: [...body.matchAll(/([^{}]+){([^{}]*)}/g)].map(([, selector, declarations]) => ({
        selectors: selector.split(",").map((s) => s.trim().replace(/\s+/g, " ")),
        declarations,
      })),
    }));
    expect(blocks.length, "falta @media (scripting: none)").toBeGreaterThan(0);

    const override = (selector: string) =>
      blocks.flatMap(({ index, rules }) => rules.filter((r) => r.selectors.includes(selector)).map((r) => ({ index, ...r })))[0];
    // Posición del estado inicial que se anula: el override debe ir DESPUÉS (misma especificidad, gana el último).
    const base = (selector: string) => code.search(new RegExp(`(?:^|\\n)${selector.replace(/[.\[\]>*]/g, "\\$&")}\\s*{`));

    const content = override("[data-reveal] > *");
    expect(content, "[data-reveal] > * dentro de @media (scripting: none)").toBeDefined();
    expect(content.declarations).toMatch(/opacity:\s*1\b/);
    expect(content.declarations).toMatch(/transform:\s*none/);
    expect(content.index, "el override va después del estado inicial").toBeGreaterThan(base("[data-reveal] > *"));

    // Los chevrones de Servicios arrancan desplazados con la misma condición (`[data-reveal] .svis__chev--*`).
    for (const selector of ["[data-reveal] .svis__chev--a", "[data-reveal] .svis__chev--b"]) {
      const chevron = override(selector);
      expect(chevron, `${selector} dentro de @media (scripting: none)`).toBeDefined();
      expect(chevron.declarations).toMatch(/transform:\s*none/);
      expect(chevron.index, `${selector}: el override va después del estado inicial`).toBeGreaterThan(base(selector));
    }
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

/**
 * Veda los literales de duración/delay (`300ms`, `.5s`, `-4s`) y de curva (`ease`, `linear`, `cubic-bezier()`,
 * `steps()`) en toda declaración `animation*` / `transition*` de globals.css: los valores salen de los tokens
 * (bloque "Tokens de movimiento" de `:root` y lib/motion.ts). Es un regex sobre el CSS sin comentarios, no un
 * parser, así que no sabe en qué regla está cada declaración.
 *
 * Límites conocidos: no ve una duración puesta en una custom property fuera de `:root` y consumida con `var()`
 * (`.x { --d: 300ms; transition: opacity var(--d) }`), ni un override de `--dur-*` anidado en `@media`. Las
 * custom properties (`--*`) quedan fuera a propósito: ahí viven los tokens.
 */
const MOTION_DECLARATION = /(?<![\w-])((?:animation|transition)(?:-[a-z-]+)?)\s*:\s*([^;{}]+)/gi;
const TIME_LITERAL = /^[+-]?(\d+\.?\d*|\.\d+)(ms|s)$/i;
const EASING_KEYWORDS = new Set(["ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start", "step-end"]);

type MotionDeclaration = { line: number; declaration: string; literals: string[] };

/**
 * Todas las declaraciones de movimiento, con los literales que traen (vacío si usan solo tokens).
 * `declaration` está normalizada: propiedad en minúsculas, blancos colapsados y sin `!important` (la
 * prioridad no cambia si hay un literal). Es la clave exacta con la que se compara la allowlist.
 */
function motionDeclarations(source: string): MotionDeclaration[] {
  // Los comentarios se reemplazan por blancos (no se borran) para conservar los números de línea.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  return [...code.matchAll(MOTION_DECLARATION)].map(({ 1: property, 2: raw, index }) => {
    const value = raw.trim().replace(/\s+/g, " ").replace(/ ?!important$/i, "");
    // Tokens por identificador/número: `--ease-out` o `-4s` (con signo) son uno solo, así que
    // `var(--ease-out)` y `linear-gradient` no matchean la keyword `ease-out`/`linear`.
    const tokens = value.match(/[A-Za-z0-9_.+-]+/g) ?? [];
    const functions = value.match(/(?<![\w-])(?:cubic-bezier|steps)(?=\()/g) ?? [];
    const literals = [...tokens.filter((t) => TIME_LITERAL.test(t) || EASING_KEYWORDS.has(t.toLowerCase())), ...functions];
    return { line: code.slice(0, index).split("\n").length, declaration: `${property.toLowerCase()}: ${value}`, literals };
  });
}

/**
 * Allowlist: declaración normalizada -> motivo. Se compara por igualdad exacta, así que cambiar una entrada
 * (sumar un literal, tokenizar solo una parte, renombrar la animación) deja de coincidir y falla. Cada
 * entrada cubre UNA declaración (una copia idéntica en otra regla también falla) y no puede quedar muerta:
 * si ninguna declaración la usa, el test pide borrarla.
 */

/** Excepciones permanentes: literales legítimos que no son valores de diseño. No se tokenizan. */
const MOTION_EXCEPTIONS: Record<string, string> = {
  "animation-duration: 0.001ms": "Idioma estándar de reduced-motion: colapsa toda animación sin apagarla (siguen disparando los eventos).",
  "transition-duration: 0.001ms": "Ídem animation-duration.",
  "animation: hero-progress linear both":
    "@keyframes hero-progress va guiada por scroll (animation-timeline), no por tiempo: `linear` la mapea 1:1 al scroll y no hay duración.",
};

/** Deuda real de la PR de tokens: literales preexistentes que quedaron fuera de alcance. */
const MOTION_DEBT: Record<string, string> = {
  "animation: breathe 6s var(--ease-in-out) infinite alternate":
    "@keyframes breathe (wordmark sin puntero). Al saldar: token de duración de loop ambiental (hoy no existe).",
  "animation: marquee 28s linear infinite":
    "@keyframes marquee (franja de clientes). Al saldar: token de duración de loop (28 s); `linear` tampoco tiene token.",
  "animation: work-scroll 8s ease-in-out infinite alternate":
    "@keyframes work-scroll (captura de las cards de Work). Al saldar: `ease-in-out` ES var(--ease-loop) (mismo comportamiento) y el 8s necesita un token de duración de loop.",
};

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
      @keyframes k { from { opacity: 0 } to { animation-timing-function: linear } }
      .e { transition-timing-function: linear; animation-duration: var(--dur-fast); }
      .f { ANIMATION-DELAY: 1S; animation-delay: var(--x, 250ms); animation-range: 0 20vh; transition: none }
      .g { animation: a var(--dur-slow) steps(4); transition-delay: calc(var(--i)*70ms) }
      .animation-x:hover { color: red }
    `;
    const all = motionDeclarations(sample);
    expect(all.filter(({ literals }) => literals.length).map(({ declaration, literals }) => ({ declaration, literals }))).toEqual([
      { declaration: "transition: color 99ms ease", literals: ["99ms", "ease"] }, // sin excepción para :root
      { declaration: "animation-delay: calc(var(--i) * -4s)", literals: ["-4s"] },
      {
        declaration: "transition: opacity .5s ease-in-out, transform 200ms cubic-bezier(0.2, 0, 0, 1)", // sin `!important`
        literals: [".5s", "ease-in-out", "200ms", "cubic-bezier"],
      },
      { declaration: "animation-timing-function: linear", literals: ["linear"] },
      { declaration: "transition-timing-function: linear", literals: ["linear"] },
      { declaration: "animation-delay: 1S", literals: ["1S"] }, // propiedad normalizada a minúsculas
      { declaration: "animation-delay: var(--x, 250ms)", literals: ["250ms"] },
      { declaration: "animation: a var(--dur-slow) steps(4)", literals: ["steps"] },
      { declaration: "transition-delay: calc(var(--i)*70ms)", literals: ["70ms"] },
    ]);
    expect(all, "las declaraciones sin literales también se cuentan (las usa el piso de sanidad)").toHaveLength(16);
    expect(motionDeclarations("a { }\n\n/* x\ny */ b { animation: x 5s }")[0].line, "los comentarios conservan las líneas").toBe(4);
  });

  it("globals.css no suma duraciones, delays ni curvas literales: usar los tokens de lib/motion.ts", () => {
    const all = motionDeclarations(css);
    // Sin esto, si el escáner dejara de encontrar declaraciones el guard aprobaría en silencio.
    expect(all.length, "no se encontraron declaraciones de animation/transition").toBeGreaterThan(50);

    const allowed = { ...MOTION_EXCEPTIONS, ...MOTION_DEBT };
    const used = new Set<string>();
    const offenders: string[] = [];
    for (const { line, declaration, literals } of all) {
      if (!literals.length) continue;
      if (Object.hasOwn(allowed, declaration) && !used.has(declaration)) used.add(declaration);
      else offenders.push(`  app/globals.css:${line}  ${declaration}  (literales: ${literals.join(", ")})`);
    }

    const unused = (list: Record<string, string>) => Object.keys(list).filter((declaration) => !used.has(declaration)).map((d) => `  ${d}`);
    const report: string[] = [];
    if (offenders.length) {
      report.push(
        "Literales de duración/delay/curva en globals.css:",
        ...offenders,
        'Usá los tokens del bloque "Tokens de movimiento" de :root (espejo de lib/motion.ts); si falta uno, agregalo en los dos lados. Para duración cero, `transition: none`.',
      );
    }
    const settled = unused(MOTION_DEBT);
    if (settled.length) report.push("Deuda ya saldada: borrala de MOTION_DEBT (si la declaración cambió y aún trae literales, actualizá la entrada):", ...settled);
    const gone = unused(MOTION_EXCEPTIONS);
    if (gone.length) report.push("Excepción que ya no existe: borrala de MOTION_EXCEPTIONS:", ...gone);
    if (report.length) expect.fail(report.join("\n"));
  });
});
