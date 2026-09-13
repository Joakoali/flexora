# Sección Work: reemplazar proyectos falsos por proyectos reales

## Contexto

`content/work.ts` tiene 4 proyectos inventados (Norte Café, Clínica Vera,
Andar Outdoor, Studio Lumen) con covers SVG genéricos y métricas de
resultado inventadas (ej. "+140% ventas online en 3 meses"). `WorkCard.tsx`
los muestra con `DistortImage`, un efecto WebGL de distorsión al mover el
mouse sobre el cover, y un link "Ver caso" que apunta a
`/${locale}/trabajos/${item.slug}` — una ruta que no existe en el sitio.

Ya existen 3 proyectos reales del autor: **GG Propiedades**, **Adocmat** y
**Control Gastos** (los mismos que ya están en `content/clients.ts`). Su
landing personal (`/Users/joaquinalizegui/Proyectos/Landing`,
`src/components/Portfolio.tsx`) ya tiene, para cada uno: nombre,
descripción, stack (tags), screenshot real (`.webp`, capturas de página
completa) y URL del sitio en producción — presentados en una card con un
frame tipo navegador (bolitas de semáforo + barra de URL) donde el
screenshot completo hace scroll vertical automático dentro de una ventana
fija, en loop, y se pausa al hacer hover.

## Objetivo

Reemplazar los 4 proyectos falsos por los 3 reales, con sus datos reales, y
adoptar en Flexora el tratamiento visual de "frame de navegador + auto-scroll
del screenshot" de la Landing (en vez del `DistortImage` actual), adaptado a
los tokens de diseño y a la convención de CSS (BEM + variables, no Tailwind)
de Flexora.

## Fuera de alcance

- No se crea la página de detalle `/[locale]/trabajos/[slug]` — el link de
  cada card pasa a apuntar al sitio real en producción (`target="_blank"`),
  no a una ruta interna.
- No se toca el visual de Branding / FlexMark (spec separado:
  `2026-09-13-brand-visual-flexmark-design.md`).
- No se agregan más de los 3 proyectos reales conocidos.

## Datos reales

Fuente: `Portfolio.tsx` y `public/*.webp` del repo de la Landing personal.

| slug | client | siteUrl | tags |
|---|---|---|---|
| `gg-propiedades` | GG Propiedades | https://ggpropiedades.com | Next.js, React, TypeScript, Tailwind, Prisma, Supabase, NextAuth, Cloudflare |
| `adocmat` | Adocmat | https://adocmat.com | React, TypeScript, Vite, Supabase, Tailwind, EmailJS |
| `control-gastos` | Control Gastos | https://control-gastos-nine-zeta.vercel.app | React, TypeScript, Vite, Tailwind, Firebase |

Descripciones (se traducen al inglés para el dict bilingüe existente; el
texto en español es el original de la Landing):

- GG Propiedades — es: "Plataforma inmobiliaria con buscador avanzado y
  gestión de propiedades." / en: "Real estate platform with advanced search
  and property management."
- Adocmat — es: "Landing institucional con panel de administración y
  formulario de contacto." / en: "Institutional landing page with an admin
  panel and contact form."
- Control Gastos — es: "App de control de gastos con gráficos y
  categorías." / en: "Expense tracking app with charts and categories."

Screenshots: se copian los 3 `.webp` de
`Proyectos/Landing/public/*.webp` a `public/work/<slug>.webp` en Flexora
(renombrados a algo legible: `gg-propiedades.webp`, `adocmat.webp`,
`control-gastos.webp`). Son capturas de página completa (hasta ~5500px de
alto), pensadas para la ventana de scroll del frame de navegador, no para
`object-fit: cover` como los covers SVG actuales.

## Diseño

### `content/work.ts`

Cambia la forma de `WorkItem`:

```ts
export type WorkItem = {
  slug: string;
  client: string;
  cover: string;
  coverAlt: Record<Locale, string>;
  description: Record<Locale, string>; // reemplaza a "services"
  tags: string[];                       // reemplaza a "result"
  siteUrl: string;                      // nuevo: URL del sitio real
};
```

- `services` (línea corta tipo "E-commerce + campañas") se renombra a
  `description` y pasa a llevar la descripción real de cada proyecto (arriba).
- `result` (métrica inventada, un string por locale) se reemplaza por
  `tags: string[]` — el stack tecnológico real, no traducido (nombres de
  tecnologías son iguales en ambos idiomas).
- Se agrega `siteUrl` para el link externo.
- Los 3 items usan los datos de la tabla de arriba.

### `WorkCard.tsx`

Reestructura la card para reproducir el frame de navegador + auto-scroll:

- El link raíz de la card deja de ir a `/${locale}/trabajos/${slug}` y pasa a
  ser `item.siteUrl`, con `target="_blank" rel="noopener noreferrer"`
  (mismo criterio que "Ver sitio" en la Landing). El `TextLink` inferior usa
  la misma URL.
- Arriba del screenshot se agrega una barra de navegador falsa: 3 puntos con
  los colores fijos de macOS (`#ff5f57`, `#febc2e`, `#28c840` — son
  decorativos, no forman parte de la paleta temable de Flexora, así que no
  usan variables de tema) y un chip centrado con el host de `siteUrl` sin
  protocolo (`new URL(item.siteUrl).hostname`).
- El contenedor del screenshot pasa de `aspect-ratio: 16/10` con
  `object-fit: cover` (WebGL) a una ventana de altura fija de `13rem` (mismo
  valor que la Landing, `208px`) con `overflow: hidden`, mostrando la imagen
  completa como `<img>` simple (sin WebGL) que se anima verticalmente con
  `@keyframes` CSS.
- Se elimina el uso de `DistortImage` en `WorkCard`. Confirmado: `DistortImage`,
  `distort-image.shaders.ts` y las clases `.distort`/`.distort__img`/
  `.distort__canvas` no se usan en ningún otro lugar del sitio (única
  referencia productiva era `WorkCard`) — se borran junto con su test
  (`__tests__/components/DistortImage.test.tsx`) en este cambio, no se dejan
  como código muerto.
- El bloque de "resultado" (`work-card__result`, un string) se reemplaza por
  una lista de chips con `item.tags` (mismo patrón visual que
  `.service__deliverables` o los tags de la Landing, adaptado a los
  tokens de Flexora).

### Reveal por card (`Work.tsx`)

Hoy un solo `<Reveal>` envuelve toda la grilla (`work__grid`), por lo que
todas las cards "aparecen" juntas. Para que el auto-scroll del screenshot
arranque cuando cada card individual entra en viewport (relevante porque el
grid alterna offset por columna), `Work.tsx` pasa a envolver cada
`WorkCard` en su propio `<Reveal as="article">`, y el `<Reveal>` exterior
sólo envuelve el título. La animación de scroll del screenshot se activa vía
CSS con el selector `[data-reveal][data-visible]` ya usado en el resto del
sitio (mismo mecanismo que `.svis__chev`), arrancando una vez y quedando en
loop (no hace falta togglear on/off como en la Landing).

### CSS (`app/globals.css`)

- Nuevas reglas bajo `/* ---------- Work ---------- */`: frame de navegador
  (`.work-card__frame`, puntos, chip de URL), ventana de screenshot
  (`.work-card__window`, `overflow: hidden`, altura fija) y su `<img>`
  animado (`@keyframes work-scroll`, aplicada solo con
  `[data-reveal][data-visible] .work-card__window img`), pausa en
  `:hover`/`:focus-within` de la card, y chips de tags
  (`.work-card__tags`, reusando el mismo lenguaje visual que
  `.service__deliverables`/las tags de la Landing pero con las variables de
  Flexora).
- Se agrega la nueva animación al bloque existente
  `@media (prefers-reduced-motion: reduce)` (mismo criterio que `.marquee__scroller`).
- Se elimina `.distort`, `.distort__img`, `.distort__canvas` (confirmado sin
  otro uso, ver sección de arriba).

### Copy (`dictionaries/es.json` y `en.json`)

`work.viewCase` deja de decir "Ver caso" / "View case" (ya no hay "caso",
hay un sitio real) y pasa a "Ver sitio" / "View site".

### Tests (`__tests__/content/work.test.ts`)

Se actualiza para la nueva forma de `WorkItem`:

- Sigue verificando slugs únicos y que `cover` exista como archivo en
  `public`.
- Cambia `expect(w.result.es/en).not.toBe("")` por
  `expect(w.description.es/en).not.toBe("")`.
- Se agrega `expect(w.tags.length).toBeGreaterThan(0)` y
  `expect(w.siteUrl).toMatch(/^https:\/\//)`.
- El rango "entre 3 y 4 proyectos" pasa a ser exactamente 3
  (`expect(work.length).toBe(3)`), ya que ahora son los proyectos reales
  conocidos, no un placeholder.

## Archivos afectados

- `content/work.ts` (reescritura de datos y tipo)
- `components/site/WorkCard.tsx` (reescritura: frame + auto-scroll, sin DistortImage)
- `components/site/Work.tsx` (Reveal por card)
- `app/globals.css` (nuevas reglas Work, posible limpieza de `.distort*`)
- `app/[lang]/dictionaries/es.json`, `en.json` (copy de `work.viewCase`)
- `__tests__/content/work.test.ts` (actualizar expectativas)
- `public/work/gg-propiedades.webp`, `adocmat.webp`, `control-gastos.webp` (nuevos, copiados de la Landing)
- Baja de `public/covers/*.svg` (sin otro uso), `components/gl/DistortImage.tsx`,
  `components/gl/distort-image.shaders.ts` y `__tests__/components/DistortImage.test.tsx`.
