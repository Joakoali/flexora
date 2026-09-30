# Plan de correcciones — PR #1 `feature/home` → `main`

Documento para un agente. Contiene el resultado de una review externa del PR
https://github.com/Joakoali/flexora/pull/1 y las tareas necesarias para dejarlo
mergeable.

## Contexto del repo

- Next 16.3.4 (App Router), React 19, TypeScript strict, Tailwind v4.
- Todo el routing vive bajo `app/[lang]/`. Locales: `es` (default) y `en`.
- `proxy.ts` (el ex-`middleware.ts`) redirige `/` al locale según `Accept-Language`.
- Diccionarios JSON en `app/[lang]/dictionaries/`, tipados desde `es.json`.
- WebGL con `ogl` (carga async), animación con `motion` + scroll-driven CSS.
- Tests: Vitest (`__tests__/`) + Playwright (`e2e/`).

## Estado verificado antes de empezar

Comprobado localmente sobre `origin/feature/home`:

- `npx eslint` → limpio.
- `npx vitest run` → 46/46 pasan.
- `npx tsc --noEmit` → falla **sólo** en `LayoutProps<"/[lang]">` (tipo generado
  por `next typegen`). No es un error real: correr `npm run typegen` antes.
- `next build` y los e2e no se pudieron verificar en el entorno de review
  (sin salida a `fonts.googleapis.com`, que `next/font/google` necesita).

## Reglas de trabajo

1. **Un commit por tarea**, con el ID de la tarea en el mensaje. Ejemplo:
   `fix(B1): la sección de trabajos deja de apuntar a rutas inexistentes`.
2. **No romper el spec de diseño** (`docs/specs/2026-09-07-flexora-home-design.md`).
   Si una corrección obliga a desviarse del spec, no la apliques: dejá una nota
   al final de este archivo bajo `## Desvíos propuestos` y seguí.
3. **Cada tarea termina con lint + tests en verde.** Si un test existente falla
   por un cambio legítimo, actualizá el test, no el código para complacerlo.
4. **No refactorices de más.** Las tareas están acotadas a propósito.
5. Si una tarea resulta más grande de lo descrito, pará y anotá por qué en
   `## Bloqueos` al final, en vez de improvisar una solución parcial.

---

# BLOQUEANTES

No mergear hasta que estos tres estén resueltos.

## B1 — La sección Trabajos apunta a ocho rutas que no existen

**Evidencia:** `components/site/WorkCard.tsx:9` y `:16`

```tsx
<a href={`/${locale}/trabajos/${item.slug}`} className="work-card__cover" ...>
<TextLink href={`/${locale}/trabajos/${item.slug}`}>{viewCase}</TextLink>
```

`app/[lang]/trabajos/[slug]/` no existe en el árbol. Son 2 links × 4 tarjetas =
8 links a 404 en la sección central de la landing. Además el segmento está
hardcodeado en español: en inglés queda `/en/trabajos/norte-cafe`.

**Qué hacer (opción mínima, la recomendada para este PR):**

Sacar los links. La tarjeta pasa a ser un bloque no navegable hasta que existan
las páginas de caso.

- `WorkCard.tsx`: reemplazar el `<a class="work-card__cover">` por un `<div>` con
  la misma clase, y eliminar el `<TextLink>` del final.
- El prop `viewCase` queda sin uso: sacarlo de `WorkCard`, de la llamada en
  `Work.tsx:15`, y sacar `viewCase` de la clave `work` en ambos diccionarios.
- El `aria-label` que dependía de `viewCase` desaparece junto con el `<a>`.
- Revisar `app/globals.css`: los estilos de `.work-card__cover` que asumen `<a>`
  (`:hover`, `:focus-visible`, `display`) tienen que seguir funcionando sobre un
  `<div>`. Si había `:focus-visible`, ya no aplica y se puede borrar.

**Qué NO hacer:** no inventes las páginas de caso. No hay contenido real para
llenarlas (ver B2) y crear cuatro páginas placeholder empeora el problema.

**Criterio de aceptación:**

- `grep -rn "trabajos" components/ app/` no devuelve ningún `href`.
- El test de paridad de diccionarios sigue en verde tras sacar `viewCase` de
  los dos JSON.
- Ningún test referencia `viewCase`.

---

## B2 — Los casos de éxito son inventados y están presentados como reales

**Evidencia:** `content/work.ts` completo.

```ts
result: { es: "+140% ventas online en 3 meses", en: "+140% online sales in 3 months" },
result: { es: "3x turnos reservados online", ... },
result: { es: "ROAS 4.2 en el lanzamiento", ... },
```

Clientes ficticios ("Norte Café", "Clínica Vera", "Andar Outdoor", "Studio
Lumen") con métricas ficticias. La descripción del PR menciona que faltan los
covers reales pero no aclara que los datos también son placeholder. Publicado
tal cual es publicidad engañosa.

Agravante: `__tests__/content/work.test.ts` valida que `result.es` y `result.en`
no estén vacíos, o sea que hoy un test protege el placeholder.

**Qué hacer:**

No podés inventar datos reales, así que la corrección es marcarlos como
provisorios de forma que sea imposible desplegarlos por accidente:

1. En `content/work.ts`, agregá al tipo `WorkItem` un campo obligatorio
   `placeholder: boolean` y ponelo en `true` en las cuatro entradas.
2. En `components/site/Work.tsx`, filtrá: `work.filter((w) => !w.placeholder)`.
3. Si el resultado del filtro queda vacío, la sección entera no se renderiza
   (`return null`). La home queda sin sección Trabajos hasta que haya casos
   reales, que es el estado honesto.
4. Ajustá `__tests__/content/work.test.ts`: en vez de validar que `result` no
   esté vacío, que valide que **ningún item con `placeholder: true` llega a
   renderizarse**. Agregá un test de `Work` que compruebe que con sólo
   placeholders la sección no aparece en el DOM.
5. `e2e/home.spec.ts:3` incluye `"work"` en `SECTIONS` y hace
   `toBeAttached()`. Sacá `"work"` de esa lista, o el e2e va a fallar.
   Ojo: el link `#work` del header (`Header.tsx:37`) y el botón secundario del
   hero (`Hero.tsx:18`, `href="#work"`) quedan apuntando a un ancla inexistente.
   Cambiá ambos a `#services`.
6. Dejá un comentario arriba del array explicando que las entradas son datos de
   muestra y que hay que reemplazarlas por casos reales antes de publicar.

**Criterio de aceptación:**

- La home renderizada no contiene ninguno de los cuatro nombres de cliente ni
  ninguna de las métricas.
- No queda ningún `href="#work"` apuntando a una sección que no se renderiza.
- `npx vitest run` en verde.

---

## B3 — Dos variables de entorno con fallback silencioso que rompen producción

**Evidencia:**

`lib/whatsapp.ts:1` y `:4`

```ts
const DEFAULT_NUMBER = "5491100000000";
const raw = number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_NUMBER;
```

`app/[lang]/layout.tsx:18`

```ts
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
```

Las páginas son estáticas: ambos valores se hornean en build. Si falta la
primera, los cuatro CTAs de la página apuntan a un número que no existe y nadie
se entera. Si falta la segunda, el `canonical` y las imágenes Open Graph salen
apuntando a `http://localhost:3000` en producción.

**Qué hacer:**

Creá `lib/env.ts` con validación que falle en build:

```ts
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Ver .env.example.`,
    );
  }
  return value;
}

export const SITE_URL = required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL);
export const WHATSAPP_NUMBER = required("NEXT_PUBLIC_WHATSAPP_NUMBER", process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
```

Notas de implementación:

- Con `NEXT_PUBLIC_*` el reemplazo es literal en build, así que hay que leer
  `process.env.NEXT_PUBLIC_X` de forma estática (no por índice ni destructuring
  dinámico) o el bundler no lo inlinea. El código de arriba lo cumple.
- `lib/whatsapp.ts` pasa a importar `WHATSAPP_NUMBER` y a borrar `DEFAULT_NUMBER`.
  Mantené el parámetro opcional `number?` — los tests lo usan para no depender
  del entorno.
- `layout.tsx` pasa a importar `SITE_URL`.
- Los tests corren sin `.env`, así que hay que darles las variables. Agregá a
  `vitest.config.mts` un bloque `define` o usá `env: { ... }` dentro de `test`
  para setear ambas con valores de prueba. Verificá que
  `__tests__/lib/whatsapp.test.ts` siga pasando.
- Actualizá `.env.example` con un comentario diciendo que ambas son
  obligatorias y que el build falla sin ellas.
- Documentá en el README (o creá uno) que hay que setearlas en Vercel.

**Criterio de aceptación:**

- `NEXT_PUBLIC_WHATSAPP_NUMBER= NEXT_PUBLIC_SITE_URL= npx next build` falla con
  un mensaje que nombra la variable faltante.
- `npx vitest run` en verde.
- `grep -rn "5491100000000\|localhost:3000" lib/ app/` no devuelve nada fuera de
  `.env.example` y de la config de tests.

---

# IMPORTANTES

Se pueden hacer en este PR o en uno siguiente, pero N1 conviene hacerlo acá
antes de que más componentes dependan de `motion`.

## N1 — Eliminar la dependencia `motion` (24 kB, es lo que rompe el presupuesto)

El PR asume 167 kB de first-load JS contra una guía de 150 kB, y atribuye 24 kB
a `motion`. Los tres usos son evitables:

| Uso | Archivo | Reemplazo |
| --- | --- | --- |
| `useSpring` del wordmark | `components/site/FlexWordmark.tsx` | Decay exponencial en rAF |
| `animate()` al soltar el marquee | `components/site/Marquee.tsx` | Transición CSS con `--ease-out` |
| `animate()` del ícono del switch | `components/ui/ThemeSwitch.tsx` | Transición CSS sobre `transform` |
| `useScroll` fallback de `--hero-p` | `components/site/HeroProgress.tsx` | Listener de scroll + rAF |
| `useReducedMotion` | varios | `window.matchMedia("(prefers-reduced-motion: reduce)")` |

El repo **ya tiene** un spring críticamente amortiguado escrito a mano dos veces:
`components/gl/FlexField.tsx:104` (`const k = 1 - Math.exp(-dt * 6)`) y
`components/gl/DistortImage.tsx:106` (`* 8`). Extraelo a `lib/motion.ts` como
utilidad reutilizable y usalo también en el wordmark.

Para `useReducedMotion`, escribí un hook propio en `lib/motion.ts` que suscriba
al `MediaQueryList` (`addEventListener("change", ...)`), no sólo lea `.matches`
una vez.

Para `HeroProgress`, el fallback sólo corre cuando
`CSS.supports("animation-timeline: scroll()")` es `false`. Un
`window.addEventListener("scroll", ..., { passive: true })` con la posición
normalizada contra el alto del hero cubre exactamente lo mismo.

**Criterio de aceptación:**

- `motion` fuera de `package.json` y de `package-lock.json`.
- `grep -rn "motion/react" .` sin resultados fuera de `node_modules`.
- Los e2e de `degradation.spec.ts` (reduced-motion) siguen pasando.
- El comportamiento visual del wordmark, marquee y switch no cambia de forma
  perceptible. Si alguno no se puede replicar sin la librería, anotalo en
  `## Desvíos propuestos` en vez de aproximarlo mal.

## N2 — `Header` es Client Component sólo por el estado de scroll

`components/site/Header.tsx:1` tiene `"use client"` únicamente por:

```tsx
const [scrolled, setScrolled] = useState(false);
useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 8); ... }, []);
```

Eso arrastra `Logo`, `Button` y `LangSwitch` al bundle de cliente sin que
ninguno lo necesite.

El proyecto ya usa scroll-driven animations (`app/globals.css:458`,
`@supports (animation-timeline: scroll())`). Aplicá el mismo mecanismo al fondo
y borde del header: una `@keyframes` que anime `background-color` y
`border-bottom-color` con `animation-timeline: scroll(root)` y
`animation-range: 0 8px`.

Para navegadores sin soporte, el header queda transparente siempre. Es una
degradación aceptable (no rompe legibilidad porque el hero es oscuro).

Después de eso: sacá `"use client"` de `Header.tsx`. `ThemeSwitch` queda como
única isla cliente del header.

**Criterio de aceptación:**

- `Header.tsx` sin `"use client"` ni hooks.
- El estilo del header al scrollear se ve igual en Chrome.
- `e2e/home.spec.ts` (que verifica `getByRole("banner")`) sigue pasando.

## N3 — Servicios y visuales acoplados por índice de array

`components/site/Services.tsx:6` y `:16`

```ts
const VISUALS = [DevVisual, AdsVisual, BrandVisual];
const Visual = VISUALS[i] ?? DevVisual;
```

Si el JSON se reordena o crece, el visual cambia en silencio y el `?? DevVisual`
tapa el error.

**Qué hacer:** mapeá por `item.index` (los diccionarios ya traen `"01"`, `"02"`,
`"03"`) con un `Record<string, ComponentType>` tipado. Si el índice no está en el
mapa, que sea un error de tipo, no un fallback. Si necesitás un fallback en
runtime, que loguee.

## N4 — El cast de `en.json` anula el chequeo estructural

`app/[lang]/dictionaries.ts:10`

```ts
en: () => import("./dictionaries/en.json").then((m) => m.default as Dictionary),
```

Ese `as` hace que si `en.json` pierde una clave, TypeScript no diga nada.

**Qué hacer:** reemplazá el cast por una anotación que fuerce la comprobación:

```ts
en: async (): Promise<Dictionary> => {
  const mod = await import("./dictionaries/en.json");
  const dict: Dictionary = mod.default;
  return dict;
},
```

Si TypeScript se queja por diferencias de tipos literales en los arrays, la
solución correcta es tipar el JSON, no volver al `as`.

## N5 — No hay CI

No existe `.github/workflows/`. El PR afirma que lint, tests y build están en
verde y nada lo verifica. Importa más de lo normal acá porque `npm run lint` no
chequea tipos: hoy no hay ningún gate que corra `tsc`.

**Qué hacer:** creá `.github/workflows/ci.yml` que en push y pull_request corra,
en este orden:

1. `npm ci`
2. `npm run typegen`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npm test`
6. `npm run build`

Node 22. Las variables de B3 van como env del job con valores dummy (el build
sólo necesita que existan). Los e2e de Playwright dejalos fuera del workflow por
ahora (necesitan browsers y tardan) o en un job separado y opcional.

Agregá también un script `"typecheck": "tsc --noEmit"` a `package.json`.

## N6 — Falta skip link

`app/[lang]/page.tsx:14` tiene `<main id="main">` pero nada apunta ahí. El header
tiene nueve elementos focusables antes del contenido.

**Qué hacer:** agregá un `<a href="#main" class="skip-link">` como primer hijo
del `<body>` en `app/[lang]/layout.tsx`, con el texto en el diccionario
(clave nueva `nav.skipToContent`, en ambos JSON). Estilo estándar: fuera de
pantalla hasta recibir foco.

Nota: el test de axe pasa hoy sin skip link porque axe no lo detecta de forma
automática. No confíes en `e2e/a11y.spec.ts` para validar esto; agregá un test
de teclado que compruebe que el primer `Tab` llega al skip link.

## N7 — `switchLocalePath` pierde query string y hash

`lib/i18n.ts:26` opera sobre el pathname, y `components/ui/LangSwitch.tsx:9`
usa `usePathname()`, que no incluye ni query ni hash. Si llega tráfico de ads
con `?utm_source=`, cambiar de idioma se lo come.

**Qué hacer:** en `LangSwitch`, sumá `useSearchParams()` y reconstruí el href
con la query. `LangSwitch` ya es client component, así que no hay costo
adicional; sí necesita un `<Suspense>` alrededor o marcar la ruta como dinámica
— verificá que el prerender estático de `es`/`en` siga funcionando después del
cambio. Si rompe el prerender, no lo apliques y anotalo.

El hash no se puede recuperar en el servidor; ignoralo.

## N8 — El único `<h1>` de la página es la marca

`components/site/FlexWordmark.tsx:37` renderiza `<h1>FLEXORA</h1>`. El tagline,
que es donde están las palabras clave, vive en un `<p>`
(`components/site/Hero.tsx:15`).

**Qué hacer:** dejá el wordmark como elemento visual (`<div>` o `<p>` con
`aria-hidden` si el nombre ya está en el `aria-label` de la sección) y promové
el tagline a `<h1>`. Verificá que:

- El CSS de `.hero__wordmark` no dependa del selector de elemento.
- `HeroProgress` sigue encontrando `.hero__wordmark` (busca por clase, debería
  estar bien).
- `__tests__/components/FlexWordmark.test.tsx` se actualiza.
- El e2e de axe sigue en verde (jerarquía de headings).

## N9 — Faltan `sitemap.ts` y `robots.ts`

Es una landing pensada para rankear y no tiene ninguno de los dos.

**Qué hacer:** `app/sitemap.ts` que emita `/es` y `/en` con `alternates`, y
`app/robots.ts` que apunte al sitemap. Usá `SITE_URL` de `lib/env.ts` (B3).

Sumá también `x-default` a `alternates.languages` en `generateMetadata`
(`app/[lang]/layout.tsx:23`), apuntando a `/es`.

---

# MENORES

Hacelos todos juntos en un solo commit de limpieza.

## M1 — `FlexField` no limpia igual que `DistortImage` en el `catch`

`components/gl/FlexField.tsx:130-136`: el bloque `catch` desconecta los
observers y libera el contexto, pero no llama a `cancelAnimationFrame(raf)` ni
quita los listeners `pointermove` / `pointerleave` agregados en las líneas 86-87.

`components/gl/DistortImage.tsx:136-145` sí hace ambas cosas.

La ventana real es casi nula (lo que más probablemente tira es el compile del
`Program`, en la línea 49, antes de que se agreguen los listeners), pero son dos
archivos gemelos con cleanup distinto y eso es una trampa para el próximo que
los toque. Igualá `FlexField` a `DistortImage`.

## M2 — El loop de rAF de `FlexField` no se detiene fuera de viewport

`components/gl/FlexField.tsx:100-101`:

```ts
raf = requestAnimationFrame(loop);
if (!visible || document.hidden) return;
```

El `requestAnimationFrame` está antes del guard, así que el loop sigue despierto
cuando el campo salió de pantalla. Son dos instancias (`hero` y `closing`).

**Qué hacer:** sacar el `requestAnimationFrame` del tope del loop y arrancar /
parar desde el callback del `IntersectionObserver`: cuando `visible` pasa a
`false`, `cancelAnimationFrame`; cuando vuelve a `true`, re-arrancar y resetear
`last = performance.now()` para que el primer `dt` no venga inflado.

## M3 — `.hero` usa `vh` mientras `.hero__sticky` usa `dvh`

`app/globals.css:472` (`height: 200vh`) contra `.hero__sticky` que declara
`height: 100vh; height: 100dvh;`. En mobile con barra de URL dinámica el largo
del viaje no coincide con el alto de la escena.

**Qué hacer:** agregá la contrapartida `height: 200dvh;` después de la
declaración en `vh`, igual que hace `.hero__sticky`. Verificá que el bloque de
`prefers-reduced-motion` (`app/globals.css:542`) siga sobrescribiendo bien.

## M4 — `applyTheme` guarda el timer en estado de módulo

`lib/theme.ts:15`: `let changingTimer` a nivel de módulo, compartido entre todas
las instancias. Hoy hay un solo `ThemeSwitch` así que funciona, pero es estado
global implícito.

**Qué hacer:** mover el timer a un `useRef` dentro de `ThemeSwitch`, o
encapsularlo en un closure devuelto por una factory. Lo primero es más simple.

## M5 — Historial del branch

28 commits, varios `fix:` corrigiendo el `feat:` inmediatamente anterior.
**Squash al mergear.** No reescribas la historia del branch ahora — el PR ya está
abierto y los links a commits en la descripción se romperían.

---

# Verificación final

Antes de dar por terminado, corré en este orden y pegá los resultados en el
resumen:

```bash
npm ci
npm run typegen
npx tsc --noEmit
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium   # sólo la primera vez
npm run e2e
```

Todo tiene que estar en verde. Si `npm run build` falla por no poder descargar
las fuentes de Google, es un problema de red del entorno, no del código: dejalo
anotado y seguí.

Chequeos manuales adicionales:

```bash
grep -rn "trabajos" components/ app/ --include=*.tsx          # B1: vacío
grep -rn "5491100000000\|localhost:3000" lib/ app/            # B3: vacío
grep -rn "motion/react" --include=*.tsx --include=*.ts .      # N1: vacío
grep -rn 'href="#work"' components/                           # B2: vacío
```

Después del build, verificá el tamaño del first-load JS de `/[lang]` en la
salida de `next build`. Objetivo tras N1: por debajo de 150 kB gzip.

---

# Resumen para el reporte final

Cuando termines, escribí acá abajo:

## Hecho

<!-- lista de tareas completadas, con el hash del commit de cada una -->

## Bloqueos

<!-- tareas que no pudiste completar y por qué -->

## Desvíos propuestos

<!-- casos donde la corrección chocaba con el spec de diseño -->
