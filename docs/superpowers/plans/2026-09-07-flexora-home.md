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
    include: ["__tests__/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
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
git add package.json package-lock.json vitest.config.mts lib/motion.ts __tests__/lib/motion.test.ts .gitignore docs/brand docs/superpowers/specs
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
    "home": "Ir al inicio"
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
    "home": "Go to home"
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
