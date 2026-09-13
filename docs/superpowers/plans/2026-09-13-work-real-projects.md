# Sección Work: proyectos reales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La sección Work del sitio muestra los 3 proyectos reales del autor (GG Propiedades, Adocmat, Control Gastos) con sus datos reales, en vez de 4 proyectos inventados, con el tratamiento visual de "frame de navegador + auto-scroll del screenshot" en vez del efecto WebGL de distorsión actual.

**Architecture:** Task 1 reescribe la capa de datos (`content/work.ts`, sus 3 items reales, la copia de los 3 screenshots reales) y adapta `WorkCard.tsx` al nuevo shape de datos (descripción, tags, link externo) manteniendo por ahora el cover con `DistortImage` para no romper el build. Task 2 reemplaza el cover por el frame de navegador + ventana de auto-scroll (CSS puro, sin WebGL), hace que cada card se revele individualmente, y borra `DistortImage` y todo lo que quedó sin uso.

**Tech Stack:** React 19, TypeScript, Next.js App Router, Vitest + Testing Library, CSS plano (sin Tailwind).

**Spec:** `docs/superpowers/specs/2026-09-13-work-real-projects-design.md`

## Global Constraints

- Exactamente 3 proyectos reales (`gg-propiedades`, `adocmat`, `control-gastos`), en ese orden — no se agregan más.
- No se crea `/[locale]/trabajos/[slug]` — todo link de card apunta a `item.siteUrl` real, `target="_blank" rel="noopener noreferrer"`.
- `DistortImage`, `distort-image.shaders.ts`, su test y `public/covers/*.svg` se eliminan por completo (confirmado sin otro uso en el sitio) — no quedan como código muerto.
- La ventana de screenshot tiene altura fija `13rem` (208px) con `overflow: hidden`, mostrando la imagen completa (sin `object-fit: cover`).
- Los 3 puntos del frame de navegador usan colores fijos de macOS (`#ff5f57`, `#febc2e`, `#28c840`) — no variables de tema, son decorativos.
- La animación de auto-scroll se desactiva bajo `@media (prefers-reduced-motion: reduce)`, siguiendo el mismo criterio ya usado para `.marquee__scroller`.
- `work.viewCase` pasa de "Ver caso"/"View case" a "Ver sitio"/"View site" en `es.json` y `en.json`.

---

### Task 1: Datos reales de los 3 proyectos + adaptación mínima de WorkCard

**Files:**
- Create: `public/work/gg-propiedades.webp`, `public/work/adocmat.webp`, `public/work/control-gastos.webp` (copiados de `/Users/joaquinalizegui/Proyectos/Landing/public/`)
- Modify: `content/work.ts`
- Modify: `components/site/WorkCard.tsx`
- Modify: `app/[lang]/dictionaries/es.json`, `app/[lang]/dictionaries/en.json`
- Test: `__tests__/content/work.test.ts` (reescribir), `__tests__/components/WorkCard.test.tsx` (nuevo)

**Interfaces:**
- Consumes: nada nuevo de otros tasks.
- Produces: `WorkItem` con forma `{ slug: string; client: string; cover: string; coverAlt: Record<Locale, string>; description: Record<Locale, string>; tags: string[]; siteUrl: string }`, exportado desde `content/work.ts` junto al array `work: WorkItem[]` con los 3 proyectos reales. `WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string })` sigue siendo el named export de `components/site/WorkCard.tsx` con la misma firma — Task 2 sólo cambia su JSX interno, no su firma.

Nota: este task deja `WorkCard` usando temporalmente el mismo `DistortImage` que ya existe (Task 2 lo reemplaza por el frame de navegador). Esto es intencional: mantiene el build y los tests verdes en todo momento sin descartar trabajo — todo el JSX de este task (tags, descripción, links) sobrevive intacto a Task 2, que sólo toca el cover.

- [ ] **Step 1: Copiar los 3 screenshots reales**

```bash
mkdir -p public/work
cp "/Users/joaquinalizegui/Proyectos/Landing/public/ggpropiedades.com_.webp" public/work/gg-propiedades.webp
cp "/Users/joaquinalizegui/Proyectos/Landing/public/adocmat.vercel.app_.webp" public/work/adocmat.webp
cp "/Users/joaquinalizegui/Proyectos/Landing/public/control-gastos-nine-zeta.vercel.app_.webp" public/work/control-gastos.webp
```

- [ ] **Step 2: Escribir el test que falla para `content/work`**

Reemplazar `__tests__/content/work.test.ts` completo:

```ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { work } from "@/content/work";

describe("content/work", () => {
  it("tiene los 3 proyectos reales con slug único, cover existente, descripción, tags y siteUrl", () => {
    expect(work.length).toBe(3);
    expect(new Set(work.map((w) => w.slug)).size).toBe(work.length);
    for (const w of work) {
      expect(existsSync(`public${w.cover}`), w.cover).toBe(true);
      expect(w.description.es).not.toBe("");
      expect(w.description.en).not.toBe("");
      expect(w.tags.length).toBeGreaterThan(0);
      expect(w.siteUrl).toMatch(/^https:\/\//);
    }
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npx vitest run __tests__/content/work.test.ts`
Expected: FAIL — `work` todavía tiene 4 items con `result`/`services`, no `description`/`tags`/`siteUrl`.

- [ ] **Step 4: Reescribir `content/work.ts`**

```ts
import type { Locale } from "@/lib/i18n";

export type WorkItem = {
  slug: string;
  client: string;
  cover: string;
  coverAlt: Record<Locale, string>;
  description: Record<Locale, string>;
  tags: string[];
  siteUrl: string;
};

export const work: WorkItem[] = [
  {
    slug: "gg-propiedades",
    client: "GG Propiedades",
    cover: "/work/gg-propiedades.webp",
    coverAlt: {
      es: "Captura de ggpropiedades.com",
      en: "Screenshot of ggpropiedades.com",
    },
    description: {
      es: "Plataforma inmobiliaria con buscador avanzado y gestión de propiedades.",
      en: "Real estate platform with advanced search and property management.",
    },
    tags: ["Next.js", "React", "TypeScript", "Tailwind", "Prisma", "Supabase", "NextAuth", "Cloudflare"],
    siteUrl: "https://ggpropiedades.com",
  },
  {
    slug: "adocmat",
    client: "Adocmat",
    cover: "/work/adocmat.webp",
    coverAlt: {
      es: "Captura de Adocmat",
      en: "Screenshot of Adocmat",
    },
    description: {
      es: "Landing institucional con panel de administración y formulario de contacto.",
      en: "Institutional landing page with an admin panel and contact form.",
    },
    tags: ["React", "TypeScript", "Vite", "Supabase", "Tailwind", "EmailJS"],
    siteUrl: "https://adocmat.com",
  },
  {
    slug: "control-gastos",
    client: "Control Gastos",
    cover: "/work/control-gastos.webp",
    coverAlt: {
      es: "Captura de Control Gastos",
      en: "Screenshot of Control Gastos",
    },
    description: {
      es: "App de control de gastos con gráficos y categorías.",
      en: "Expense tracking app with charts and categories.",
    },
    tags: ["React", "TypeScript", "Vite", "Tailwind", "Firebase"],
    siteUrl: "https://control-gastos-nine-zeta.vercel.app",
  },
];
```

- [ ] **Step 5: Correr el test de contenido y verificar que pasa**

Run: `npx vitest run __tests__/content/work.test.ts`
Expected: PASS.

- [ ] **Step 6: Escribir el test que falla para `WorkCard`**

Crear `__tests__/components/WorkCard.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkCard } from "@/components/site/WorkCard";
import { work } from "@/content/work";

describe("WorkCard", () => {
  const item = work[0]; // GG Propiedades

  it("todos sus links apuntan al sitio real, en pestaña nueva, no a una ruta interna", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2); // cover + TextLink
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(item.siteUrl);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("muestra la descripción real y los tags de stack, no una métrica inventada", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    expect(screen.getByText(item.description.es)).toBeTruthy();
    for (const tag of item.tags) {
      expect(screen.getByText(tag)).toBeTruthy();
    }
  });
});
```

- [ ] **Step 7: Correr el test de WorkCard y verificar que falla**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx`
Expected: FAIL — `WorkCard` todavía linkea a `/${locale}/trabajos/${item.slug}` y muestra `item.services`/`item.result`, que ya no existen en `WorkItem` (aparecerán como `undefined`).

- [ ] **Step 8: Adaptar `WorkCard.tsx`**

Reemplazar el contenido completo de `components/site/WorkCard.tsx`:

```tsx
import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { DistortImage } from "@/components/gl/DistortImage";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  return (
    <article className="work-card">
      <a
        href={item.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="work-card__cover"
        aria-label={`${viewCase}: ${item.client}`}
      >
        <DistortImage src={item.cover} alt={item.coverAlt[locale]} />
      </a>
      <div className="work-card__meta">
        <h3 className="h3">{item.client}</h3>
        <p className="label">{item.description[locale]}</p>
        <ul className="work-card__tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <TextLink href={item.siteUrl} target="_blank" rel="noopener noreferrer">
          {viewCase}
        </TextLink>
      </div>
    </article>
  );
}
```

(El cover sigue usando `DistortImage` a propósito — Task 2 lo reemplaza. `.work-card__tags` no tiene estilos todavía — se ve como una lista sin formato hasta Task 2, que agrega su CSS. Esto es esperado y no se corrige acá.)

- [ ] **Step 9: Correr ambos tests y verificar que pasan**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx __tests__/content/work.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 10: Actualizar el copy de `viewCase`**

En `app/[lang]/dictionaries/es.json`, línea 61:

```json
    "viewCase": "Ver caso"
```
→
```json
    "viewCase": "Ver sitio"
```

En `app/[lang]/dictionaries/en.json`, línea 61:

```json
    "viewCase": "View case"
```
→
```json
    "viewCase": "View site"
```

- [ ] **Step 11: Correr toda la suite para confirmar que nada más se rompió**

Run: `npx vitest run`
Expected: todos los tests en PASS (incluye los ya existentes de `Work`/`Services`/etc., que no dependen del copy exacto de `viewCase`).

- [ ] **Step 12: Commit**

```bash
git add public/work content/work.ts components/site/WorkCard.tsx \
  "app/[lang]/dictionaries/es.json" "app/[lang]/dictionaries/en.json" \
  __tests__/content/work.test.ts __tests__/components/WorkCard.test.tsx
git commit -m "feat: Work usa los 3 proyectos reales (GG Propiedades, Adocmat, Control Gastos)"
```

---

### Task 2: Frame de navegador + auto-scroll, reveal por card, baja de DistortImage

**Files:**
- Modify: `components/site/WorkCard.tsx`
- Modify: `components/site/Work.tsx`
- Modify: `app/globals.css`
- Test: `__tests__/components/WorkCard.test.tsx` (agregar casos), `__tests__/components/Work.test.tsx` (nuevo)
- Delete: `components/gl/DistortImage.tsx`, `components/gl/distort-image.shaders.ts`, `__tests__/components/DistortImage.test.tsx`, `public/covers/01.svg`, `public/covers/02.svg`, `public/covers/03.svg`, `public/covers/04.svg`

**Interfaces:**
- Consumes: `WorkItem` y `WorkCard` de Task 1, sin cambios de firma. `Reveal` de `components/site/Reveal.tsx` (ya existe en el repo, sin cambios): `Reveal<T extends ElementType = "div">({ as, className, children, ...rest })`, renderiza el elemento `as` con atributos `data-reveal` (siempre) y `data-visible` (cuando entra en viewport).
- Produces: `WorkCard` sigue exportando la misma firma; su elemento raíz pasa de `<article className="work-card">` a `<Reveal as="article" className="work-card">` — mismo tag HTML final (`<article>`), mismas clases, más los atributos de reveal. `Work` no cambia su firma ni su export.

Nota de diseño (difiere del spec en el "dónde", no en el "qué"): el spec describe que `Work.tsx` envuelva cada `WorkCard` en su propio `<Reveal as="article">`. Envolver `WorkCard` desde afuera crearía un `<article>` extra rodeando al `<article className="work-card">` que `WorkCard` ya renderiza, y además rompería `.work-card:nth-child(even)` (línea ~744 de `globals.css`, usada para el stagger vertical del grid): cada `work-card` pasaría a ser hijo único de su envoltorio, por lo que `nth-child(even)` dejaría de matchear nunca. Este task logra el mismo resultado (cada card se revela individualmente) haciendo que el propio `<article className="work-card">` sea el elemento que `Reveal` produce — un solo elemento, reveal individual, `nth-child` intacto porque `.work-card` sigue siendo hijo directo de `.work__grid`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar estos dos `it(...)` dentro del `describe("WorkCard", ...)` que ya existe en `__tests__/components/WorkCard.test.tsx` (de la Task 1) — pegarlos después de los dos `it(...)` ya escritos, antes del `});` que cierra el `describe`. No se tocan los imports ni el `const item = work[0];` ya presentes en el archivo.

```tsx
  it("se puede revelar individualmente (data-reveal en su propio elemento raíz)", () => {
    const { container } = render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const article = container.querySelector("article.work-card");
    expect(article?.hasAttribute("data-reveal")).toBe(true);
  });

  it("muestra un frame de navegador con el host del sitio, sin WebGL", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    expect(screen.getByText("ggpropiedades.com")).toBeTruthy();
    expect(document.querySelector(".distort")).toBeNull();
    expect(document.querySelector("canvas")).toBeNull();
  });
```

Crear `__tests__/components/Work.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Work } from "@/components/site/Work";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Work", () => {
  it("renderiza los 3 proyectos reales, cada uno revelable por separado", () => {
    const { container } = render(<Work t={es.work} locale="es" />);
    expect(screen.getByText("GG Propiedades")).toBeTruthy();
    expect(screen.getByText("Adocmat")).toBeTruthy();
    expect(screen.getByText("Control Gastos")).toBeTruthy();
    const cards = container.querySelectorAll("article.work-card[data-reveal]");
    expect(cards).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx __tests__/components/Work.test.tsx`
Expected: FAIL — todavía no hay `data-reveal` en `.work-card`, no hay frame de navegador (el host `ggpropiedades.com` no está en pantalla, sigue habiendo `.distort`/`canvas` vía `DistortImage`).

- [ ] **Step 3: Reescribir `components/site/WorkCard.tsx`**

Reemplazar el contenido completo:

```tsx
import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { Reveal } from "./Reveal";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  const host = new URL(item.siteUrl).hostname;
  return (
    <Reveal as="article" className="work-card">
      <a
        href={item.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="work-card__cover"
        aria-label={`${viewCase}: ${item.client}`}
      >
        <div className="work-card__frame" aria-hidden="true">
          <span className="work-card__dot work-card__dot--red" />
          <span className="work-card__dot work-card__dot--yellow" />
          <span className="work-card__dot work-card__dot--green" />
          <span className="work-card__frame-url">{host}</span>
        </div>
        <div className="work-card__window">
          {/* eslint-disable-next-line @next/next/no-img-element -- captura completa animada por CSS, sin next/image */}
          <img src={item.cover} alt={item.coverAlt[locale]} loading="lazy" decoding="async" />
        </div>
      </a>
      <div className="work-card__meta">
        <h3 className="h3">{item.client}</h3>
        <p className="label">{item.description[locale]}</p>
        <ul className="work-card__tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <TextLink href={item.siteUrl} target="_blank" rel="noopener noreferrer">
          {viewCase}
        </TextLink>
      </div>
    </Reveal>
  );
}
```

This follows the same convention `DistortImage.tsx` used for its own `<img>` (see its `eslint-disable-next-line @next/next/no-img-element` comment, in the file this task deletes in Step 6) — the project's ESLint config (`eslint-config-next/core-web-vitals`) flags plain `<img>` elements, and this one is intentional: `next/image`'s responsive sizing doesn't fit a raw full-page screenshot driven by a CSS scroll animation.

- [ ] **Step 4: Actualizar `components/site/Work.tsx`**

Reemplazar el contenido completo:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { Reveal } from "./Reveal";
import { WorkCard } from "./WorkCard";

export function Work({ t, locale }: { t: Dictionary["work"]; locale: Locale }) {
  return (
    <section id="work" className="section hairline" aria-labelledby="work-title">
      <Reveal className="container-site">
        <h2 id="work-title" className="h2 work__title">{t.title}</h2>
      </Reveal>
      <div className="container-site work__grid">
        {work.map((item) => (
          <WorkCard key={item.slug} item={item} locale={locale} viewCase={t.viewCase} />
        ))}
      </div>
    </section>
  );
}
```

(El único cambio real es que `work__grid` ya no está envuelto en un `<Reveal>` propio — cada `WorkCard` trae el suyo. El título sigue con su `Reveal` como antes.)

- [ ] **Step 5: Actualizar CSS en `app/globals.css`**

Ubicar el bloque `/* ---------- Work ---------- */` (alrededor de la línea 695). Eliminar estas reglas (quedan sin uso: `DistortImage` deja de existir):

```css
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
```

y esta (el campo `result` ya no existe):

```css
.work-card__result {
  /* Texto violeta chico: --accent sobre --bg en oscuro sólo da 3.69:1. */
  color: var(--accent-text);
  font-weight: 500;
}
```

En su lugar, agregar (mismo bloque `Work`, antes del `@media (min-width: 900px)` que ya existe con el stagger de `.work-card:nth-child(even)` — no tocar ese bloque):

```css
.work-card__frame {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.work-card__dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 999px;
  flex: none;
}
/* Colores fijos de macOS: son decorativos, no forman parte de la paleta temable de Flexora. */
.work-card__dot--red { background: #ff5f57; }
.work-card__dot--yellow { background: #febc2e; }
.work-card__dot--green { background: #28c840; }
.work-card__frame-url {
  flex: 1;
  margin: 0 0.5rem;
  padding: 0.125rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--fg-muted);
  font-size: 0.75rem;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.work-card__window {
  position: relative;
  height: 13rem;
  overflow: hidden;
  background: var(--surface);
}
.work-card__window img {
  display: block;
  width: 100%;
  height: auto;
}
[data-reveal][data-visible] .work-card__window img {
  animation: work-scroll 8s ease-in-out infinite alternate;
}
.work-card:hover .work-card__window img,
.work-card:focus-within .work-card__window img {
  animation-play-state: paused;
}
@keyframes work-scroll {
  0%, 10% { transform: translateY(0); }
  90%, 100% { transform: translateY(calc(-100% + 13rem)); }
}
.work-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin-top: 0.25rem;
}
.work-card__tags li {
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--fg-muted);
}
```

Y agregar, junto a los otros bloques `@media (prefers-reduced-motion: reduce)` ya existentes en el archivo (hay varios, uno por sección — no reutilizar el de `.marquee__scroller`, agregar uno nuevo cerca de las reglas de Work que acabás de escribir):

```css
@media (prefers-reduced-motion: reduce) {
  .work-card__window img { animation: none; }
}
```

`.work-card__cover` (ya existente, no se toca) sigue proveyendo `border-radius`, `overflow: hidden` y el borde de la card completa.

- [ ] **Step 6: Borrar `DistortImage` y lo que queda sin uso**

```bash
rm components/gl/DistortImage.tsx
rm components/gl/distort-image.shaders.ts
rm __tests__/components/DistortImage.test.tsx
rm public/covers/01.svg public/covers/02.svg public/covers/03.svg public/covers/04.svg
```

- [ ] **Step 7: Correr los tests nuevos y verificar que pasan**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx __tests__/components/Work.test.tsx`
Expected: PASS (5 tests: 4 de WorkCard + 1 de Work).

- [ ] **Step 8: Correr toda la suite y el linter**

Run: `npx vitest run`
Expected: todos los tests en PASS. Ya no debe existir ningún test de `DistortImage` (borrado en Step 6).

Run: `npm run lint`
Expected: sin errores — en particular, sin warning de `@next/next/no-img-element` en `WorkCard.tsx` (cubierto por el comentario del Step 3) ni imports rotos hacia los archivos borrados en Step 6.

- [ ] **Step 9: Revisión visual manual**

Run: `npm run dev`, abrir `/es` (o la ruta que corresponda) y scrollear hasta la sección de trabajos. Confirmar: las 3 cards muestran el screenshot real dentro de un frame con puntos de semáforo y el host del sitio; al hacer scroll-reveal, el screenshot arranca a desplazarse verticalmente en loop; al pasar el mouse (o enfocar con teclado) sobre una card, el desplazamiento se pausa; los tags de stack se ven como chips debajo de la descripción; el botón "Ver sitio"/"View site" y el click en la portada abren el sitio real en una pestaña nueva. Confirmar también con las devtools que no queda ningún `<canvas>` en la sección.

- [ ] **Step 10: Commit**

```bash
git add components/site/WorkCard.tsx components/site/Work.tsx app/globals.css \
  __tests__/components/WorkCard.test.tsx __tests__/components/Work.test.tsx
git rm components/gl/DistortImage.tsx components/gl/distort-image.shaders.ts \
  __tests__/components/DistortImage.test.tsx \
  public/covers/01.svg public/covers/02.svg public/covers/03.svg public/covers/04.svg
git commit -m "feat: Work usa frame de navegador + auto-scroll en vez de DistortImage"
```
