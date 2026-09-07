# Flexora Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el sistema visual de Flexora (tokens, tipografía, tema claro/oscuro, primitivas, lenguaje de movimiento) y la home completa bilingüe (ES/EN) con el concepto "Flex": hero con wordmark de anchura variable sobre un campo violeta elástico en WebGL.

**Architecture:** Next 16 App Router con todo bajo `app/[lang]/`, prerenderizado estático para `es` y `en`. Diccionarios JSON por idioma leídos con `next/root-params`; `proxy.ts` redirige `/` al idioma del navegador. Server Components por defecto; client solo para WebGL, wordmark, marquee, switches y header. Tema con tokens semánticos CSS y script inline sin flash.

**Tech Stack:** Next 16.3, React 19.2, Tailwind 4, TypeScript, `motion` (springs), `ogl` (WebGL), `negotiator` + `@formatjs/intl-localematcher` (idioma), Vitest + Testing Library (unit/component), Playwright + axe (e2e).

**Spec:** `docs/superpowers/specs/2026-09-07-flexora-home-design.md`

## Global Constraints

Copiadas del spec. Todas las tareas las heredan.

- **Leer la doc local antes de usar una API de Next:** `node_modules/next/dist/docs/01-app/` (AGENTS.md lo exige; esta versión difiere del entrenamiento). Middleware se llama `proxy.ts`. `LayoutProps<'/[lang]'>` y `PageProps` son globales tras `npx next typegen`.
- **Dependencias nuevas permitidas (runtime):** `motion`, `ogl`, `negotiator`, `@formatjs/intl-localematcher`. Ninguna otra. Sin CMS, sin librería de i18n, sin smooth-scroll.
- **Colores:** ningún componente usa un color literal; solo tokens `--bg`, `--surface`, `--fg`, `--fg-muted`, `--border`, `--accent`, `--accent-soft`. Valores exactos en Task 2. Sin gradientes decorativos, sin glassmorphism, sin bordes degradados, sin tiles de íconos genéricos.
- **Tipografía:** Anybody (display, `axes: ['wdth']`), Geist (cuerpo), Geist Mono (etiquetas). Cuerpo nunca bajo 16px. Esquinas 4–8px, nunca píldoras.
- **Motion:** solo tokens de `lib/motion.ts` / variables CSS. Nunca `ease-in`, nunca `scale(0)`, nunca `transition: all`. Reveals: 12px, 500ms, stagger 60ms, una sola vez. Press: `scale(0.97)` 120ms. Switch de idioma sin animación.
- **Reduced motion:** con `prefers-reduced-motion: reduce` no corre ninguna animación, el campo WebGL se reemplaza por imagen estática.
- **WebGL:** inicializar solo en viewport, pausar fuera de vista, DPR máx 1.5 desktop / 1 móvil. Si no hay WebGL, fallback estático y la página nunca rompe.
- **Copy:** placeholder realista, voseo en ES, neutro en EN, **solo** en `app/[lang]/dictionaries/{es,en}.json` y `content/work.ts`. Nada hardcodeado en componentes.
- **Ids de sección** (constantes en ambos idiomas): `services`, `work`, `process`, `contact`.
- **Commits:** mensajes en español, con el trailer:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY
  ```
- **Verificación antes de decir "listo":** `npm run lint && npm run test && npm run build` en verde.

## Assets que debe proveer el cliente (no bloquean)

- `public/logo.svg` con las curvas reales del wordmark. Mientras tanto Task 7 crea un `Logo.tsx` que dibuja el wordmark con Anybody; se reemplaza cuando llegue el SVG.
- Covers reales de proyectos en `public/covers/`. Task 13 crea cuatro SVG autorados como placeholder.
- Número de WhatsApp en `.env.local` (`NEXT_PUBLIC_WHATSAPP_NUMBER`).
- Textos definitivos (los edita el colega en los JSON).

## File Structure

```
app/[lang]/layout.tsx              html, fuentes, script de tema, Header, Footer, metadata
app/[lang]/page.tsx                compone Hero, Marquee, Services, Work, Process, Closing
app/[lang]/dictionaries.ts         getDictionary() vía next/root-params
app/[lang]/dictionaries/es.json    copy ES
app/[lang]/dictionaries/en.json    copy EN
app/globals.css                    tokens, @theme, tipografía, motion, reveals, componentes CSS
proxy.ts                           redirect de locale
lib/i18n.ts                        locales, isLocale, matchLocale, switchLocalePath
lib/theme.ts                       resolveTheme, THEME_KEY, THEME_INIT_SCRIPT
lib/motion.ts                      tokens de motion (TS)
lib/gl.ts                          canUseWebGL, cssVarToRgb, clampDpr
lib/whatsapp.ts                    whatsappHref
content/work.ts                    proyectos
components/ui/Button.tsx           primaria/secundaria, <a> o <button>
components/ui/TextLink.tsx         link con subrayado
components/ui/Label.tsx            rótulo mono
components/ui/ThemeSwitch.tsx      círculo partido, client
components/ui/LangSwitch.tsx       ES/EN, client
components/site/Logo.tsx           wordmark SVG
components/site/Header.tsx         client (estado scrolled)
components/site/Footer.tsx
components/site/Reveal.tsx         client, IntersectionObserver una vez
components/site/Hero.tsx           server: compone FlexField + FlexWordmark + copy
components/site/FlexWordmark.tsx   client: wdth sigue al cursor, progreso de scroll
components/site/Marquee.tsx        client: banda arrastrable
components/site/Services.tsx       + ServiceVisuals.tsx (3 visuales autorados)
components/site/Work.tsx           + WorkCard.tsx (usa DistortImage)
components/site/Process.tsx
components/site/Closing.tsx
components/gl/FlexField.tsx        canvas OGL, campo elástico
components/gl/flex-field.shaders.ts  vertex + fragment como strings
components/gl/DistortImage.tsx     cover con distorsión al hover
components/gl/distort-image.shaders.ts
public/covers/{01..04}.svg
public/field-fallback-{dark,light}.jpg   generados por scripts/capture-field.mjs
scripts/capture-field.mjs          screenshot del canvas para los fallbacks
__tests__/**                       unit + component (Vitest)
e2e/**                             Playwright
vitest.config.mts, playwright.config.ts, .env.example
```

---

### Task 1: Tooling de tests + tokens de motion

Instala todo lo que el resto del plan necesita y deja el primer test verde: los tokens de motion son la primera pieza del sistema y la más barata de testear.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`
- Create: `lib/motion.ts`
- Create: `__tests__/lib/motion.test.ts`
- Modify: `.gitignore`
- Move: `public/Flexora idea 1.jpeg` → `docs/brand/flexora-idea-1.jpeg`
- Modify: `docs/superpowers/specs/2026-09-07-flexora-home-design.md` (ruta de la imagen)

**Interfaces:**
- Produces: `lib/motion.ts` exporta `EASE_OUT: string`, `EASE_IN_OUT: string`, `DURATION: { fast: 120; base: 200; slow: 500 }`, `SPRING_BASE: { type: "spring"; duration: 0.4; bounce: 0.2 }`, `SPRING_FOLLOW: { stiffness: 120; damping: 24; mass: 1 }`, `REVEAL: { offsetPx: 12; staggerMs: 60 }`.

- [ ] **Step 1: Instalar dependencias**

```bash
npm install motion ogl negotiator @formatjs/intl-localematcher
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @types/negotiator @playwright/test @axe-core/playwright
npx playwright install chromium
```

- [ ] **Step 2: Configurar Vitest y scripts**

Crear `vitest.config.mts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

Crear `vitest.setup.ts` (jsdom no implementa `matchMedia`, que usan `useReducedMotion` de Motion y `lib/gl`; los tests que necesiten otro valor lo sobreescriben):

```ts
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}
```

En `package.json`, reemplazar `"scripts"` por:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test",
  "typegen": "next typegen"
}
```

Agregar al final de `.gitignore`:

```
# tests
/test-results
/playwright-report
/.superpowers
```

- [ ] **Step 3: Mover la imagen de marca fuera de public**

```bash
mkdir -p docs/brand
git mv "public/Flexora idea 1.jpeg" docs/brand/flexora-idea-1.jpeg 2>/dev/null || mv "public/Flexora idea 1.jpeg" docs/brand/flexora-idea-1.jpeg
sed -i '' 's#public/Flexora idea 1.jpeg#docs/brand/flexora-idea-1.jpeg#g' docs/superpowers/specs/2026-09-07-flexora-home-design.md
```

- [ ] **Step 4: Escribir el test que falla**

`__tests__/lib/motion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE_IN_OUT,
  EASE_OUT,
  REVEAL,
  SPRING_BASE,
  SPRING_FOLLOW,
} from "@/lib/motion";

describe("motion tokens", () => {
  it("usa las curvas del spec", () => {
    expect(EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(EASE_IN_OUT).toBe("cubic-bezier(0.77, 0, 0.175, 1)");
  });

  it("usa las duraciones del spec en ms", () => {
    expect(DURATION).toEqual({ fast: 120, base: 200, slow: 500 });
  });

  it("define el spring base y el de seguimiento", () => {
    expect(SPRING_BASE).toEqual({ type: "spring", duration: 0.4, bounce: 0.2 });
    expect(SPRING_FOLLOW).toEqual({ stiffness: 120, damping: 24, mass: 1 });
  });

  it("define los parámetros de reveal", () => {
    expect(REVEAL).toEqual({ offsetPx: 12, staggerMs: 60 });
  });
});
```

- [ ] **Step 5: Correr el test y verificar que falla**

Run: `npm test`
Expected: FAIL, `Cannot find module '@/lib/motion'`.

- [ ] **Step 6: Implementar los tokens**

`lib/motion.ts`:

```ts
/**
 * Tokens de movimiento. Fuente única: ningún componente inventa curvas ni duraciones.
 * Los mismos valores viven como variables CSS en app/globals.css.
 */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

export const DURATION = { fast: 120, base: 200, slow: 500 } as const;

/** Spring para cambios de estado discretos (switch de tema, marquee al soltar). */
export const SPRING_BASE = { type: "spring", duration: 0.4, bounce: 0.2 } as const;

/** Spring para valores que siguen al puntero (wordmark, campo). Sin bounce. */
export const SPRING_FOLLOW = { stiffness: 120, damping: 24, mass: 1 } as const;

export const REVEAL = { offsetPx: 12, staggerMs: 60 } as const;
```

- [ ] **Step 7: Correr el test y verificar que pasa**

Run: `npm test`
Expected: PASS, 4 tests.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.mts vitest.setup.ts lib/motion.ts __tests__/lib/motion.test.ts .gitignore docs/brand docs/superpowers/specs
git commit -m "chore: tooling de tests y tokens de motion

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 2: Tokens de diseño en CSS y fuentes

Define los dos temas, la tipografía y las variables de motion en `globals.css`, y carga Anybody con el eje `wdth`. El test protege el contrato de tokens contra borrados accidentales.

**Files:**
- Modify: `app/globals.css` (reemplazar completo)
- Create: `lib/fonts.ts`
- Create: `__tests__/design/tokens.test.ts`

**Interfaces:**
- Produces: variables CSS `--bg --surface --fg --fg-muted --border --accent --accent-soft --switch-half --header-h --ease-out --ease-in-out --dur-fast --dur-base --dur-slow --text-display --text-h2 --text-h3 --text-body --text-label`; utilidades Tailwind `bg-bg bg-surface text-fg text-fg-muted border-border bg-accent text-accent font-display font-sans font-mono`; clases `.container-site`, `.label`, `.display`, `.h2`, `.h3`.
- Produces: `lib/fonts.ts` exporta `anybody`, `geistSans`, `geistMono` (objetos de `next/font`) con variables `--font-anybody`, `--font-geist-sans`, `--font-geist-mono`.

- [ ] **Step 1: Escribir el test que falla**

`__tests__/design/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

const SEMANTIC = ["--bg", "--surface", "--fg", "--fg-muted", "--border", "--accent", "--accent-soft", "--switch-half"];

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

  it("no usa ease-in ni transition: all", () => {
    expect(css).not.toMatch(/[^-]ease-in[^-]/);
    expect(css).not.toContain("transition: all");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test`
Expected: FAIL en "define cada token semántico".

- [ ] **Step 3: Escribir globals.css**

Reemplazar `app/globals.css` completo:

```css
@import "tailwindcss";

/* ---------- Tokens semánticos ---------- */
:root {
  color-scheme: dark;
  --bg: #09090b;
  --surface: #111114;
  --fg: #f4f3f8;
  --fg-muted: #a1a0ac;
  --border: rgb(255 255 255 / 0.08);
  --accent: #7a3bff;
  --accent-soft: #b79cff;
  --switch-half: #09090b;

  --header-h: 72px;
  --container-max: 1440px;
  --gutter: clamp(16px, 4vw, 64px);

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 500ms;

  --text-display: clamp(3.5rem, 11vw, 10rem);
  --text-h2: clamp(2rem, 5vw, 4.5rem);
  --text-h3: clamp(1.375rem, 2.2vw, 1.75rem);
  --text-body: clamp(1rem, 1.05vw, 1.125rem);
  --text-label: 0.75rem;

  --radius-sm: 4px;
  --radius-md: 8px;
}

[data-theme="light"] {
  color-scheme: light;
  --bg: #f6f5fa;
  --surface: #ffffff;
  --fg: #0e0e12;
  --fg-muted: #5d5c6a;
  --border: rgb(0 0 0 / 0.08);
  --accent: #6a2bf2;
  --accent-soft: #8a5cff;
  --switch-half: #f6f5fa;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --font-display: var(--font-anybody);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* ---------- Base ---------- */
html {
  scroll-behavior: auto;
  -webkit-text-size-adjust: 100%;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: 1.6;
  letter-spacing: 0.005em;
  -webkit-font-smoothing: antialiased;
}

/* Transición de tema: solo mientras html.theme-changing está presente (200ms). */
html.theme-changing,
html.theme-changing *,
html.theme-changing *::before,
html.theme-changing *::after {
  transition:
    background-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    fill var(--dur-base) var(--ease-out);
}

:focus-visible {
  outline: 2px solid var(--accent-soft);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

::selection {
  background: var(--accent);
  color: #fff;
}

/* ---------- Layout ---------- */
.container-site {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.section {
  padding-block: clamp(4rem, 10vw, 9rem);
}

.hairline {
  border-top: 1px solid var(--border);
}

/* ---------- Tipografía ---------- */
.display {
  font-family: var(--font-display);
  font-weight: 800;
  font-variation-settings: "wdth" 140;
  font-size: var(--text-display);
  line-height: 0.9;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.h2 {
  font-family: var(--font-display);
  font-weight: 700;
  font-variation-settings: "wdth" 125;
  font-size: var(--text-h2);
  line-height: 1;
  letter-spacing: -0.015em;
}

.h3 {
  font-family: var(--font-display);
  font-weight: 600;
  font-variation-settings: "wdth" 115;
  font-size: var(--text-h3);
  line-height: 1.15;
}

.label {
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.measure {
  max-width: 62ch;
}

/* ---------- Botones y links ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  text-decoration: none;
  transition:
    transform var(--dur-fast) var(--ease-out),
    background-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out);
}
.btn:active {
  transform: scale(0.97);
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover {
  background: var(--accent-soft);
}
.btn-secondary {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  border-color: var(--fg-muted);
}

.text-link {
  position: relative;
  color: inherit;
  text-decoration: none;
}
.text-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 1px;
  width: 100%;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-base) var(--ease-out);
}
.text-link:hover::after,
.text-link:focus-visible::after {
  transform: scaleX(1);
}

/* ---------- Reveal ---------- */
[data-reveal] > * {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity var(--dur-slow) var(--ease-out),
    transform var(--dur-slow) var(--ease-out);
}
[data-reveal] > *:nth-child(2) { transition-delay: 60ms; }
[data-reveal] > *:nth-child(3) { transition-delay: 120ms; }
[data-reveal] > *:nth-child(4) { transition-delay: 180ms; }
[data-reveal] > *:nth-child(5) { transition-delay: 240ms; }
[data-reveal] > *:nth-child(6) { transition-delay: 300ms; }
[data-reveal] > *:nth-child(n + 7) { transition-delay: 360ms; }
[data-reveal][data-visible] > * {
  opacity: 1;
  transform: none;
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  [data-reveal] > * {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 4: Crear lib/fonts.ts**

```ts
import { Anybody, Geist, Geist_Mono } from "next/font/google";

export const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test`
Expected: PASS (motion + tokens).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css lib/fonts.ts __tests__/design/tokens.test.ts
git commit -m "feat: tokens de diseño, dos temas y fuentes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 3: i18n: locales, matcher, diccionarios y proxy

**Files:**
- Create: `lib/i18n.ts`
- Create: `app/[lang]/dictionaries/es.json`
- Create: `app/[lang]/dictionaries/en.json`
- Create: `app/[lang]/dictionaries.ts`
- Create: `proxy.ts`
- Create: `__tests__/lib/i18n.test.ts`
- Create: `__tests__/i18n/dictionaries-parity.test.ts`

**Interfaces:**
- Produces: `lib/i18n.ts`: `locales: readonly ["es","en"]`, `type Locale = "es"|"en"`, `defaultLocale: Locale`, `isLocale(v: string): v is Locale`, `matchLocale(acceptLanguage: string | null): Locale`, `switchLocalePath(pathname: string, target: Locale): string`.
- Produces: `app/[lang]/dictionaries.ts`: `type Dictionary` (shape de es.json), `getDictionary(): Promise<Dictionary>` (server only), `getLocale(): Promise<Locale>`.

- [ ] **Step 1: Test de lib/i18n que falla**

`__tests__/lib/i18n.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales, matchLocale, switchLocalePath } from "@/lib/i18n";

describe("locales", () => {
  it("soporta es y en, con es por defecto", () => {
    expect(locales).toEqual(["es", "en"]);
    expect(defaultLocale).toBe("es");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

describe("matchLocale", () => {
  it("elige inglés cuando el navegador lo prefiere", () => {
    expect(matchLocale("en-US,en;q=0.9,es;q=0.5")).toBe("en");
  });
  it("mapea variantes regionales de español a es", () => {
    expect(matchLocale("es-AR,es;q=0.9")).toBe("es");
  });
  it("cae al default sin header o con idiomas no soportados", () => {
    expect(matchLocale(null)).toBe("es");
    expect(matchLocale("fr-FR,de;q=0.8")).toBe("es");
  });
});

describe("switchLocalePath", () => {
  it("reemplaza el segmento de idioma y conserva el resto", () => {
    expect(switchLocalePath("/es", "en")).toBe("/en");
    expect(switchLocalePath("/es/trabajos/x", "en")).toBe("/en/trabajos/x");
    expect(switchLocalePath("/", "en")).toBe("/en");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- i18n`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar lib/i18n.ts**

```ts
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const languages = new Negotiator({ headers: { "accept-language": acceptLanguage } }).languages();
  try {
    const matched = match(languages, locales as unknown as string[], defaultLocale);
    return isLocale(matched) ? matched : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) segments[0] = target;
  else segments.unshift(target);
  return `/${segments.join("/")}`;
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- i18n`
Expected: PASS.

- [ ] **Step 5: Test de paridad de diccionarios que falla**

`__tests__/i18n/dictionaries-parity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import es from "@/app/[lang]/dictionaries/es.json";
import en from "@/app/[lang]/dictionaries/en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    // Los arrays comparan por longitud y por la forma de su primer elemento.
    const first = value[0];
    return [`${prefix}[len=${value.length}]`, ...keyPaths(first, `${prefix}[]`)];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe("diccionarios", () => {
  it("es y en tienen exactamente las mismas claves y tamaños de lista", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(es).sort());
  });

  it("ningún string está vacío", () => {
    const check = (v: unknown, path: string) => {
      if (typeof v === "string") expect(v.trim(), path).not.toBe("");
      else if (Array.isArray(v)) v.forEach((x, i) => check(x, `${path}[${i}]`));
      else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => check(x, `${path}.${k}`));
    };
    check(es, "es");
    check(en, "en");
  });
});
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- parity`
Expected: FAIL, JSON no encontrado.

- [ ] **Step 7: Crear los diccionarios**

`app/[lang]/dictionaries/es.json`:

```json
{
  "meta": {
    "title": "Flexora — Webs, marketing y marca",
    "description": "Estudio de desarrollo web, marketing digital y branding. Hacemos que tu negocio se vea y venda como merece."
  },
  "nav": {
    "services": "Servicios",
    "work": "Trabajos",
    "contact": "Contacto",
    "cta": "Hablemos",
    "home": "Ir al inicio",
    "primary": "Navegación principal"
  },
  "theme": {
    "toLight": "Cambiar a tema claro",
    "toDark": "Cambiar a tema oscuro"
  },
  "lang": {
    "label": "Idioma",
    "es": "Español",
    "en": "English"
  },
  "hero": {
    "tagline": "Webs, marketing y marca para negocios que quieren crecer.",
    "primary": "Hablemos",
    "secondary": "Ver trabajos",
    "whatsappMessage": "Hola Flexora, quiero hablar sobre un proyecto."
  },
  "marquee": {
    "items": ["Desarrollo web", "Marketing y ads", "Branding"]
  },
  "services": {
    "label": "Servicios",
    "title": "Tres disciplinas, un solo equipo.",
    "items": [
      {
        "index": "01",
        "label": "Desarrollo",
        "title": "Desarrollo web",
        "description": "Sitios, landings y e-commerce hechos a medida. Rápidos, medibles y fáciles de mantener.",
        "deliverables": ["Sitios institucionales", "Landings de campaña", "E-commerce", "Apps web a medida"]
      },
      {
        "index": "02",
        "label": "Marketing",
        "title": "Marketing y ads",
        "description": "Campañas en Meta y Google con embudos que convierten. Decidimos con datos, no con corazonadas.",
        "deliverables": ["Campañas pagas", "Embudos y landings", "Medición y reportes", "Optimización continua"]
      },
      {
        "index": "03",
        "label": "Branding",
        "title": "Branding e identidad",
        "description": "Marcas con carácter propio: logo, sistema visual y tono de voz que se reconocen en cualquier canal.",
        "deliverables": ["Identidad visual", "Logo y sistema", "Manual de marca", "Piezas de lanzamiento"]
      }
    ]
  },
  "work": {
    "label": "Trabajos",
    "title": "Lo que hicimos, con resultados.",
    "viewCase": "Ver caso"
  },
  "process": {
    "label": "Cómo trabajamos",
    "title": "Simple de principio a fin.",
    "steps": [
      { "title": "Escuchamos", "description": "Una charla para entender qué necesitás, a quién le hablás y qué tiene que pasar." },
      { "title": "Proponemos", "description": "Un plan concreto con alcance, tiempos y costo. Sin letra chica." },
      { "title": "Construimos", "description": "Diseño y desarrollo en ciclos cortos. Ves avances reales cada semana." },
      { "title": "Medimos", "description": "Lanzamos, medimos y ajustamos. El trabajo termina cuando funciona." }
    ]
  },
  "closing": {
    "title": "Hablemos",
    "description": "Contanos qué querés lograr. Te respondemos el mismo día.",
    "primary": "Escribir por WhatsApp",
    "emailLabel": "o por mail a",
    "email": "hola@flexora.com.ar"
  },
  "footer": {
    "rights": "Todos los derechos reservados.",
    "madeIn": "Hecho en Argentina."
  }
}
```

`app/[lang]/dictionaries/en.json`:

```json
{
  "meta": {
    "title": "Flexora — Web, marketing and brand",
    "description": "Web development, digital marketing and branding studio. We make your business look and sell the way it deserves."
  },
  "nav": {
    "services": "Services",
    "work": "Work",
    "contact": "Contact",
    "cta": "Let's talk",
    "home": "Go to home",
    "primary": "Main navigation"
  },
  "theme": {
    "toLight": "Switch to light theme",
    "toDark": "Switch to dark theme"
  },
  "lang": {
    "label": "Language",
    "es": "Español",
    "en": "English"
  },
  "hero": {
    "tagline": "Web, marketing and brand for businesses that want to grow.",
    "primary": "Let's talk",
    "secondary": "See work",
    "whatsappMessage": "Hi Flexora, I'd like to talk about a project."
  },
  "marquee": {
    "items": ["Web development", "Marketing & ads", "Branding"]
  },
  "services": {
    "label": "Services",
    "title": "Three disciplines, one team.",
    "items": [
      {
        "index": "01",
        "label": "Development",
        "title": "Web development",
        "description": "Custom sites, landings and e-commerce. Fast, measurable and easy to maintain.",
        "deliverables": ["Corporate sites", "Campaign landings", "E-commerce", "Custom web apps"]
      },
      {
        "index": "02",
        "label": "Marketing",
        "title": "Marketing & ads",
        "description": "Meta and Google campaigns with funnels that convert. We decide with data, not hunches.",
        "deliverables": ["Paid campaigns", "Funnels and landings", "Tracking and reports", "Continuous optimization"]
      },
      {
        "index": "03",
        "label": "Branding",
        "title": "Branding & identity",
        "description": "Brands with a character of their own: logo, visual system and voice that stand out on any channel.",
        "deliverables": ["Visual identity", "Logo and system", "Brand guidelines", "Launch assets"]
      }
    ]
  },
  "work": {
    "label": "Work",
    "title": "What we did, with results.",
    "viewCase": "View case"
  },
  "process": {
    "label": "How we work",
    "title": "Simple from start to finish.",
    "steps": [
      { "title": "We listen", "description": "A conversation to understand what you need, who you talk to and what has to happen." },
      { "title": "We propose", "description": "A concrete plan with scope, timeline and cost. No fine print." },
      { "title": "We build", "description": "Design and development in short cycles. You see real progress every week." },
      { "title": "We measure", "description": "We launch, measure and adjust. The work is done when it works." }
    ]
  },
  "closing": {
    "title": "Let's talk",
    "description": "Tell us what you want to achieve. We reply the same day.",
    "primary": "Message on WhatsApp",
    "emailLabel": "or email us at",
    "email": "hola@flexora.com.ar"
  },
  "footer": {
    "rights": "All rights reserved.",
    "madeIn": "Made in Argentina."
  }
}
```

- [ ] **Step 8: Correr y verificar que pasa**

Run: `npm test -- parity`
Expected: PASS.

- [ ] **Step 9: Crear dictionaries.ts y proxy.ts**

`app/[lang]/dictionaries.ts` (patrón de la guía `02-guides/internationalization.md`, usa `next/root-params`; solo Server Components):

```ts
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import type es from "./dictionaries/es.json";

export type Dictionary = typeof es;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default as Dictionary),
};

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!value || !isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale]();
}
```

`proxy.ts` en la raíz del proyecto:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { locales, matchLocale } from "@/lib/i18n";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const locale = matchLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Excluye _next, api y cualquier ruta con extensión (archivos estáticos).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

- [ ] **Step 10: Lint y commit**

Run: `npm run lint && npm test`
Expected: sin errores.

```bash
git add lib/i18n.ts app/\[lang\]/dictionaries.ts app/\[lang\]/dictionaries proxy.ts __tests__/lib/i18n.test.ts __tests__/i18n
git commit -m "feat: i18n con diccionarios ES/EN, matcher de idioma y proxy

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 4: Tema: resolución, script inline y ThemeSwitch

**Files:**
- Create: `lib/theme.ts`
- Create: `components/ui/ThemeSwitch.tsx`
- Create: `__tests__/lib/theme.test.ts`
- Create: `__tests__/components/ThemeSwitch.test.tsx`
- Modify: `app/globals.css` (estilos del switch, al final)

**Interfaces:**
- Produces: `lib/theme.ts`: `type Theme = "dark" | "light"`, `THEME_KEY = "flexora-theme"`, `resolveTheme(stored: string | null, prefersLight: boolean): Theme`, `THEME_INIT_SCRIPT: string`, `applyTheme(theme: Theme): void` (setea `data-theme`, guarda en localStorage, agrega `theme-changing` 250ms).
- Produces: `<ThemeSwitch labels={{ toLight: string; toDark: string }} />` client component.

- [ ] **Step 1: Test de lib/theme que falla**

`__tests__/lib/theme.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT, THEME_KEY, applyTheme, resolveTheme } from "@/lib/theme";

describe("resolveTheme", () => {
  it("la elección guardada gana sobre el sistema", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });
  it("sin elección guardada sigue al sistema", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
  });
  it("ignora valores inválidos guardados", () => {
    expect(resolveTheme("banana", true)).toBe("light");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  function run(prefersLight: boolean) {
    window.matchMedia = ((q: string) => ({ matches: prefersLight && q.includes("light") })) as never;
    new Function(THEME_INIT_SCRIPT)();
  }

  it("aplica el tema guardado antes del render", () => {
    localStorage.setItem(THEME_KEY, "light");
    run(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("sin guardado usa el sistema", () => {
    run(true);
    expect(document.documentElement.dataset.theme).toBe("light");
    run(false);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("setea el atributo y persiste", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("theme-changing")).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- theme`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar lib/theme.ts**

```ts
export type Theme = "dark" | "light";
export const THEME_KEY = "flexora-theme";

export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersLight ? "light" : "dark";
}

/**
 * Se inyecta inline en <html> y corre antes del primer paint (guía de Next
 * "preventing flash before hydration"). Debe replicar resolveTheme sin imports.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var l=window.matchMedia("(prefers-color-scheme: light)").matches;var t=(s==="light"||s==="dark")?s:(l?"light":"dark");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

let changingTimer: ReturnType<typeof setTimeout> | undefined;

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.add("theme-changing");
  html.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sin storage (modo privado): el tema dura la sesión.
  }
  clearTimeout(changingTimer);
  changingTimer = setTimeout(() => html.classList.remove("theme-changing"), 250);
}

export function readTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  return current === "light" ? "light" : "dark";
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- theme`
Expected: PASS.

- [ ] **Step 5: Test de ThemeSwitch que falla**

`__tests__/components/ThemeSwitch.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
  return { ...actual, useReducedMotion: () => true };
});

const labels = { toLight: "Cambiar a tema claro", toDark: "Cambiar a tema oscuro" };

describe("ThemeSwitch", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("anuncia el tema al que cambia", () => {
    render(<ThemeSwitch labels={labels} />);
    expect(screen.getByRole("button", { name: labels.toLight })).toBeTruthy();
  });

  it("al tocar cambia data-theme y persiste", () => {
    render(<ThemeSwitch labels={labels} />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("flexora-theme")).toBe("light");
    expect(screen.getByRole("button", { name: labels.toDark })).toBeTruthy();
  });
});
```

- [ ] **Step 6: Correr y verificar que falla**

Run: `npm test -- ThemeSwitch`
Expected: FAIL, componente no encontrado.

- [ ] **Step 7: Implementar ThemeSwitch**

`components/ui/ThemeSwitch.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { SPRING_BASE } from "@/lib/motion";

type Props = { labels: { toLight: string; toDark: string } };

export function ThemeSwitch({ labels }: Props) {
  // El script inline ya aplicó el tema; leemos el DOM tras montar para no desincronizar SSR.
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const iconRef = useRef<SVGSVGElement>(null);
  const turns = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    if (!reduced && iconRef.current) {
      turns.current += 1;
      animate(iconRef.current, { rotate: turns.current * 180 }, SPRING_BASE);
    }
  }

  const label = theme === "dark" ? labels.toLight : labels.toDark;

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-switch
      disabled={!mounted}
    >
      <svg ref={iconRef} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M14 1a13 13 0 0 0 0 26Z" fill="var(--accent)" />
        <path d="M14 1a13 13 0 0 1 0 26Z" fill="var(--switch-half)" />
        <circle cx="14" cy="14" r="13" fill="none" stroke="var(--border)" />
      </svg>
    </button>
  );
}
```

Agregar al final de `app/globals.css`:

```css
/* ---------- ThemeSwitch ---------- */
.theme-switch {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--fg);
  transition: transform var(--dur-fast) var(--ease-out);
}
.theme-switch:active {
  transform: scale(0.97);
}
.theme-switch svg {
  display: block;
  will-change: transform;
}
```

- [ ] **Step 8: Correr y verificar que pasa**

Run: `npm test -- ThemeSwitch`
Expected: PASS, 2 tests.

- [ ] **Step 9: Commit**

```bash
git add lib/theme.ts components/ui/ThemeSwitch.tsx __tests__/lib/theme.test.ts __tests__/components/ThemeSwitch.test.tsx app/globals.css
git commit -m "feat: resolución de tema sin flash y switch partido violeta

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 5: Primitivas UI y link de WhatsApp

**Files:**
- Create: `lib/whatsapp.ts`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/TextLink.tsx`
- Create: `components/ui/Label.tsx`
- Create: `.env.example`
- Create: `__tests__/lib/whatsapp.test.ts`
- Create: `__tests__/components/Button.test.tsx`

**Interfaces:**
- Produces: `whatsappHref(text: string, number?: string): string` (usa `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER` si no se pasa número; default `"5491100000000"`).
- Produces: `<Button variant="primary"|"secondary" href?: string ...>` → `<a>` si hay `href`, `<button type="button">` si no. Clases `btn btn-primary|btn-secondary`.
- Produces: `<TextLink href className?>` con clase `text-link`. `<Label as?="span"|"p">` con clase `label`.

- [ ] **Step 1: Tests que fallan**

`__tests__/lib/whatsapp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { whatsappHref } from "@/lib/whatsapp";

describe("whatsappHref", () => {
  it("arma el link wa.me con el texto codificado", () => {
    expect(whatsappHref("Hola Flexora, quiero hablar", "54 9 11 1234-5678")).toBe(
      "https://wa.me/5491112345678?text=Hola%20Flexora%2C%20quiero%20hablar",
    );
  });
  it("usa el número por defecto si no hay env", () => {
    expect(whatsappHref("hi")).toMatch(/^https:\/\/wa\.me\/\d+\?text=hi$/);
  });
});
```

`__tests__/components/Button.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("con href renderiza un link con clase primaria", () => {
    render(<Button href="https://wa.me/1">Hablemos</Button>);
    const a = screen.getByRole("link", { name: "Hablemos" });
    expect(a.getAttribute("href")).toBe("https://wa.me/1");
    expect(a.className).toContain("btn-primary");
  });
  it("sin href renderiza un button secundario", () => {
    render(<Button variant="secondary">Ver</Button>);
    const b = screen.getByRole("button", { name: "Ver" });
    expect(b.getAttribute("type")).toBe("button");
    expect(b.className).toContain("btn-secondary");
  });
  it("los links externos abren en pestaña nueva con rel seguro", () => {
    render(<Button href="https://wa.me/1" external>Ir</Button>);
    const a = screen.getByRole("link");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npm test -- whatsapp Button`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar**

`lib/whatsapp.ts`:

```ts
const DEFAULT_NUMBER = "5491100000000";

export function whatsappHref(text: string, number?: string): string {
  const raw = number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_NUMBER;
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
```

`components/ui/Button.tsx`:

```tsx
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";

type Props = {
  variant?: Variant;
  href?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({ variant = "primary", href, external, className = "", children, ...rest }: Props) {
  const classes = `btn btn-${variant} ${className}`.trim();
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
```

`components/ui/TextLink.tsx`:

```tsx
import type { ComponentProps } from "react";

export function TextLink({ className = "", ...rest }: ComponentProps<"a">) {
  return <a className={`text-link ${className}`.trim()} {...rest} />;
}
```

`components/ui/Label.tsx`:

```tsx
import type { ReactNode } from "react";

export function Label({ as: Tag = "span", children, className = "" }: { as?: "span" | "p"; children: ReactNode; className?: string }) {
  return <Tag className={`label ${className}`.trim()}>{children}</Tag>;
}
```

`.env.example`:

```
# Número de WhatsApp en formato internacional, solo dígitos
NEXT_PUBLIC_WHATSAPP_NUMBER=5491100000000
# URL pública del sitio, para metadata absoluta
NEXT_PUBLIC_SITE_URL=https://flexora.com.ar
```

- [ ] **Step 4: Correr y verificar que pasan**

Run: `npm test -- whatsapp Button`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp.ts components/ui/Button.tsx components/ui/TextLink.tsx components/ui/Label.tsx .env.example __tests__/lib/whatsapp.test.ts __tests__/components/Button.test.tsx
git commit -m "feat: primitivas Button, TextLink, Label y link de WhatsApp

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 6: App shell bajo app/[lang] con metadata y build estático

Mueve el layout al segmento de idioma, conecta fuentes, script de tema y metadata. La verificación es `next build` (dos rutas estáticas) y un curl al redirect. Header y Footer se agregan en Tasks 7 y 8; aquí el layout solo renderiza `children`.

**Files:**
- Delete: `app/layout.tsx`, `app/page.tsx`, `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`
- Create: `app/[lang]/layout.tsx`
- Create: `app/[lang]/page.tsx`
- Modify: `app/globals.css` (nada; ya se importa desde el layout nuevo)

**Interfaces:**
- Consumes: `getDictionary`, `getLocale` (Task 3); `anybody, geistSans, geistMono` (Task 2); `THEME_INIT_SCRIPT` (Task 4).
- Produces: `app/[lang]/layout.tsx` con `generateStaticParams`, `generateMetadata`, `<html lang data-theme suppressHydrationWarning>`. `app/[lang]/page.tsx` que por ahora renderiza un `<main id="main">` con el tagline (se completa en Task 15).

- [ ] **Step 1: Borrar el scaffold**

```bash
git rm -q app/layout.tsx app/page.tsx public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 2: Crear el layout**

`app/[lang]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { anybody, geistMono, geistSans } from "@/lib/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { locales } from "@/lib/i18n";
import { getDictionary, getLocale } from "./dictionaries";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { es: "/es", en: "/en" },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: locale === "es" ? "es_AR" : "en_US",
      type: "website",
      images: [`/og-${locale}.png`],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${anybody.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Crear la página provisional**

`app/[lang]/page.tsx`:

```tsx
import { getDictionary } from "./dictionaries";

export default async function HomePage() {
  const dict = await getDictionary();
  return (
    <main id="main" className="container-site section">
      <h1 className="display">Flexora</h1>
      <p className="measure">{dict.hero.tagline}</p>
    </main>
  );
}
```

- [ ] **Step 4: Generar tipos y compilar**

Run: `npm run typegen && npm run lint && npm run build`
Expected: build OK; en la tabla de rutas aparecen `○ /es` y `○ /en` (estáticas) y `ƒ Proxy`. Si `LayoutProps` no existe, el typegen no corrió: repetir `npm run typegen`.

- [ ] **Step 5: Verificar redirect y tema en runtime**

```bash
npm run start &
sleep 3
curl -sI -H "Accept-Language: en-US" http://localhost:3000/ | grep -i location   # → /en
curl -sI -H "Accept-Language: es-AR" http://localhost:3000/ | grep -i location   # → /es
curl -s http://localhost:3000/es | grep -o 'data-theme="dark"' | head -1
curl -s http://localhost:3000/en | grep -o 'hreflang="[a-z]*"'                     # es y en
kill %1
```

Expected: las cuatro salidas como indican los comentarios.

- [ ] **Step 6: Commit**

```bash
git add -A app public
git commit -m "feat: app shell bajo [lang] con metadata, fuentes y tema sin flash

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 7: Logo, LangSwitch y Header

**Files:**
- Create: `components/site/Logo.tsx`
- Create: `components/ui/LangSwitch.tsx`
- Create: `components/site/Header.tsx`
- Modify: `app/[lang]/layout.tsx` (montar Header)
- Modify: `app/globals.css` (estilos header)
- Create: `__tests__/components/LangSwitch.test.tsx`
- Create: `__tests__/components/Header.test.tsx`

**Interfaces:**
- Consumes: `switchLocalePath`, `Locale` (Task 3); `ThemeSwitch` (Task 4); `Button` (Task 5); `whatsappHref` (Task 5).
- Produces: `<Logo id?: string; className?: string; title: string />` SVG del wordmark, `id` por defecto `"site-logo"`. `<LangSwitch locale: Locale; labels: { label, es, en } />`. `<Header locale: Locale; labels: HeaderLabels; whatsappHref: string />` con `type HeaderLabels = { nav: Dictionary["nav"]; theme: Dictionary["theme"]; lang: Dictionary["lang"] }`. El header agrega `data-scrolled="true"` al pasar 8px de scroll.

- [ ] **Step 1: Tests que fallan**

`__tests__/components/LangSwitch.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/trabajos/uno" }));

import { LangSwitch } from "@/components/ui/LangSwitch";

const labels = { label: "Idioma", es: "Español", en: "English" };

describe("LangSwitch", () => {
  it("linkea al otro idioma conservando la ruta y marca el actual", () => {
    render(<LangSwitch locale="es" labels={labels} />);
    const en = screen.getByRole("link", { name: "English" });
    expect(en.getAttribute("href")).toBe("/en/trabajos/uno");
    expect(en.getAttribute("hreflang")).toBe("en");
    const es = screen.getByText("ES");
    expect(es.getAttribute("aria-current")).toBe("true");
  });
});
```

`__tests__/components/Header.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/es" }));

import { Header } from "@/components/site/Header";
import es from "@/app/[lang]/dictionaries/es.json";

const labels = { nav: es.nav, theme: es.theme, lang: es.lang };

describe("Header", () => {
  it("tiene nav con anclas a las secciones y CTA a WhatsApp", () => {
    render(<Header locale="es" labels={labels} whatsappHref="https://wa.me/1?text=hola" />);
    expect(screen.getByRole("link", { name: "Servicios" }).getAttribute("href")).toBe("#services");
    expect(screen.getByRole("link", { name: "Trabajos" }).getAttribute("href")).toBe("#work");
    expect(screen.getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("#contact");
    expect(screen.getByRole("link", { name: "Hablemos" }).getAttribute("href")).toBe("https://wa.me/1?text=hola");
  });

  it("marca data-scrolled al pasar 8px", () => {
    render(<Header locale="es" labels={labels} whatsappHref="#" />);
    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-scrolled")).toBe("false");
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header.getAttribute("data-scrolled")).toBe("true");
  });
});
```

- [ ] **Step 2: Correr y verificar que fallan**

Run: `npm test -- LangSwitch Header`
Expected: FAIL.

- [ ] **Step 3: Implementar Logo**

`components/site/Logo.tsx` (provisional hasta tener el SVG real; dibuja el wordmark con Anybody. Cuando llegue `public/logo.svg` se reemplaza el contenido por sus paths manteniendo props):

```tsx
type Props = { id?: string; className?: string; title: string };

export function Logo({ id = "site-logo", className = "", title }: Props) {
  return (
    <svg
      id={id}
      className={`logo ${className}`.trim()}
      viewBox="0 0 320 44"
      height="24"
      role="img"
      aria-label={title}
    >
      <text
        x="0"
        y="38"
        fontFamily="var(--font-anybody)"
        fontWeight="800"
        fontSize="44"
        style={{ fontVariationSettings: '"wdth" 150' }}
        letterSpacing="-1"
      >
        <tspan fill="var(--accent)">FLEX</tspan>
        <tspan fill="currentColor">ORA</tspan>
      </text>
    </svg>
  );
}
```

- [ ] **Step 4: Implementar LangSwitch**

`components/ui/LangSwitch.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { locales, switchLocalePath, type Locale } from "@/lib/i18n";

type Props = { locale: Locale; labels: { label: string; es: string; en: string } };

export function LangSwitch({ locale, labels }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label={labels.label} className="lang-switch">
      {locales.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" className="lang-switch__item">
            {l.toUpperCase()}
          </span>
        ) : (
          <a
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-label={labels[l]}
            className="lang-switch__item text-link"
          >
            {l.toUpperCase()}
          </a>
        ),
      )}
    </nav>
  );
}
```

El switch de idioma es un `<a>` plano, sin animación: es navegación completa a la otra ruta estática.

- [ ] **Step 5: Implementar Header**

`components/site/Header.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Logo } from "./Logo";

export type HeaderLabels = {
  nav: Dictionary["nav"];
  theme: Dictionary["theme"];
  lang: Dictionary["lang"];
};

type Props = { locale: Locale; labels: HeaderLabels; whatsappHref: string };

export function Header({ locale, labels, whatsappHref }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled ? "true" : "false"}>
      <div className="container-site site-header__inner">
        <a href={`/${locale}`} className="site-header__logo" aria-label={labels.nav.home}>
          <Logo title="Flexora" />
        </a>
        <nav className="site-header__nav" aria-label={labels.nav.primary}>
          <a href="#services" className="text-link">{labels.nav.services}</a>
          <a href="#work" className="text-link">{labels.nav.work}</a>
          <a href="#contact" className="text-link">{labels.nav.contact}</a>
        </nav>
        <div className="site-header__tools">
          <LangSwitch locale={locale} labels={labels.lang} />
          <ThemeSwitch labels={labels.theme} />
          <Button href={whatsappHref} external className="site-header__cta">
            {labels.nav.cta}
          </Button>
        </div>
      </div>
    </header>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Header ---------- */
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  height: var(--header-h);
  background: transparent;
  border-bottom: 1px solid transparent;
  transition:
    background-color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}
.site-header[data-scrolled="true"] {
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: saturate(140%) blur(8px);
  border-bottom-color: var(--border);
}
.site-header__inner {
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
}
.site-header__logo {
  display: inline-flex;
  color: var(--fg);
  /* El wordmark del hero "aterriza" acá: opacidad ligada a --hero-p (Task 10). */
  opacity: var(--logo-opacity, 1);
}
.site-header__nav {
  display: none;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9375rem;
}
.site-header__tools {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lang-switch {
  display: inline-flex;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.08em;
}
.lang-switch__item[aria-current="true"] {
  color: var(--fg);
}
.lang-switch__item:not([aria-current]) {
  color: var(--fg-muted);
}
@media (min-width: 900px) {
  .site-header__nav {
    display: flex;
  }
}
@media (max-width: 640px) {
  .site-header__cta {
    min-height: 40px;
    padding-inline: 0.875rem;
    font-size: 0.875rem;
  }
}
```

- [ ] **Step 6: Montar el header en el layout**

En `app/[lang]/layout.tsx`, agregar imports:

```tsx
import { Header } from "@/components/site/Header";
import { whatsappHref } from "@/lib/whatsapp";
```

y dentro de `RootLayout`, después de obtener `locale`, obtener `const dict = await getDictionary();` y reemplazar el `<body>` por:

```tsx
<body className="min-h-dvh flex flex-col">
  <Header
    locale={locale}
    labels={{ nav: dict.nav, theme: dict.theme, lang: dict.lang }}
    whatsappHref={whatsappHref(dict.hero.whatsappMessage)}
  />
  {children}
</body>
```

- [ ] **Step 7: Correr tests, lint y build**

Run: `npm test -- LangSwitch Header && npm run lint && npm run build`
Expected: PASS y build OK.

- [ ] **Step 8: Commit**

```bash
git add components/site/Logo.tsx components/ui/LangSwitch.tsx components/site/Header.tsx app/\[lang\]/layout.tsx app/globals.css __tests__/components/LangSwitch.test.tsx __tests__/components/Header.test.tsx
git commit -m "feat: header fijo con logo, nav, switches de idioma y tema, CTA

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 8: Reveal, Process y Footer

Las dos secciones silenciosas de la home más el mecanismo de reveal que usan todas.

**Files:**
- Create: `components/site/Reveal.tsx`
- Create: `components/site/Process.tsx`
- Create: `components/site/Footer.tsx`
- Modify: `app/[lang]/layout.tsx` (montar Footer)
- Modify: `app/globals.css` (estilos process/footer)
- Create: `__tests__/components/Reveal.test.tsx`

**Interfaces:**
- Consumes: `Dictionary` (Task 3); `Label` (Task 5); `Logo` (Task 7).
- Produces: `<Reveal as?: keyof JSX.IntrinsicElements; className?; children>` renderiza el tag con `data-reveal` y agrega `data-visible` cuando entra en viewport (una sola vez). `<Process t: Dictionary["process"] />`, `<Footer t: Dictionary["footer"]; locale: Locale />`.

- [ ] **Step 1: Test de Reveal que falla**

`__tests__/components/Reveal.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Reveal } from "@/components/site/Reveal";

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callbacks: Cb[] = [];
const disconnect = vi.fn();

beforeEach(() => {
  callbacks = [];
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn((cb: Cb) => {
      callbacks.push(cb);
      return { observe: vi.fn(), disconnect, unobserve: vi.fn() };
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Reveal", () => {
  it("marca data-visible al entrar en viewport y deja de observar", () => {
    render(
      <Reveal as="section" className="x" data-testid="r">
        <p>uno</p>
      </Reveal>,
    );
    const el = screen.getByTestId("r");
    expect(el.tagName).toBe("SECTION");
    expect(el.hasAttribute("data-reveal")).toBe(true);
    expect(el.hasAttribute("data-visible")).toBe(false);
    act(() => callbacks[0]([{ isIntersecting: true }]));
    expect(el.hasAttribute("data-visible")).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- Reveal`
Expected: FAIL.

- [ ] **Step 3: Implementar Reveal**

`components/site/Reveal.tsx`:

```tsx
"use client";

import { createElement, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType } from "react";

type Props<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

export function Reveal<T extends ElementType = "div">({ as, children, ...rest }: Props<T>) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return createElement(
    as ?? "div",
    { ref, "data-reveal": "", ...(visible ? { "data-visible": "" } : {}), ...rest },
    children,
  );
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- Reveal`
Expected: PASS.

- [ ] **Step 5: Process y Footer**

`components/site/Process.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";

export function Process({ t }: { t: Dictionary["process"] }) {
  return (
    <section id="process" className="section hairline" aria-labelledby="process-title">
      <Reveal className="container-site process">
        <Label as="p">{t.label}</Label>
        <h2 id="process-title" className="h2 process__title">{t.title}</h2>
        <ol className="process__steps">
          {t.steps.map((step, i) => (
            <li key={step.title} className="process__step">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="h3">{step.title}</h3>
              <p className="process__desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
```

`components/site/Footer.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Footer({ t, locale }: { t: Dictionary["footer"]; locale: Locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer hairline">
      <div className="container-site site-footer__inner">
        <a href={`/${locale}`} className="site-footer__logo">
          <Logo id="footer-logo" title="Flexora" />
        </a>
        <p className="label">
          © {year} Flexora. {t.rights} {t.madeIn}
        </p>
      </div>
    </footer>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Process ---------- */
.process__title {
  margin-top: 0.75rem;
  max-width: 18ch;
}
.process__steps {
  margin-top: clamp(2.5rem, 5vw, 4rem);
  display: grid;
  gap: 2rem;
  list-style: none;
  padding: 0;
}
.process__step {
  display: grid;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
}
.process__desc {
  color: var(--fg-muted);
  max-width: 34ch;
}
@media (min-width: 900px) {
  .process__steps {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* ---------- Footer ---------- */
.site-footer {
  margin-top: auto;
  padding-block: 2rem;
}
.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.site-footer__logo {
  color: var(--fg);
  display: inline-flex;
}
```

- [ ] **Step 6: Montar Footer en el layout**

En `app/[lang]/layout.tsx`: `import { Footer } from "@/components/site/Footer";` y agregar `<Footer t={dict.footer} locale={locale} />` después de `{children}` dentro de `<body>`.

- [ ] **Step 7: Lint, build y commit**

Run: `npm run lint && npm test && npm run build`
Expected: todo verde.

```bash
git add components/site/Reveal.tsx components/site/Process.tsx components/site/Footer.tsx app/\[lang\]/layout.tsx app/globals.css __tests__/components/Reveal.test.tsx
git commit -m "feat: reveal por intersección, sección de proceso y footer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 9: WebGL: helpers y FlexField (campo elástico)

El corazón del concepto. Un triángulo fullscreen con un fragment shader de ruido deformado por el puntero. El componente decide entre canvas y fallback, se inicializa solo en viewport, se pausa fuera, y lee los colores del tema desde las variables CSS.

**Files:**
- Create: `lib/gl.ts`
- Create: `components/gl/flex-field.shaders.ts`
- Create: `components/gl/FlexField.tsx`
- Modify: `app/globals.css` (estilos del campo y fallback)
- Create: `__tests__/lib/gl.test.ts`
- Create: `__tests__/components/FlexField.test.tsx`

**Interfaces:**
- Produces: `lib/gl.ts`: `canUseWebGL(): boolean` (false en SSR o sin contexto), `clampDpr(dpr: number, coarsePointer: boolean): number` (máx 1.5 / 1), `cssVarToRgb(name: string, el?: Element): [number, number, number]` (lee `getComputedStyle`, parsea `#rrggbb`, `rgb(...)`; devuelve 0..1), `prefersReducedMotion(): boolean`.
- Produces: `<FlexField variant: "hero" | "closing"; className? />` client. Renderiza `<div class="flex-field" data-variant data-mode="gl"|"fallback">` con `<canvas>` o `<div class="flex-field__fallback">`.

- [ ] **Step 1: Test de lib/gl que falla**

`__tests__/lib/gl.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clampDpr, cssVarToRgb, canUseWebGL } from "@/lib/gl";

describe("clampDpr", () => {
  it("limita a 1.5 en puntero fino y a 1 en táctil", () => {
    expect(clampDpr(3, false)).toBe(1.5);
    expect(clampDpr(1.25, false)).toBe(1.25);
    expect(clampDpr(3, true)).toBe(1);
  });
});

describe("cssVarToRgb", () => {
  it("parsea hex y rgb() a componentes 0..1", () => {
    document.documentElement.style.setProperty("--test-a", "#7a3bff");
    document.documentElement.style.setProperty("--test-b", "rgb(255, 0, 0)");
    const a = cssVarToRgb("--test-a");
    expect(a.map((v) => Math.round(v * 255))).toEqual([122, 59, 255]);
    expect(cssVarToRgb("--test-b")).toEqual([1, 0, 0]);
  });
  it("devuelve negro si la variable no existe", () => {
    expect(cssVarToRgb("--nope")).toEqual([0, 0, 0]);
  });
});

describe("canUseWebGL", () => {
  it("es false en jsdom (sin contexto)", () => {
    expect(canUseWebGL()).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- gl.test`
Expected: FAIL.

- [ ] **Step 3: Implementar lib/gl.ts**

```ts
export function canUseWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function clampDpr(dpr: number, coarsePointer: boolean): number {
  return Math.min(dpr, coarsePointer ? 1 : 1.5);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function cssVarToRgb(name: string, el: Element = document.documentElement): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return [0, 0, 0];
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = raw.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return [0, 0, 0];
}
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- gl.test`
Expected: PASS.

- [ ] **Step 5: Escribir los shaders**

`components/gl/flex-field.shaders.ts`:

```ts
export const FLEX_FIELD_VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Campo elástico: fbm con domain warping. El puntero "tira" del campo
 * como un dedo sobre una tela: desplaza las coordenadas hacia sí con
 * caída gaussiana. uIntensity calibra oscuro (1.0) vs claro (0.55).
 */
export const FLEX_FIELD_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uPointer;        // 0..1, origen abajo-izquierda
uniform float uPointerForce;  // 0..1, suavizado en JS
uniform vec3 uAccent;
uniform vec3 uBg;
uniform float uIntensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + 10.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);

  // Tirón elástico hacia el puntero.
  vec2 d = p - pointer;
  float dist2 = dot(d, d);
  float pull = exp(-dist2 * 5.0) * uPointerForce;
  p -= d * pull * 0.6;

  // Domain warping lento.
  float t = uTime * 0.04;
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.7));
  float n = fbm(p * 1.8 + q * 1.6 + t * 0.5);

  // Bandas de luz: una zona clara ancha y un borde más fino.
  float band = smoothstep(0.42, 0.78, n);
  float edge = smoothstep(0.55, 0.62, n) * (1.0 - smoothstep(0.62, 0.70, n));
  float light = clamp(band * 0.85 + edge * 0.6 + pull * 0.35, 0.0, 1.0) * uIntensity;

  // Viñeta suave hacia los bordes para que el campo no corte seco.
  vec2 v = vUv * 2.0 - 1.0;
  float vignette = 1.0 - smoothstep(0.55, 1.25, dot(v, v));

  vec3 col = mix(uBg, uAccent, light * vignette);
  gl_FragColor = vec4(col, 1.0);
}
`;
```

- [ ] **Step 6: Test de FlexField que falla**

`__tests__/components/FlexField.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});

import { FlexField } from "@/components/gl/FlexField";

describe("FlexField sin WebGL", () => {
  it("renderiza el fallback estático y no un canvas", async () => {
    render(<FlexField variant="hero" />);
    const root = await screen.findByTestId("flex-field");
    expect(root.getAttribute("data-mode")).toBe("fallback");
    expect(root.getAttribute("data-variant")).toBe("hero");
    expect(root.querySelector("canvas")).toBeNull();
    expect(root.querySelector(".flex-field__fallback")).not.toBeNull();
  });
});
```

- [ ] **Step 7: Correr y verificar que falla**

Run: `npm test -- FlexField`
Expected: FAIL.

- [ ] **Step 8: Implementar FlexField**

`components/gl/FlexField.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { canUseWebGL, clampDpr, cssVarToRgb, isCoarsePointer, prefersReducedMotion } from "@/lib/gl";
import { FLEX_FIELD_FRAGMENT, FLEX_FIELD_VERTEX } from "./flex-field.shaders";

type Mode = "pending" | "gl" | "fallback";
type Props = { variant: "hero" | "closing"; className?: string };

export function FlexField({ variant, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  // 1. Decidir modo tras montar (SSR siempre "pending" → sin canvas en HTML).
  useEffect(() => {
    setMode(!prefersReducedMotion() && canUseWebGL() ? "gl" : "fallback");
  }, []);

  // 2. Inicializar OGL solo cuando el canvas exista y esté en viewport.
  useEffect(() => {
    if (mode !== "gl") return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let disposed = false;
    let raf = 0;
    let visible = false;
    let started = false;
    let cleanupGl: (() => void) | undefined;

    const start = async () => {
      if (started || disposed) return;
      started = true;
      try {
        const { Renderer, Program, Mesh, Triangle } = await import("ogl");
        if (disposed) return;
        const coarse = isCoarsePointer();
        const renderer = new Renderer({ canvas, dpr: clampDpr(window.devicePixelRatio || 1, coarse), alpha: false, antialias: false });
        const gl = renderer.gl;
        const geometry = new Triangle(gl);
        const program = new Program(gl, {
          vertex: FLEX_FIELD_VERTEX,
          fragment: FLEX_FIELD_FRAGMENT,
          uniforms: {
            uTime: { value: 0 },
            uRes: { value: [1, 1] },
            uPointer: { value: [0.5, 0.5] },
            uPointerForce: { value: 0 },
            uAccent: { value: cssVarToRgb("--accent") },
            uBg: { value: cssVarToRgb("--bg") },
            uIntensity: { value: document.documentElement.dataset.theme === "light" ? 0.55 : 1 },
          },
        });
        const mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
          const { width, height } = root.getBoundingClientRect();
          renderer.setSize(Math.max(1, width), Math.max(1, height));
          program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(root);

        // Puntero objetivo y puntero suavizado (spring crítico por exp decay).
        const target = { x: 0.5, y: 0.5, force: 0 };
        const current = { x: 0.5, y: 0.5, force: 0 };
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width;
          target.y = 1 - (e.clientY - r.top) / r.height;
          target.force = 1;
        };
        const onLeave = () => { target.force = 0; };
        if (!coarse) {
          window.addEventListener("pointermove", onMove, { passive: true });
          root.addEventListener("pointerleave", onLeave);
        }

        // Tema: releer colores cuando cambia data-theme.
        const mo = new MutationObserver(() => {
          program.uniforms.uAccent.value = cssVarToRgb("--accent");
          program.uniforms.uBg.value = cssVarToRgb("--bg");
          program.uniforms.uIntensity.value = document.documentElement.dataset.theme === "light" ? 0.55 : 1;
        });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        let last = performance.now();
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible || document.hidden) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const k = 1 - Math.exp(-dt * 6); // ~ SPRING_FOLLOW sin overshoot
          current.x += (target.x - current.x) * k;
          current.y += (target.y - current.y) * k;
          current.force += (target.force - current.force) * k;
          if (coarse) {
            // Sin puntero: deriva lenta autónoma.
            const t = now / 1000;
            current.x = 0.5 + Math.sin(t * 0.21) * 0.25;
            current.y = 0.5 + Math.cos(t * 0.17) * 0.2;
            current.force = 0.6;
          }
          program.uniforms.uTime.value = now / 1000;
          program.uniforms.uPointer.value = [current.x, current.y];
          program.uniforms.uPointerForce.value = current.force;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);

        cleanupGl = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          mo.disconnect();
          window.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (err) {
        console.warn("[FlexField] WebGL falló, usando fallback", err);
        if (!disposed) setMode("fallback");
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) void start();
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(root);

    return () => {
      disposed = true;
      io.disconnect();
      cleanupGl?.();
    };
  }, [mode]);

  return (
    <div
      ref={rootRef}
      className={`flex-field ${className}`.trim()}
      data-testid="flex-field"
      data-variant={variant}
      data-mode={mode}
      aria-hidden="true"
    >
      {mode === "gl" ? <canvas ref={canvasRef} className="flex-field__canvas" /> : <div className="flex-field__fallback" />}
    </div>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- FlexField ---------- */
.flex-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
}
.flex-field__canvas,
.flex-field__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.flex-field__fallback {
  background-color: var(--bg);
  background-image: url("/field-fallback-dark.jpg");
  background-size: cover;
  background-position: center;
}
[data-theme="light"] .flex-field__fallback {
  background-image: url("/field-fallback-light.jpg");
}
```

Nota: los `.jpg` no existen hasta Task 16; mientras tanto el fallback muestra `--bg` (el `url()` roto no rompe nada).

- [ ] **Step 9: Correr tests, lint**

Run: `npm test -- FlexField && npm run lint`
Expected: PASS. Si TypeScript se queja de tipos de `ogl` en `program.uniforms.uRes.value`, tipar `uniforms` como `Record<string, { value: unknown }>` al construir y castear al leer; `ogl` trae `types/index.d.ts`.

- [ ] **Step 10: Verificación visual mínima**

Reemplazar temporalmente el contenido de `app/[lang]/page.tsx` por:

```tsx
import { FlexField } from "@/components/gl/FlexField";
export default function HomePage() {
  return <main id="main" style={{ position: "relative", minHeight: "100dvh" }}><FlexField variant="hero" /></main>;
}
```

Run: `npm run dev`, abrir `http://localhost:3000/es`, mover el mouse: el campo violeta se deforma siguiendo al puntero con inercia; cambiar el tema con el switch: los colores del campo cambian. Revertir `page.tsx` a la versión de Task 6 antes de commitear.

- [ ] **Step 11: Commit**

```bash
git checkout app/\[lang\]/page.tsx
git add lib/gl.ts components/gl app/globals.css __tests__/lib/gl.test.ts __tests__/components/FlexField.test.tsx
git commit -m "feat: campo violeta elástico en WebGL con fallback y pausa fuera de vista

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 10: Hero: FlexWordmark y viaje al header

El wordmark ancho sigue al cursor por spring (Motion) y al scrollear se comprime hasta el logo del header. El progreso vive en una variable CSS `--hero-p` (0→1) sobre `html`: animada por CSS scroll-driven donde existe, y por `useScroll` de Motion como fallback. Una sola fórmula de transform consume la variable en ambos caminos.

**Files:**
- Create: `components/site/FlexWordmark.tsx`
- Create: `components/site/HeroProgress.tsx`
- Create: `components/site/Hero.tsx`
- Modify: `app/globals.css` (hero, keyframes, @property)
- Create: `__tests__/components/FlexWordmark.test.tsx`

**Interfaces:**
- Consumes: `FlexField` (Task 9); `Button` (Task 5); `Dictionary` (Task 3); `SPRING_FOLLOW` (Task 1).
- Produces: `<FlexWordmark text="FLEXORA" />` client, `<h1 class="hero__wordmark display">` con `font-variation-settings` dinámico y `data-wdth` con el valor redondeado. `<HeroProgress />` client sin UI: mide wordmark y `#site-logo` y setea `--wm-scale`, `--wm-x`, `--wm-y` en `html`; si no hay `animation-timeline`, escribe `--hero-p` desde `useScroll`. `<Hero t: Dictionary["hero"]; whatsappHref: string />` server.

- [ ] **Step 1: Test de FlexWordmark que falla**

`__tests__/components/FlexWordmark.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
  // useSpring instantáneo para testear el mapeo sin esperar frames.
  return { ...actual, useSpring: (v: unknown) => v, useReducedMotion: () => false };
});

import { FlexWordmark } from "@/components/site/FlexWordmark";

describe("FlexWordmark", () => {
  it("renderiza el h1 con el texto y anchura inicial 140", () => {
    render(<FlexWordmark text="FLEXORA" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "FLEXORA" });
    expect(h1.getAttribute("data-wdth")).toBe("140");
  });

  it("mapea la posición horizontal del puntero a wdth 110..150", () => {
    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    render(<FlexWordmark text="FLEXORA" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    act(() => { fireEvent.pointerMove(window, { clientX: 0 }); });
    expect(h1.getAttribute("data-wdth")).toBe("110");
    act(() => { fireEvent.pointerMove(window, { clientX: 1000 }); });
    expect(h1.getAttribute("data-wdth")).toBe("150");
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- FlexWordmark`
Expected: FAIL.

- [ ] **Step 3: Implementar FlexWordmark**

`components/site/FlexWordmark.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { SPRING_FOLLOW } from "@/lib/motion";

const WDTH_MIN = 110;
const WDTH_MAX = 150;
const WDTH_REST = 140;

export function FlexWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const raw = useMotionValue(WDTH_REST);
  const wdth = useSpring(raw, SPRING_FOLLOW);
  const [display, setDisplay] = useState(WDTH_REST);

  useEffect(() => {
    if (reduced || window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      raw.set(WDTH_MIN + (WDTH_MAX - WDTH_MIN) * x);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [raw, reduced]);

  useMotionValueEvent(wdth, "change", (v) => {
    const el = ref.current;
    if (!el) return;
    el.style.fontVariationSettings = `"wdth" ${v}`;
    const rounded = Math.round(v);
    if (rounded !== display) setDisplay(rounded);
  });

  return (
    <h1 ref={ref} className="hero__wordmark display" data-wdth={display} style={{ fontVariationSettings: `"wdth" ${WDTH_REST}` }}>
      {text}
    </h1>
  );
}
```

Nota para el test: con `useSpring` mockeado a identidad, `useMotionValueEvent(raw, "change")` dispara síncronamente en `raw.set`, así que `data-wdth` cambia dentro del `act`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- FlexWordmark`
Expected: PASS.

- [ ] **Step 5: Implementar HeroProgress**

`components/site/HeroProgress.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

/**
 * Mide dónde tiene que "aterrizar" el wordmark (el logo del header) y publica
 * --wm-scale/--wm-x/--wm-y en <html>. Si el navegador no soporta scroll-driven
 * animations, publica también --hero-p desde el scroll con Motion.
 */
export function HeroProgress({ heroId = "hero" }: { heroId?: string }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const supportsTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

  useEffect(() => {
    heroRef.current = document.getElementById(heroId);
    const html = document.documentElement;

    const measure = () => {
      const wm = document.querySelector<HTMLElement>(".hero__wordmark");
      const logo = document.getElementById("site-logo");
      if (!wm || !logo) return;
      // Medir el wordmark en reposo: neutralizar el transform actual.
      const prev = wm.style.transform;
      wm.style.transform = "none";
      const a = wm.getBoundingClientRect();
      wm.style.transform = prev;
      const b = logo.getBoundingClientRect();
      const scale = b.width / a.width;
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2 + window.scrollY; // en coordenadas de documento
      const bx = b.left + b.width / 2;
      const by = b.top + b.height / 2; // el header es fixed: coordenadas de viewport
      // El hero es sticky durante el viaje, así que el wordmark está en viewport: usar top del hero (0) como referencia.
      html.style.setProperty("--wm-scale", scale.toFixed(4));
      html.style.setProperty("--wm-x", `${(bx - ax).toFixed(1)}px`);
      html.style.setProperty("--wm-y", `${(by - (ay - window.scrollY)).toFixed(1)}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [heroId]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!supportsTimeline) document.documentElement.style.setProperty("--hero-p", p.toFixed(4));
  });

  return null;
}
```

- [ ] **Step 6: Implementar Hero**

`components/site/Hero.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { FlexField } from "@/components/gl/FlexField";
import { FlexWordmark } from "./FlexWordmark";
import { HeroProgress } from "./HeroProgress";

export function Hero({ t, whatsappHref }: { t: Dictionary["hero"]; whatsappHref: string }) {
  return (
    <section id="hero" className="hero" aria-label="Flexora">
      <div className="hero__sticky">
        <FlexField variant="hero" />
        <div className="hero__content container-site">
          <FlexWordmark text="FLEXORA" />
          <div className="hero__copy">
            <p className="hero__tagline measure">{t.tagline}</p>
            <div className="hero__actions">
              <Button href={whatsappHref} external>{t.primary}</Button>
              <Button href="#work" variant="secondary">{t.secondary}</Button>
            </div>
          </div>
        </div>
      </div>
      <HeroProgress />
    </section>
  );
}
```

- [ ] **Step 7: CSS del hero**

Agregar a `app/globals.css`:

```css
/* ---------- Hero ---------- */
@property --hero-p {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

:root {
  --hero-p: 0;
  --wm-scale: 0.2;
  --wm-x: 0px;
  --wm-y: 0px;
  /* El logo del header aparece en el último 15% del viaje. */
  --logo-opacity: clamp(0, (var(--hero-p) - 0.85) * 6.67, 1);
}

/* Camino CSS: la variable la anima el scroll del documento en los primeros 100vh. */
@supports (animation-timeline: scroll()) {
  html {
    animation: hero-progress linear both;
    animation-timeline: scroll(root);
    animation-range: 0 100vh;
  }
  @keyframes hero-progress {
    from { --hero-p: 0; }
    to { --hero-p: 1; }
  }
}

.hero {
  position: relative;
  height: 200vh; /* 100vh de viaje + 100vh de escena sticky */
}
.hero__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
.hero__content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  padding-top: var(--header-h);
  padding-bottom: clamp(2rem, 6vh, 5rem);
}
.hero__wordmark {
  align-self: center;
  width: 100%;
  text-align: center;
  font-size: clamp(3rem, 15.5vw, 15rem);
  color: var(--fg);
  transform-origin: center;
  transform:
    translate(calc(var(--wm-x) * var(--hero-p)), calc(var(--wm-y) * var(--hero-p)))
    scale(calc(1 + (var(--wm-scale) - 1) * var(--hero-p)));
  opacity: clamp(0, 1 - (var(--hero-p) - 0.85) * 6.67, 1);
  will-change: transform, opacity;
}
.hero__copy {
  display: grid;
  gap: 1.5rem;
  opacity: clamp(0, 1 - var(--hero-p) * 2.5, 1);
  transform: translateY(calc(var(--hero-p) * 40px));
}
.hero__tagline {
  font-size: clamp(1.125rem, 1.6vw, 1.5rem);
  line-height: 1.4;
  color: var(--fg);
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Sin puntero: el wordmark respira solo entre 125 y 150. */
@media (hover: none) {
  .hero__wordmark {
    animation: breathe 6s var(--ease-in-out) infinite alternate;
  }
  @keyframes breathe {
    from { font-variation-settings: "wdth" 125; }
    to { font-variation-settings: "wdth" 150; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero { height: 100vh; height: 100dvh; }
  .hero__wordmark {
    animation: none;
    transform: none;
    opacity: 1;
    font-variation-settings: "wdth" 140 !important;
  }
  .hero__copy { opacity: 1; transform: none; }
  html { animation: none; }
  :root { --logo-opacity: 1; }
}
```

- [ ] **Step 8: Montar el hero y verificar a mano**

Editar `app/[lang]/page.tsx`:

```tsx
import { getDictionary } from "./dictionaries";
import { Hero } from "@/components/site/Hero";
import { whatsappHref } from "@/lib/whatsapp";

export default async function HomePage() {
  const dict = await getDictionary();
  const wa = whatsappHref(dict.hero.whatsappMessage);
  return (
    <main id="main">
      <Hero t={dict.hero} whatsappHref={wa} />
      <div style={{ height: "150vh" }} />
    </main>
  );
}
```

Run: `npm run dev`. Verificar en Chrome:
1. Mover el mouse a izquierda/derecha: el wordmark se angosta/ensancha con inercia.
2. Scrollear: el wordmark se achica y se desplaza hasta el logo del header; el logo del header aparece cuando el wordmark llega; el copy se desvanece antes.
3. En Firefox (sin `animation-timeline`), el mismo viaje ocurre vía Motion.
4. Con "Emulate CSS prefers-reduced-motion" en DevTools: sin viaje, sin respiración, wordmark fijo.
5. En modo responsive táctil (hover: none): el wordmark respira solo.

Ajustar `--wm-y` si el aterrizaje queda desalineado más de 2px: la medición usa el centro del logo en viewport y el centro del wordmark con el hero en `top: 0`.

- [ ] **Step 9: Lint, tests y commit**

Run: `npm run lint && npm test`

```bash
git add components/site/FlexWordmark.tsx components/site/HeroProgress.tsx components/site/Hero.tsx app/\[lang\]/page.tsx app/globals.css __tests__/components/FlexWordmark.test.tsx
git commit -m "feat: hero con wordmark elástico que viaja al header al scrollear

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 11: Marquee arrastrable

**Files:**
- Create: `components/site/Marquee.tsx`
- Modify: `app/globals.css`
- Create: `__tests__/components/Marquee.test.tsx`

**Interfaces:**
- Consumes: `SPRING_BASE` (Task 1).
- Produces: `<Marquee items: string[]; label: string />` client (`label` es el `aria-label` de la sección, viene de `nav.services`). Duplica los items (la copia con `aria-hidden`), corre linealmente, al arrastrar horizontalmente el track se estira (`scaleX` hasta ±15%) y al soltar vuelve con `SPRING_BASE`.

- [ ] **Step 1: Test que falla**

`__tests__/components/Marquee.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "@/components/site/Marquee";

describe("Marquee", () => {
  it("duplica los items y oculta la copia a lectores de pantalla", () => {
    render(<Marquee items={["Uno", "Dos"]} label="Servicios" />);
    const all = screen.getAllByText(/Uno|Dos/);
    expect(all).toHaveLength(4);
    const hidden = all.filter((el) => el.closest("[aria-hidden='true']"));
    expect(hidden).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- Marquee`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`components/site/Marquee.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { animate } from "motion/react";
import { SPRING_BASE } from "@/lib/motion";

const MAX_STRETCH = 0.15;

export function Marquee({ items, label }: { items: string[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; width: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, width: el.getBoundingClientRect().width };
    el.style.transformOrigin = e.clientX < window.innerWidth / 2 ? "right center" : "left center";
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || !drag.current) return;
    const dx = (e.clientX - drag.current.startX) / drag.current.width;
    const s = 1 + Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, dx));
    el.style.transform = `scaleX(${s})`;
  };
  const onUp = () => {
    const el = trackRef.current;
    if (!el || !drag.current) return;
    drag.current = null;
    animate(el, { scaleX: 1 }, SPRING_BASE);
  };

  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="marquee__item display">
          {item}
          <span className="marquee__dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="marquee hairline" aria-label={label}>
      <div
        ref={trackRef}
        className="marquee__track"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="marquee__scroller">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Marquee ---------- */
.marquee {
  position: relative;
  z-index: 1;
  background: var(--bg);
  padding-block: clamp(1.25rem, 3vw, 2.5rem);
  overflow: hidden;
  border-bottom: 1px solid var(--border);
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
}
.marquee:active { cursor: grabbing; }
.marquee__track { will-change: transform; }
.marquee__scroller {
  display: flex;
  width: max-content;
  animation: marquee 28s linear infinite;
}
.marquee__row {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}
.marquee__item {
  display: inline-flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2.5rem);
  padding-inline-end: clamp(1rem, 3vw, 2.5rem);
  font-size: clamp(2rem, 6vw, 5.5rem);
  font-variation-settings: "wdth" 130;
  color: var(--fg-muted);
  white-space: nowrap;
}
.marquee__dot {
  width: 0.35em;
  height: 0.35em;
  border-radius: 999px; /* único círculo permitido: es un punto, no un botón */
  background: var(--accent);
}
@keyframes marquee {
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .marquee__scroller { animation: none; }
}
```

- [ ] **Step 4: Correr y verificar que pasa, montar y probar**

Run: `npm test -- Marquee`. En `app/[lang]/page.tsx` agregar `<Marquee items={dict.marquee.items} label={dict.nav.services} />` debajo del `<Hero>` (import desde `@/components/site/Marquee`). `npm run dev`: la banda corre continua; al arrastrar se estira y al soltar vuelve con un rebote leve.

- [ ] **Step 5: Commit**

```bash
git add components/site/Marquee.tsx app/\[lang\]/page.tsx app/globals.css __tests__/components/Marquee.test.tsx
git commit -m "feat: marquee de servicios que se estira al arrastrar

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 12: Servicios con visuales autorados

Tres bloques a ancho completo. Cada uno tiene un visual propio en SVG/CSS que demuestra la disciplina en vez de ilustrarla con un ícono.

**Files:**
- Create: `components/site/ServiceVisuals.tsx`
- Create: `components/site/Services.tsx`
- Modify: `app/globals.css`
- Create: `__tests__/components/Services.test.tsx`

**Interfaces:**
- Consumes: `Dictionary` (Task 3); `Label` (Task 5); `Reveal` (Task 8).
- Produces: `<Services t: Dictionary["services"] />` server. `ServiceVisuals.tsx` exporta `DevVisual`, `AdsVisual`, `BrandVisual` (SVG puros, `aria-hidden`).

- [ ] **Step 1: Test que falla**

`__tests__/components/Services.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Services } from "@/components/site/Services";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Services", () => {
  it("renderiza tres bloques con rótulo, título y entregables", () => {
    render(<Services t={es.services} />);
    expect(screen.getByRole("region", { name: es.services.title })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByText("01 / Desarrollo")).toBeTruthy();
    expect(screen.getByText("E-commerce")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- Services`
Expected: FAIL.

- [ ] **Step 3: Implementar visuales**

`components/site/ServiceVisuals.tsx`:

```tsx
/** Un fragmento de interfaz: barra, bloques de layout y un cursor. */
export function DevVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <rect x="0.5" y="0.5" width="319" height="28" rx="8" fill="none" stroke="var(--border)" />
      <circle cx="16" cy="14" r="3" fill="var(--fg-muted)" />
      <circle cx="28" cy="14" r="3" fill="var(--fg-muted)" />
      <rect x="20" y="48" width="130" height="14" rx="2" fill="var(--fg)" />
      <rect x="20" y="70" width="180" height="8" rx="2" fill="var(--fg-muted)" opacity="0.6" />
      <rect x="20" y="84" width="150" height="8" rx="2" fill="var(--fg-muted)" opacity="0.6" />
      <rect x="20" y="108" width="96" height="30" rx="6" fill="var(--accent)" />
      <rect x="220" y="48" width="80" height="120" rx="6" fill="none" stroke="var(--accent)" strokeDasharray="4 4" />
      <path d="M236 128 l10 26 4-10 10-4z" fill="var(--fg)" />
    </svg>
  );
}

/** Una curva de resultados sobre grilla, con el punto final resaltado. */
export function AdsVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="20" x2="300" y1={y} y2={y} stroke="var(--border)" />
      ))}
      <path d="M20 160 C 70 150, 100 140, 130 120 S 200 70, 240 60 S 280 40, 300 30" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 160 C 70 150, 100 140, 130 120 S 200 70, 240 60 S 280 40, 300 30 V 180 H 20 Z" fill="var(--accent)" opacity="0.12" />
      <circle cx="300" cy="30" r="5" fill="var(--accent)" />
      <text x="20" y="188" fontFamily="var(--font-geist-mono)" fontSize="9" fill="var(--fg-muted)" letterSpacing="1">ROAS</text>
      <text x="300" y="20" textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="11" fill="var(--fg)" fontWeight="600">+3.4x</text>
    </svg>
  );
}

/** La X de Flexora construyéndose: dos chevrones en blanco y violeta. */
export function BrandVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <g transform="translate(160 100)">
        <path className="svis__chev svis__chev--a" d="M-56 -50 h30 l30 50 -30 50 h-30 l30 -50z" fill="var(--fg)" />
        <path className="svis__chev svis__chev--b" d="M56 -50 h-30 l-30 50 30 50 h30 l-30 -50z" fill="var(--accent)" />
      </g>
      <line x1="20" x2="300" y1="176" y2="176" stroke="var(--border)" />
      <text x="20" y="190" fontFamily="var(--font-geist-mono)" fontSize="9" fill="var(--fg-muted)" letterSpacing="1">X · 01</text>
    </svg>
  );
}
```

- [ ] **Step 4: Implementar Services**

`components/site/Services.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";
import { AdsVisual, BrandVisual, DevVisual } from "./ServiceVisuals";

const VISUALS = [DevVisual, AdsVisual, BrandVisual];

export function Services({ t }: { t: Dictionary["services"] }) {
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <Reveal className="container-site">
        <Label as="p">{t.label}</Label>
        <h2 id="services-title" className="h2 services__title">{t.title}</h2>
      </Reveal>
      <div className="services__list">
        {t.items.map((item, i) => {
          const Visual = VISUALS[i] ?? DevVisual;
          return (
            <Reveal as="article" key={item.index} className="service hairline">
              <div className="container-site service__grid">
                <Label as="p">{item.index} / {item.label}</Label>
                <div className="service__body">
                  <h3 className="h3">{item.title}</h3>
                  <p className="service__desc">{item.description}</p>
                  <ul className="service__deliverables">
                    {item.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="service__visual">
                  <Visual />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Services ---------- */
.services__title {
  margin-top: 0.75rem;
  max-width: 16ch;
}
.services__list {
  margin-top: clamp(2.5rem, 5vw, 4rem);
}
.service {
  padding-block: clamp(2rem, 4vw, 3.5rem);
}
.service__grid {
  display: grid;
  gap: 1.5rem;
}
.service__desc {
  color: var(--fg-muted);
  margin-top: 0.75rem;
  max-width: 44ch;
}
.service__deliverables {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  font-size: 0.9375rem;
}
.service__deliverables li::before {
  content: "—";
  color: var(--accent);
  margin-right: 0.5rem;
}
.svis {
  width: 100%;
  height: auto;
  display: block;
}
.svis__chev {
  transition: transform var(--dur-slow) var(--ease-out);
}
[data-reveal] .svis__chev--a { transform: translateX(-24px); }
[data-reveal] .svis__chev--b { transform: translateX(24px); }
[data-reveal][data-visible] .svis__chev--a,
[data-reveal][data-visible] .svis__chev--b { transform: none; }
@media (min-width: 900px) {
  .service__grid {
    grid-template-columns: 160px 1fr minmax(280px, 420px);
    align-items: start;
    gap: 3rem;
  }
}
```

- [ ] **Step 5: Correr test, montar y commitear**

Run: `npm test -- Services`. Agregar `<Services t={dict.services} />` en `page.tsx` debajo del `<Marquee>`.

```bash
git add components/site/ServiceVisuals.tsx components/site/Services.tsx app/\[lang\]/page.tsx app/globals.css __tests__/components/Services.test.tsx
git commit -m "feat: sección de servicios con visuales autorados

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 13: Trabajos con covers y distorsión al hover

**Files:**
- Create: `content/work.ts`
- Create: `public/covers/01.svg`, `02.svg`, `03.svg`, `04.svg`
- Create: `components/gl/distort-image.shaders.ts`
- Create: `components/gl/DistortImage.tsx`
- Create: `components/site/WorkCard.tsx`
- Create: `components/site/Work.tsx`
- Modify: `app/globals.css`
- Create: `__tests__/content/work.test.ts`
- Create: `__tests__/components/DistortImage.test.tsx`

**Interfaces:**
- Consumes: `Locale` (Task 3); `canUseWebGL`, `clampDpr`, `prefersReducedMotion`, `isCoarsePointer` (Task 9); `Reveal`, `Label`, `TextLink`.
- Produces: `content/work.ts`: `type WorkItem = { slug: string; client: string; cover: string; coverAlt: Record<Locale,string>; services: Record<Locale,string>; result: Record<Locale,string> }`, `work: WorkItem[]`.
- Produces: `<DistortImage src alt className? />` client: `<img>` siempre en el HTML (accesible, LCP); si hay hover fino + WebGL + sin reduced-motion, monta un canvas encima que distorsiona la textura con intensidad suavizada. `<Work t: Dictionary["work"]; locale: Locale />`.

- [ ] **Step 1: Test de contenido que falla**

`__tests__/content/work.test.ts`:

```ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { work } from "@/content/work";

describe("content/work", () => {
  it("tiene entre 3 y 4 proyectos con slug único y cover existente", () => {
    expect(work.length).toBeGreaterThanOrEqual(3);
    expect(work.length).toBeLessThanOrEqual(4);
    expect(new Set(work.map((w) => w.slug)).size).toBe(work.length);
    for (const w of work) {
      expect(existsSync(`public${w.cover}`), w.cover).toBe(true);
      expect(w.result.es).not.toBe("");
      expect(w.result.en).not.toBe("");
    }
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- content/work`

- [ ] **Step 3: Crear contenido y covers placeholder**

`content/work.ts` (placeholder: el cliente reemplaza con proyectos reales):

```ts
import type { Locale } from "@/lib/i18n";

export type WorkItem = {
  slug: string;
  client: string;
  cover: string;
  coverAlt: Record<Locale, string>;
  services: Record<Locale, string>;
  result: Record<Locale, string>;
};

export const work: WorkItem[] = [
  {
    slug: "norte-cafe",
    client: "Norte Café",
    cover: "/covers/01.svg",
    coverAlt: { es: "Home del e-commerce de Norte Café", en: "Norte Café e-commerce home" },
    services: { es: "E-commerce + campañas", en: "E-commerce + campaigns" },
    result: { es: "+140% ventas online en 3 meses", en: "+140% online sales in 3 months" },
  },
  {
    slug: "clinica-vera",
    client: "Clínica Vera",
    cover: "/covers/02.svg",
    coverAlt: { es: "Sitio institucional de Clínica Vera", en: "Clínica Vera corporate site" },
    services: { es: "Sitio + identidad", en: "Site + identity" },
    result: { es: "3x turnos reservados online", en: "3x appointments booked online" },
  },
  {
    slug: "andar-outdoor",
    client: "Andar Outdoor",
    cover: "/covers/03.svg",
    coverAlt: { es: "Landing de lanzamiento de Andar Outdoor", en: "Andar Outdoor launch landing" },
    services: { es: "Landing + ads", en: "Landing + ads" },
    result: { es: "ROAS 4.2 en el lanzamiento", en: "4.2 ROAS at launch" },
  },
  {
    slug: "studio-lumen",
    client: "Studio Lumen",
    cover: "/covers/04.svg",
    coverAlt: { es: "Sistema de marca de Studio Lumen", en: "Studio Lumen brand system" },
    services: { es: "Branding completo", en: "Full branding" },
    result: { es: "Marca lista en 5 semanas", en: "Brand shipped in 5 weeks" },
  },
];
```

Covers placeholder (1600×1000, composiciones geométricas en tinta y violeta; son placeholders autorados, no fotos). `public/covers/01.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="#111114"/>
  <rect x="120" y="120" width="1360" height="760" rx="16" fill="#09090b" stroke="#2a2a30"/>
  <rect x="180" y="200" width="520" height="56" rx="6" fill="#f4f3f8"/>
  <rect x="180" y="290" width="720" height="18" rx="4" fill="#5d5c6a"/>
  <rect x="180" y="330" width="640" height="18" rx="4" fill="#5d5c6a"/>
  <rect x="180" y="400" width="240" height="72" rx="10" fill="#7a3bff"/>
  <rect x="900" y="200" width="520" height="560" rx="12" fill="#7a3bff" opacity="0.18"/>
  <circle cx="1160" cy="480" r="160" fill="#7a3bff"/>
</svg>
```

`02.svg`: mismo fondo, rectángulo blanco grande a la izquierda (`x=180 y=200 w=600 h=560 rx=12 fill=#f4f3f8`) y tres barras violetas a la derecha (`x=900`, `y=200/420/640`, `w=520 h=140 rx=10`).
`03.svg`: mismo fondo, un círculo violeta gigante descentrado (`cx=1200 cy=500 r=420`) y una línea de texto simulada blanca (`x=180 y=760 w=800 h=48`).
`04.svg`: mismo fondo, la X: `<path d="M500 250 h180 l120 250 -120 250 h-180 l120 -250z" fill="#f4f3f8"/>` y `<path d="M1100 250 h-180 l-120 250 120 250 h180 l-120 -250z" fill="#7a3bff"/>`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test -- content/work`
Expected: PASS.

- [ ] **Step 5: Test de DistortImage que falla**

`__tests__/components/DistortImage.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});

import { DistortImage } from "@/components/gl/DistortImage";

describe("DistortImage sin WebGL", () => {
  it("siempre entrega la imagen accesible y no monta canvas", () => {
    render(<DistortImage src="/covers/01.svg" alt="Norte Café" />);
    const img = screen.getByRole("img", { name: "Norte Café" });
    expect(img.getAttribute("src")).toBe("/covers/01.svg");
    expect(document.querySelector("canvas")).toBeNull();
  });
});
```

- [ ] **Step 6: Shaders y componente**

`components/gl/distort-image.shaders.ts`:

```ts
export const DISTORT_VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/** Ondulación elástica + leve separación RGB, proporcional a uHover (0..1). */
export const DISTORT_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uHover;
uniform vec2 uPointer;
uniform vec2 uScale; // cover-fit: escala uv para no deformar la imagen

void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5;
  vec2 d = uv - uPointer;
  float dist = length(d);
  float ripple = sin(dist * 18.0 - uTime * 3.0) * 0.012 * uHover * exp(-dist * 2.5);
  vec2 off = normalize(d + 1e-4) * ripple;
  float shift = 0.004 * uHover;
  float r = texture2D(uTexture, uv + off + vec2(shift, 0.0)).r;
  float g = texture2D(uTexture, uv + off).g;
  float b = texture2D(uTexture, uv + off - vec2(shift, 0.0)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;
```

`components/gl/DistortImage.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { canUseWebGL, clampDpr, isCoarsePointer, prefersReducedMotion } from "@/lib/gl";
import { DISTORT_FRAGMENT, DISTORT_VERTEX } from "./distort-image.shaders";

type Props = { src: string; alt: string; className?: string };

export function DistortImage({ src, alt, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setEnhanced(fine && !isCoarsePointer() && !prefersReducedMotion() && canUseWebGL());
  }, []);

  useEffect(() => {
    if (!enhanced) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!root || !canvas || !img) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        const { Renderer, Program, Mesh, Triangle, Texture } = await import("ogl");
        if (disposed) return;
        const renderer = new Renderer({ canvas, dpr: clampDpr(window.devicePixelRatio || 1, false), alpha: true });
        const gl = renderer.gl;
        const texture = new Texture(gl, {
          image: img,
          generateMipmaps: false,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          flipY: true,
        });
        const program = new Program(gl, {
          vertex: DISTORT_VERTEX,
          fragment: DISTORT_FRAGMENT,
          uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uHover: { value: 0 },
            uPointer: { value: [0.5, 0.5] },
            uScale: { value: [1, 1] },
          },
        });
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

        const resize = () => {
          const r = root.getBoundingClientRect();
          renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
          const imgAspect = img.naturalWidth / img.naturalHeight || 1.6;
          const boxAspect = r.width / r.height;
          // cover-fit: recortar el eje sobrante
          program.uniforms.uScale.value = boxAspect > imgAspect ? [1, imgAspect / boxAspect] : [boxAspect / imgAspect, 1];
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(root);

        const target = { hover: 0, x: 0.5, y: 0.5 };
        const cur = { hover: 0, x: 0.5, y: 0.5 };
        const onEnter = () => { target.hover = 1; };
        const onLeave = () => { target.hover = 0; };
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width;
          target.y = 1 - (e.clientY - r.top) / r.height;
        };
        root.addEventListener("pointerenter", onEnter);
        root.addEventListener("pointerleave", onLeave);
        root.addEventListener("pointermove", onMove, { passive: true });

        let last = performance.now();
        let idleFrames = 0;
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const k = 1 - Math.exp(-dt * 8);
          cur.hover += (target.hover - cur.hover) * k;
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          // Dormir cuando no hay hover ni movimiento residual.
          if (cur.hover < 0.002 && target.hover === 0) {
            idleFrames++;
            if (idleFrames > 10) { canvas.style.opacity = "0"; return; }
          } else {
            idleFrames = 0;
            canvas.style.opacity = "1";
          }
          program.uniforms.uTime.value = now / 1000;
          program.uniforms.uHover.value = cur.hover;
          program.uniforms.uPointer.value = [cur.x, cur.y];
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          root.removeEventListener("pointerenter", onEnter);
          root.removeEventListener("pointerleave", onLeave);
          root.removeEventListener("pointermove", onMove);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (err) {
        console.warn("[DistortImage] WebGL falló, se mantiene la imagen", err);
        if (!disposed) setEnhanced(false);
      }
    };

    if (img.complete && img.naturalWidth > 0) void init();
    else img.addEventListener("load", () => void init(), { once: true });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [enhanced]);

  return (
    <div ref={rootRef} className={`distort ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- textura WebGL: necesitamos el <img> real */}
      <img ref={imgRef} src={src} alt={alt} className="distort__img" loading="lazy" decoding="async" />
      {enhanced ? <canvas ref={canvasRef} className="distort__canvas" aria-hidden="true" /> : null}
    </div>
  );
}
```

- [ ] **Step 7: Correr test de DistortImage**

Run: `npm test -- DistortImage`
Expected: PASS.

- [ ] **Step 8: WorkCard y Work**

`components/site/WorkCard.tsx`:

```tsx
import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { DistortImage } from "@/components/gl/DistortImage";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  return (
    <article className="work-card">
      <a href={`/${locale}/trabajos/${item.slug}`} className="work-card__cover" aria-label={`${viewCase}: ${item.client}`}>
        <DistortImage src={item.cover} alt={item.coverAlt[locale]} />
      </a>
      <div className="work-card__meta">
        <h3 className="h3">{item.client}</h3>
        <p className="label">{item.services[locale]}</p>
        <p className="work-card__result">{item.result[locale]}</p>
        <TextLink href={`/${locale}/trabajos/${item.slug}`}>{viewCase}</TextLink>
      </div>
    </article>
  );
}
```

Los links a `/trabajos/[slug]` son rutas futuras: por ahora devuelven 404 y se documenta en "Fuera de alcance" del spec.

`components/site/Work.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";
import { WorkCard } from "./WorkCard";

export function Work({ t, locale }: { t: Dictionary["work"]; locale: Locale }) {
  return (
    <section id="work" className="section hairline" aria-labelledby="work-title">
      <Reveal className="container-site">
        <Label as="p">{t.label}</Label>
        <h2 id="work-title" className="h2 work__title">{t.title}</h2>
      </Reveal>
      <Reveal className="container-site work__grid">
        {work.map((item) => (
          <WorkCard key={item.slug} item={item} locale={locale} viewCase={t.viewCase} />
        ))}
      </Reveal>
    </section>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Work ---------- */
.work__title {
  margin-top: 0.75rem;
  max-width: 16ch;
}
.work__grid {
  margin-top: clamp(2.5rem, 5vw, 4rem);
  display: grid;
  gap: clamp(2rem, 4vw, 3.5rem);
}
.work-card {
  display: grid;
  gap: 1.25rem;
}
.work-card__cover {
  display: block;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
}
.distort {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--surface);
}
.distort__img,
.distort__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.distort__img { object-fit: cover; }
.distort__canvas {
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
}
.work-card__meta {
  display: grid;
  gap: 0.375rem;
}
.work-card__result {
  color: var(--accent);
  font-weight: 500;
}
@media (min-width: 900px) {
  .work__grid { grid-template-columns: 1fr 1fr; }
  .work-card:nth-child(even) { transform: translateY(clamp(2rem, 6vw, 5rem)); }
}
```

- [ ] **Step 9: Montar, lint, build y commit**

Agregar `<Work t={dict.work} locale={locale} />` a `page.tsx` debajo de `<Services>`; obtener `const locale = await getLocale();` (import desde `./dictionaries`). Correr `npm run dev`: al pasar el mouse sobre un cover, ondula suavemente y vuelve al salir; en táctil no hay canvas.

Run: `npm run lint && npm test && npm run build`

```bash
git add content/work.ts public/covers components/gl/distort-image.shaders.ts components/gl/DistortImage.tsx components/site/WorkCard.tsx components/site/Work.tsx app/\[lang\]/page.tsx app/globals.css __tests__/content __tests__/components/DistortImage.test.tsx
git commit -m "feat: sección de trabajos con covers y distorsión WebGL al hover

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 14: Cierre

**Files:**
- Create: `components/site/Closing.tsx`
- Modify: `app/globals.css`
- Create: `__tests__/components/Closing.test.tsx`

**Interfaces:**
- Consumes: `FlexField` (Task 9), `Button`, `TextLink`, `Dictionary`.
- Produces: `<Closing t: Dictionary["closing"]; whatsappHref: string />` con `id="contact"`.

- [ ] **Step 1: Test que falla**

`__tests__/components/Closing.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});

import { Closing } from "@/components/site/Closing";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Closing", () => {
  it("tiene id contact, CTA a WhatsApp y mail alternativo", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" />);
    expect(document.getElementById("contact")).not.toBeNull();
    expect(screen.getByRole("link", { name: es.closing.primary }).getAttribute("href")).toBe("https://wa.me/1?text=x");
    expect(screen.getByRole("link", { name: es.closing.email }).getAttribute("href")).toBe(`mailto:${es.closing.email}`);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test -- Closing`

- [ ] **Step 3: Implementar**

`components/site/Closing.tsx`:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { FlexField } from "@/components/gl/FlexField";
import { Reveal } from "./Reveal";

export function Closing({ t, whatsappHref }: { t: Dictionary["closing"]; whatsappHref: string }) {
  return (
    <section id="contact" className="closing" aria-labelledby="closing-title">
      <FlexField variant="closing" />
      <Reveal className="container-site closing__content">
        <h2 id="closing-title" className="display closing__title">{t.title}</h2>
        <p className="closing__desc measure">{t.description}</p>
        <div className="closing__actions">
          <Button href={whatsappHref} external>{t.primary}</Button>
          <p className="closing__email">
            {t.emailLabel} <TextLink href={`mailto:${t.email}`}>{t.email}</TextLink>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
```

Agregar a `app/globals.css`:

```css
/* ---------- Closing ---------- */
.closing {
  position: relative;
  overflow: hidden;
  min-height: 80vh;
  display: grid;
  align-items: end;
  border-top: 1px solid var(--border);
}
.closing__content {
  position: relative;
  z-index: 1;
  padding-block: clamp(4rem, 10vw, 8rem);
  display: grid;
  gap: 1.5rem;
}
.closing__title {
  font-size: clamp(3.5rem, 14vw, 13rem);
}
.closing__desc {
  font-size: clamp(1.125rem, 1.6vw, 1.5rem);
}
.closing__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}
.closing__email {
  color: var(--fg-muted);
}
```

- [ ] **Step 4: Correr test, montar y commit**

Run: `npm test -- Closing`. Agregar `<Process t={dict.process} />` y `<Closing t={dict.closing} whatsappHref={wa} />` a `page.tsx` después de `<Work>`.

```bash
git add components/site/Closing.tsx app/\[lang\]/page.tsx app/globals.css __tests__/components/Closing.test.tsx
git commit -m "feat: sección de cierre con campo violeta y CTA

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 15: Composición final de la home y OG

**Files:**
- Modify: `app/[lang]/page.tsx` (versión final)
- Create: `public/og-es.png`, `public/og-en.png` (generados en Step 3)
- Create: `scripts/capture-og.mjs`

**Interfaces:**
- Consumes: todas las secciones.

- [ ] **Step 1: page.tsx final**

```tsx
import { getDictionary, getLocale } from "./dictionaries";
import { whatsappHref } from "@/lib/whatsapp";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Services } from "@/components/site/Services";
import { Work } from "@/components/site/Work";
import { Process } from "@/components/site/Process";
import { Closing } from "@/components/site/Closing";

export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const wa = whatsappHref(dict.hero.whatsappMessage);
  return (
    <main id="main">
      <Hero t={dict.hero} whatsappHref={wa} />
      <Marquee items={dict.marquee.items} label={dict.nav.services} />
      <Services t={dict.services} />
      <Work t={dict.work} locale={locale} />
      <Process t={dict.process} />
      <Closing t={dict.closing} whatsappHref={wa} />
    </main>
  );
}
```

- [ ] **Step 2: Ritmo del scroll**

Revisar en `npm run dev` que el orden de densidades se siente: hero (motion) → marquee (denso) → servicios (estructurado) → trabajos (imagen) → proceso (silencio) → cierre (motion). Si el marquee queda pegado al hero sticky, sumar `position: relative; z-index: 1; background: var(--bg)` a `.marquee` (ya está) y a `#services` para que tapen el hero al salir.

- [ ] **Step 3: Script de captura OG**

`scripts/capture-og.mjs`:

```js
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
for (const lang of ["es", "en"]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/${lang}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `public/og-${lang}.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
}
await browser.close();
console.log("OG images written");
```

Run: `npm run build && (npm run start & sleep 3; node scripts/capture-og.mjs; kill %1)`
Expected: `public/og-es.png` y `public/og-en.png` existen y muestran el hero.

- [ ] **Step 4: Lint, tests, build y commit**

Run: `npm run lint && npm test && npm run build`

```bash
git add app/\[lang\]/page.tsx scripts/capture-og.mjs public/og-es.png public/og-en.png
git commit -m "feat: home completa compuesta e imágenes Open Graph

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 16: Fallbacks del campo y suite end-to-end

**Files:**
- Create: `scripts/capture-field.mjs`
- Create: `public/field-fallback-dark.jpg`, `public/field-fallback-light.jpg` (generados)
- Create: `playwright.config.ts`
- Create: `e2e/home.spec.ts`
- Create: `e2e/theme.spec.ts`
- Create: `e2e/degradation.spec.ts`
- Create: `e2e/a11y.spec.ts`

- [ ] **Step 1: Capturar los fallbacks del campo**

`scripts/capture-field.mjs`:

```js
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const theme of ["dark", "light"]) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript((t) => localStorage.setItem("flexora-theme", t), theme);
  await page.goto(`${base}/es`, { waitUntil: "networkidle" });
  await page.mouse.move(1000, 380);
  await page.waitForTimeout(1500);
  const canvas = page.locator('[data-variant="hero"] canvas');
  await canvas.screenshot({ path: `public/field-fallback-${theme}.jpg`, type: "jpeg", quality: 82 });
  await page.close();
}
await browser.close();
console.log("field fallbacks written");
```

Run: `npm run build && (npm run start & sleep 3; node scripts/capture-field.mjs; kill %1)`
Expected: dos JPG de ~1600×900 con el campo violeta. Abrirlos y confirmar que no están negros.

- [ ] **Step 2: Config de Playwright**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000/es",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

- [ ] **Step 3: Tests e2e**

`e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

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

test("el CTA del header lleva a WhatsApp", async ({ page }) => {
  await page.goto("/es");
  const cta = page.getByRole("banner").getByRole("link", { name: "Hablemos" });
  await expect(cta).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
});
```

`e2e/theme.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("el switch cambia el tema y persiste tras recargar", async ({ page }) => {
  await page.goto("/es");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.locator("[data-theme-switch]").click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("sin elección guardada respeta el sistema", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("/es");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await ctx.close();
});

test("el cambio de idioma conserva la ruta", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
```

`e2e/degradation.spec.ts`:

```ts
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
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
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
```

`e2e/a11y.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const lang of ["es", "en"] as const) {
  test(`axe sin violaciones en /${lang}`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("el teclado llega al CTA de WhatsApp del header", async ({ page }) => {
  await page.goto("/es");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const href = await page.evaluate(() => (document.activeElement as HTMLAnchorElement | null)?.href ?? "");
    if (href.startsWith("https://wa.me/")) return;
  }
  throw new Error("El CTA de WhatsApp no recibió foco en 12 tabs");
});
```

- [ ] **Step 4: Correr e2e**

Run: `npm run e2e`
Expected: todo verde en `desktop` y `mobile`. Fallas esperables y su arreglo:
- Axe "color-contrast" en `.label` (`--fg-muted` sobre `--bg`): subir `--fg-muted` oscuro a `#a9a8b4` y claro a `#55546a`, y actualizar el test de tokens si hace falta.
- "region" de axe por el `<h1>` dentro de `section aria-label`: el hero ya es `section` con `aria-label`; si persiste, envolver en `role="region"`.
- Scroll horizontal en mobile por el marquee: verificar `overflow: hidden` en `.marquee` y `overflow-x: clip` en `body`.

- [ ] **Step 5: Commit**

```bash
git add scripts/capture-field.mjs public/field-fallback-dark.jpg public/field-fallback-light.jpg playwright.config.ts e2e
git commit -m "test: suite e2e (secciones, idioma, tema, degradación, a11y) y fallbacks del campo

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

### Task 17: Ronda de calidad de diseño y performance

Dos rondas máximo, en lote, como fija el spec. Esta tarea no agrega features: corrige lo que las rondas encuentran.

**Files:**
- Modify: los que las rondas indiquen.
- Create: `.impeccable/review/` (capturas, ignorado en git: agregar `/.impeccable` a `.gitignore`).

- [ ] **Step 1: Capturas batched**

Con `npm run build && npm run start` corriendo, crear `scripts/capture-review.mjs`:

```js
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync(".impeccable/review", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const theme of ["dark", "light"]) {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await page.addInitScript((t) => localStorage.setItem("flexora-theme", t), theme);
    await page.goto("http://localhost:3000/es", { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-visible", "")));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `.impeccable/review/${name}-${theme}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
```

Run: `node scripts/capture-review.mjs`. Abrir las cuatro capturas y validar que ninguna está negra ni cortada.

- [ ] **Step 2: Detector de impeccable**

Run: `~/.claude/skills/impeccable/scripts/impeccable detect --json app components`
Corregir todo lo mecánico que reporte (colores literales, `transition: all`, etc.).

- [ ] **Step 3: Crítica contra el spec**

Revisar las cuatro capturas contra `docs/superpowers/specs/2026-09-07-flexora-home-design.md` sección 4 (ritmo) y 3 (sistema). Cargar `~/.claude/skills/impeccable/reference/craft-floor.md` antes de tocar UI. Listar todos los defectos y arreglarlos en un solo lote. Recapturar y confirmar. Fin de rondas.

- [ ] **Step 4: Review de animaciones**

Invocar la skill `review-animations` sobre `components/site/FlexWordmark.tsx`, `components/site/Marquee.tsx`, `components/ui/ThemeSwitch.tsx`, `components/gl/*.tsx` y la sección de motion de `app/globals.css`. Aplicar lo que contradiga el spec (curvas, duraciones, `scale(0)`, `ease-in`).

- [ ] **Step 5: Lighthouse móvil**

```bash
npx lighthouse http://localhost:3000/es --preset=perf --form-factor=mobile --screenEmulation.mobile --output=json --output-path=.impeccable/review/lh-mobile.json --chrome-flags="--headless"
node -e 'const r=require("./.impeccable/review/lh-mobile.json").audits;console.log({lcp:r["largest-contentful-paint"].displayValue,cls:r["cumulative-layout-shift"].displayValue,tbt:r["total-blocking-time"].displayValue})'
```

Expected: LCP < 2.5 s, CLS 0. Si LCP falla, el sospechoso es el canvas del hero compitiendo con las fuentes: confirmar que `ogl` se importa dinámicamente (ya) y que Anybody solo carga `latin`.

Presupuesto de JS:

```bash
npm run build 2>&1 | grep -A3 "First Load JS"
```

Expected: la ruta `/[lang]` bajo 150 kB. Si no, revisar que `motion/react` solo se importe en client components y que no se importe `motion` completo.

- [ ] **Step 6: Prueba en dispositivo real**

Abrir la home desde un celular de gama media en la misma red (`npm run start -- -H 0.0.0.0`). Verificar: el hero respira, el scroll es fluido, el campo no tartamudea. Si baja de 50 fps a ojo, reducir en `flex-field.shaders.ts` las octavas de `fbm` de 5 a 4 y el DPR táctil ya está en 1.

- [ ] **Step 7: Commit final**

```bash
echo "/.impeccable" >> .gitignore
git add -A
git commit -m "polish: ronda de calidad de diseño, motion y performance

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Wek2JobBiN9TgBPkStvRSY"
```

---

## Cobertura del spec

| Spec | Tareas |
|---|---|
| 3.1 Color, tokens, sin gradientes | 2, 17 |
| 3.2 Tema, detección, sin flash, switch | 4, 6, 16 |
| 3.3 Tipografía Anybody/Geist/Mono, escala | 2 |
| 3.4 Forma y espacio | 2 |
| 3.5 Componentes base | 4, 5, 7 |
| 4 Home: header, hero, marquee, servicios, trabajos, proceso, cierre, footer | 7, 10, 11, 12, 13, 8, 14, 8, 15 |
| 5.1 Tokens motion | 1, 2 |
| 5.2 Firma hero (spring, scroll, touch) | 10 |
| 5.3 Reveals | 2, 8 |
| 5.4 Interacciones (press, link, covers, marquee, switches) | 2, 5, 13, 11, 4, 7 |
| 5.5 Reduced motion y performance WebGL | 2, 9, 10, 13, 16, 17 |
| 6 Arquitectura (stack, routing, proxy, root-params, estructura, server/client, degradación, SEO) | 1, 3, 6, 9, 13, 15 |
| 7 Verificación (unit, componentes, e2e, diseño/perf) | 1–14 (unit/comp), 16 (e2e), 17 (diseño/perf) |
