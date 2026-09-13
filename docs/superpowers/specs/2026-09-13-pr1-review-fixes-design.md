# PR #1 (feature/home): fixes del review de /code-review [high]

## Contexto

`/code-review [high] revisa el pr1` sobre `feature/home` (`main...HEAD` +
working tree) encontró 5 issues, ninguno bloqueante por sí solo pero todos
con impacto real si se dejan pasar. Son independientes entre sí (archivos
distintos, sin dependencias cruzadas), así que se agrupan en un solo spec
con 5 tareas chicas en vez de uno por issue.

## Objetivo

Resolver los 5 hallazgos del review antes de mergear `feature/home`.

## Fixes

### 1. `lib/whatsapp.ts` — fallback roto con env var vacía

`raw = number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_NUMBER`
usa `??`, que solo cae al siguiente valor si el anterior es
`null`/`undefined`. Si `NEXT_PUBLIC_WHATSAPP_NUMBER` está declarada pero
vacía (`""`) — común cuando una plataforma de deploy define la env var sin
completarla — `raw` queda en `""` y el botón de WhatsApp genera
`https://wa.me/?text=...`, un link roto en header, hero y cierre.

**Fix:** cambiar `??` por `||` en la cadena, así una cadena vacía también
cae al siguiente candidato. **Estado: aplicado.**

### 2. `components/site/WorkCard.tsx` — clase tipográfica incorrecta

La descripción del proyecto (`item.description[locale]`, una oración
completa) usa la clase `.label`, que es mono, uppercase, tracked y
pensada para rótulos cortos / metadata (mismo criterio documentado en el
comentario de `.site-footer__legal` sobre reservar el mono a "rótulos
cortos, metadata y pasos"). El resultado es una oración larga en
mayúsculas monoespaciadas, difícil de leer.

**Fix:** agregar una clase scoped `.work-card__desc` en `app/globals.css`
bajo el bloque `/* ---------- Work ---------- */` existente, siguiendo el
mismo patrón que `.process__desc` (fuente normal, `color: var(--fg-muted)`,
sin `text-transform`/mono), y usarla en `WorkCard.tsx` en vez de `.label`.

### 3. `content/clients.ts` — archivo sin trackear del que depende `page.tsx`

`app/[lang]/page.tsx` (modificado, trackeado) importa desde
`@/content/clients`, pero `content/clients.ts` y su test
(`__tests__/content/clients.test.ts`) figuran como `??` (untracked) en
`git status`. Si se commitea con `git add -u` o `git commit -a` (que solo
toma archivos ya trackeados modificados), el build rompe por módulo
faltante.

**Fix:** `git add content/clients.ts __tests__/content/clients.test.ts`
para que viajen en el mismo commit que `page.tsx`.

### 4. `useScroll` duplicado en `Header.tsx` y `HeroProgress.tsx`

Ambos componentes llaman `useScroll({ target: heroRef, offset: ["start
start", "end end"] })` sobre el mismo elemento (`#hero`), cada uno con su
propio listener y su propio cómputo de progreso por frame de scroll.
Decisión tomada: unificar (no es solo cosmético, evita seguir duplicando
este patrón si se agrega un tercer consumidor a futuro).

**Fix:** nuevo componente cliente `components/site/HeroScrollProvider.tsx`:

```ts
"use client";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";

type HeroScrollContextValue = { scrollYProgress: MotionValue<number> };
const HeroScrollContext = createContext<HeroScrollContextValue | null>(null);

export function HeroScrollProvider({ heroId = "hero", children }: { heroId?: string; children: ReactNode }) {
  const heroRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    heroRef.current = document.getElementById(heroId);
  }, [heroId]);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });
  return <HeroScrollContext.Provider value={{ scrollYProgress }}>{children}</HeroScrollContext.Provider>;
}

export function useHeroScrollProgress() {
  const ctx = useContext(HeroScrollContext);
  if (!ctx) throw new Error("useHeroScrollProgress must be used within HeroScrollProvider");
  return ctx;
}
```

- `app/[lang]/layout.tsx`: envolver `<Header />` + `{children}` (dentro de
  `<body>`) en `<HeroScrollProvider>`.
- `Header.tsx`: quita su propio `useScroll`; obtiene `scrollYProgress` de
  `useHeroScrollProgress()`. Mantiene su propio
  `useMotionValueEvent(scrollYProgress, "change", ...)` (cada consumidor
  se suscribe al mismo `MotionValue`, eso es barato) y su lógica actual de
  `trackHeroRef` vía `document.getElementById("hero")` para detectar si
  hay hero en la página (no depende del contexto, evita problemas de orden
  de efectos padre/hijo).
- `HeroProgress.tsx`: quita su propio `useScroll` y el `heroRef` que solo
  usaba como target de ese hook (deja de necesitarlo). Obtiene
  `scrollYProgress` de `useHeroScrollProgress()` y mantiene su
  `useMotionValueEvent` para publicar `--hero-p`.

### 5. `public/ideas/` — archivos personales sin trackear en directorio público

`.DS_Store`, `WhatsApp Image 2026-09-08 at 18.10.58.jpeg` y `Extracción de
logo en vector.zip` quedaron sin trackear dentro de `public/`, que Next.js
sirve públicamente. Verificado con `git check-ignore -v
public/ideas/.DS_Store`: `.DS_Store` ya está cubierto por la regla global
en `.gitignore:24`, no hace falta tocar `.gitignore`.

Además, `public/ideas/assets/` (no mencionado por el review original, que
solo listó 3 archivos) contiene el contenido descomprimido de ese mismo
zip: logos exportados (`flexora-mark*.svg/png`, `flexora-lockup*.svg/png`
en variantes black/white/darktext) sin ninguna referencia en el código.
Decisión: no se borran (son assets de marca potencialmente útiles), pero
tampoco quedan servibles públicamente sin uso — se mueven fuera de
`public/`.

**Fix:**
- Borrar `public/ideas/.DS_Store`, `public/ideas/WhatsApp Image 2026-09-08
  at 18.10.58.jpeg` y `public/ideas/Extracción de logo en vector.zip`.
- Mover `public/ideas/assets/` a `design/brand-assets/` (raíz del repo,
  fuera de `public/`).

## Fuera de alcance

- No se toca el resto de los ~96 archivos del diff de `feature/home`
  ajenos a estos 5 hallazgos.
- No se agregan tests nuevos para `HeroScrollProvider` — es un refactor de
  cableado interno sin lógica propia verificable más allá de lo que ya
  cubren los componentes que lo consumen.

## Archivos afectados

- `lib/whatsapp.ts` (aplicado)
- `app/globals.css` (nueva clase `.work-card__desc`)
- `components/site/WorkCard.tsx` (usa la nueva clase)
- `content/clients.ts`, `__tests__/content/clients.test.ts` (git add)
- `components/site/HeroScrollProvider.tsx` (nuevo)
- `app/[lang]/layout.tsx` (envuelve con el provider)
- `components/site/Header.tsx`, `components/site/HeroProgress.tsx` (consumen el contexto)
- Baja de `public/ideas/.DS_Store`, `public/ideas/WhatsApp Image 2026-09-08 at 18.10.58.jpeg`, `public/ideas/Extracción de logo en vector.zip`
- `public/ideas/assets/*` → movido a `design/brand-assets/*`
