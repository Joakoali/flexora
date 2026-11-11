# PR #4 (feature/contact-form): fixes del review y decisiones de la ronda

## 1. Contexto y decisiones del dueño

La PR #4 de `Joakoali/flexora` (fork `VentuCoding:feature/contact-form`) trae el
formulario de contacto en `Closing`, el hero premium, la nav con más peso, el
menú hamburguesa mobile, el catalán (`/ca`) y el botón flotante de WhatsApp. Un
code review dejó 15 hallazgos. La rama `fix/pr4-review-fixes` parte de `a6bacaa`
(la punta de la PR; `git log --oneline a6bacaa..HEAD`), los corrige en tareas
chicas, una por tema, y se pushea al fork. La #4 se mergeó a `main` el 2026-11-09 (`3baaff6`).

Decisiones del dueño en esta ronda:

| Tema | Decisión |
|---|---|
| Dónde se arregla | En el fork. Se mergea la #4 y se cierra la #3, que es redundante (sale del mismo commit). |
| Alcance | Bugs y accesibilidad verificados + tokens de movimiento. El contraste del botón flotante y el `blur` quedan como seguimiento. |
| Moodboards | Los 3 JPEG de `public/ideas/` pasan a `design/references/` (`public/` se sirve completo). |
| Copy de negocio y catalán | Se mergean tal cual y se revisan después. |
| Sin JS en `Reveal` | Fallback con `@media (scripting: none)`. |
| Seguimientos | Se anotan en este doc; no se abren issues. |

## 2. Hallazgos del review y su resolución

| # | Hallazgo | Estado | Commits |
|---|---|---|---|
| 1 | El e2e del CTA del header estaba roto en mobile (el CTA vive en el panel del menú). | Corregido: un test para escritorio y otro para mobile | `6ea2e8b` |
| 2 | Una action rechazada (red, timeout, 5xx, action ID viejo) tiraba toda la página. | Corregido: `submitContact` con try/catch | `cdac42f` |
| 3 | El time-gate de 2 s perdía leads reales (éxito falso). | Corregido: `isTooFast` devuelve `too_fast` conservando lo tipeado | `94ab076`, `f4ce032` |
| 4 | El límite de 2000 contaba mal con CRLF. | Corregido: se normaliza a `\n` antes de medir | `0c914d8` |
| 5 | El copy del hero nacía con `opacity: 0` hasta hidratar. | Corregido: animación CSS pura (`rise-in`) | `11539ae` |
| 6 | La región `aria-live` del error estaba oculta con `:empty { display: none }`. | Corregido: contenedor siempre montado | `a8523a9`, `d8e62a7` |
| 7 | Tras "Enviar otro mensaje" el foco caía en `<body>`. | Corregido: foco al primer campo | `9427847`, `122e6fd` |
| 8 | Hero cortado en celulares apaisados. | Corregido con media queries por alto; residuo en §6 (iii) | `28dc8cc`, `67de157`, `064116a` |
| 9 | Selector de idioma bajo 24×24 px (WCAG 2.5.8). | Corregido; axe corre también `wcag22aa` | `0418123` |
| 10 | Hueco de breakpoints entre 899 y 900 px. | Corregido: `@media (width < 900px)` y guard | `e86e1e9`, `a028859` |
| 11 | Contraste del botón flotante en hover/foco (~1,98:1). | **Seguimiento** (decisión del dueño) | — |
| 12 | `aria-label` dinámico en el botón del menú. | Corregido: etiqueta constante, el estado lo da `aria-expanded` (se borra `nav.closeMenu` de los tres diccionarios) | `1bc3bdb` |
| 13 | Literales de movimiento fuera de tokens. | Corregido: tokens nuevos, CSS migrado y guard | `7f941bc`, `97ff52e`, `1e05c9a`, `ac93e3b` |
| 14 | `backdrop-filter: blur` en las ventanas del hero (rendimiento). | **Seguimiento** (decisión del dueño) | — |
| 15 | Moodboards publicados en `/ideas/`. | Corregido: movidos a `design/references/` | `b09abf1` |

Hallazgos nuevos de la ronda (aparecieron al verificar los fixes):

| Hallazgo | Estado | Commit |
|---|---|---|
| Scroll horizontal a 320 px: la columna implícita de `.work__grid` crecía al `max-content` de `.work-card` (flex column). WCAG 1.4.10. | Corregido: `minmax(0, 1fr)` | `2d5d7e2` |
| `animation-fill-mode: both` anulaba el `backdrop-filter` de los chips del hero. | Corregido: `backwards` (ver §3 b) | `d959340` |
| Formulario (y todo `Reveal`) invisible sin JS. | Corregido con `@media (scripting: none)` (ver §3 d) | `bb16815` |
| Foco tapado por el header fijo o por el botón flotante (WCAG 2.4.11). | Corregido con `scroll-padding` (ver §3 e) | `8d64394` |
| Comentarios de `scripting: none` y `section[id]` imprecisos, y un check vacuo en `tokens.test.ts`. | Corregido | `abce489` |

## 3. Decisiones técnicas que conviene no deshacer sin saber por qué

### a) `useHydrated` y la action pelada hasta hidratar

- **Qué:** `ContactForm` usa `useActionState(hydrated ? submitContact : contactAction, ...)`.
  `useHydrated` es un `useSyncExternalStore` (`false` en el servidor y durante la hidratación, `true` ya en el cliente).
- **Por qué:** un wrapper común (`async function submit(prev, fd) { try { ... } }`) pierde `$$FORM_ACTION`: React deja
  de emitir los campos ocultos (`$ACTION_REF_*`, `$ACTION_*:0`) y el form queda inerte sin JS. Por eso la server action
  va pelada hasta hidratar y el wrapper con try/catch recién después. `e2e/contact.spec.ts` verifica que el HTML inicial
  traiga esos campos y que el envío sin JS funcione.
- **Costo:** un render extra al hidratar; el try/catch no cubre el lapso previo a la hidratación.

### b) `animation-fill-mode: backwards` en `.hero__copy > *`

- **Qué:** la entrada del copy (`rise-in`) usa `backwards`, no `both` ni `forwards`.
- **Por qué:** `both`/`forwards` dejan la animación aplicada tras terminar y, en Chromium, convierten al hijo animado en
  *backdrop root*: el `backdrop-filter` de los chips (`.hero__chip`, dentro de `.hero__proof`) deja de difuminar lo que
  hay detrás. `backwards` retiene el `from` durante el delay (sin parpadeo) y el estado `to` ya es el natural. Un e2e
  exige que ningún hijo del copy conserve animaciones al terminar.
- **Costo:** `getAnimations()` ya no es determinista tras la entrada; el test de reduced-motion lee `animationName`.

### c) `EASE_LOOP` = `cubic-bezier(0.42, 0, 0.58, 1)`

- **Qué:** token propio para el loop ambiental del showcase (`alternate`, ~16 s): el keyword CSS `ease-in-out` escrito explícito.
- **Por qué:** `EASE_IN_OUT` (`0.77, 0, 0.175, 1`) está pensada para UI de ~500 ms; en un recorrido largo el pico de velocidad
  es ~2,9× mayor y se lee como tirón, no como deriva.
- **Costo:** un token más que se comporta como `ease-in-out`; `work-scroll` sigue con el literal (deuda, §6 viii).

### d) `@media (scripting: none)` no cubre una hidratación caída

- **Qué:** `[data-reveal] > *` (y los chevrones de Servicios) se muestran en su lugar final cuando el navegador reporta JS apagado.
- **Por qué:** `Reveal` arranca en `opacity: 0` y solo JS pone `data-visible`; sin JS Servicios, Trabajos, Proceso y Cierre
  (formulario incluido) quedaban invisibles, y el spec del formulario exige que funcione sin JS.
- **Costo:** soporte Chrome/Edge 120+, Firefox 113+, Safari 17+ (en los anteriores no aplica y queda el comportamiento previo,
  sin empeorar). Con JS encendido la media query no matchea: si la hidratación se rompe con JS activo, el contenido de `Reveal`
  sigue dependiendo de `data-visible` (seguimiento, §6 vii). El comentario de `globals.css` lo dice desde `abce489`.

### e) `scroll-padding` global y `section[id]` con `scroll-margin-top` negativo

- **Qué:** `html` declara `scroll-padding-top` (`--scroll-clear-top` = header + 1 rem) y `scroll-padding-bottom` (botón
  flotante + margen); `section[id]` lo cancela con `scroll-margin-top: calc(-1 * var(--scroll-clear-top))`.
- **Por qué:** sin `scroll-padding` el navegador da por visible todo lo que está dentro de la ventana, aunque esté bajo el
  header (72 px) o el botón flotante, y no scrollea al enfocar (WCAG 2.4.11). Con él solo, las anclas de la nav
  aterrizarían ~88 px más abajo; la compensación las deja al ras como antes (`e2e/home.spec.ts` lo mide).
- **Costo:** PageDown/Espacio avanzan menos (medido en la revisión: 700 a 556 px a 1280×800; dato no reproducible desde el repo).
  Alternativa evaluada: `scroll-margin` solo en elementos enfocables. Estado final en el CSS actual: `scroll-padding` global con
  la compensación en `section[id]`.

### f) El guard de movimiento y su allowlist

- **Qué:** `__tests__/design/tokens.test.ts` falla ante duraciones, delays y curvas literales en `animation*`/`transition*` de
  `globals.css`, y comprueba que cada constante de `lib/motion.ts` esté espejada en `:root` con el valor exacto.
- **Por qué:** los tokens ya existían pero el CSS los esquivaba con literales. Es un regex sobre el CSS sin comentarios, no un
  parser. La allowlist compara por igualdad exacta de la declaración normalizada: `MOTION_EXCEPTIONS` (permanentes: el
  `0.001ms` de reduced-motion y `animation: hero-progress linear both`, guiada por scroll) y `MOTION_DEBT` (deuda). Una entrada
  muerta falla y pide borrarla.
- **Costo:** no ve una duración puesta en una custom property fuera de `:root` y consumida con `var()`, ni un override de
  `--dur-*` anidado en `@media`. Renombrar una animación de la allowlist exige actualizar su entrada.

## 4. Verificación al cierre de la ronda

| Chequeo | Resultado |
|---|---|
| Tests unitarios (Vitest) | 168 tests en 31 archivos (`npm run test`, 2026-11-08). |
| Lint, `tsc`, build | Limpios (`npm run lint`, `npx tsc --noEmit`, `npm run build`; el build genera `/es`, `/en` y `/ca` sin variables de entorno), 2026-11-08. |
| E2E (Playwright, desktop + mobile) | 146 passed / 2 skipped (`npx playwright test`, ~1,2 min, 2026-11-08). Los 2 skipped son por viewport: el CTA del header se salta en mobile y el del panel del menú, en escritorio. |
| Axe | `e2e/a11y.spec.ts` escanea `/es`, `/en` y `/ca` con `wcag2a`, `wcag2aa`, `wcag22aa`; sin violaciones en el último run. |

El repo no tiene CI de tests (el único workflow es `.github/workflows/react-doctor.yml`): la verificación es local.

## 5. Checklist del merge a `main` (mergeada el 2026-11-09, `3baaff6`)

- [x] Cargar `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` en Vercel, en producción y en preview. Con
  `onboarding@resend.dev` como remitente, Resend solo entrega a la casilla dueña de la cuenta. Sin esas variables el
  formulario falla cerrado: mensaje `send_failed` con link a WhatsApp. Se cargaron el 2026-11-09 (producción 19:18Z,
  preview 19:20Z), **después** del deploy de `3baaff6` (17:25Z). Vercel aplica las variables solo a los deploys nuevos:
  hasta el redeploy del 2026-11-11 el formulario de producción fallaba cerrado y el `canonical` apuntaba a `localhost`.
  Verificado el 2026-11-11 en `https://flexora-liard.vercel.app/es`: un POST sin JS devolvió "¡Listo!" y el mail de
  prueba llegó a la casilla de `CONTACT_TO_EMAIL`.
- [x] Autorizar el deploy de Vercel para la PR del fork. Ya no aplica: la #4 se mergeó y `main` se desplegó a producción
  (`3baaff6`, 2026-11-09, estado de Vercel `success`).
- [x] Cerrar la #3 como superada por la #4. Cerrada el 2026-11-09 con un comentario que lo explica.
- [ ] Reemplazar los datos provisionales por los definitivos que entreguen los profesionales. Qué tocar en cada caso:
  - **Mail de destino del formulario:** `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` en Vercel. Con `onboarding@resend.dev`
    como remitente, Resend solo entrega a la casilla dueña de la cuenta: con otro destinatario hay que verificar un
    dominio en Resend y usarlo como remitente.
  - **Mail visible en el sitio:** está escrito en los tres diccionarios (`app/[lang]/dictionaries/{es,en,ca}.json`, clave
    `email`, hoy `info@flexoradesign.com`), no sale de una variable: es un cambio de código.
  - **WhatsApp:** `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel (hoy sin definir: se usa `DEFAULT_NUMBER` de `lib/whatsapp.ts`).
    Si se cambia el default en el código, actualizar también `__tests__/components/WhatsAppFab.test.tsx`, que lo repite.
  - Todo cambio de variable en Vercel necesita un redeploy para aplicarse (`vercel redeploy <url> --target production`).

## 6. Seguimientos conocidos (con dimensionamiento)

Esfuerzo: S = menos de una hora, M = una tarea chica con verificación, L = requiere diseño o decisión. Es una estimación.

| # | Seguimiento | Impacto | Esfuerzo |
|---|---|---|---|
| i | `og-es.png` y `og-en.png` muestran el hero viejo (se generaron el 2026-09-08, `485a04c`); solo `og-ca.png` refleja el actual y pesa 358 KB contra ~110 KB. | Vista previa al compartir en es/en desactualizada. `node scripts/capture-og.mjs` con la app corriendo regenera los tres; revisar el peso. | S |
| ii | Traducciones al catalán sin revisión de nativo. Dudas: infinitivo en botones, anglicismos ("landings"), "Fet!" como éxito, y "Fet a l'Argentina?" con signo de pregunta que viene de `main` en los tres idiomas. | Copy. | S, con un revisor nativo |
| iii | Hero a 568×320: la nota del CTA queda cortada ~15 px. Con zoom 400 % (~320×256) y en portrait diminutos el CTA queda fuera de la escena (`overflow: hidden` sobre un sticky `100dvh`). El e2e cubre seis viewports bajos (`SHORT_VIEWPORTS` en `e2e/home.spec.ts`), no estos. | Pantallas extremas; accesibilidad de reflow. | M |
| iv | El botón flotante tapa el tercer chip del hero a 360×640 y parte del botón Enviar. | Visual y de uso en celulares chicos. | S |
| v | Contraste del botón flotante en hover/foco (1,98:1) y `backdrop-filter` de las ventanas del hero (hallazgos 11 y 14). | Contraste WCAG; rendimiento a medir. | S (contraste), M (blur) |
| vi | A 412×915 y 360×640 el título de sección queda 7–8 px bajo el borde superior del header tras saltar a una ancla. Preexistente: `--section-y` mínimo es 64 px y el header mide 72 px. | Estético. | S |
| vii | Sin fallback para una hidratación caída con JS encendido (hoy solo se cubre JS apagado, §3 d). | `Reveal` queda invisible si el bundle falla. | M |
| viii | Deuda de movimiento en `MOTION_DEBT`: `breathe 6s`, `marquee 28s linear` y `work-scroll 8s ease-in-out`. Este último debería leer `var(--ease-loop)` (comportamiento idéntico); los tres necesitan un token de duración de loop. | Consistencia. | S |
| ix | `e2e/a11y.spec.ts` escanea solo al cargar: las secciones con `Reveal` aún en `opacity: 0` se saltean en el contraste. | Cobertura de axe. | S |
| x | Sin rate limit en el formulario (aceptable según su spec, §fuera de alcance). Mitigación posible: regla de Vercel Firewall sobre los POST con header `Next-Action`. | Abuso del endpoint. | M |
| xi | Sin JS el menú hamburguesa no hace nada por debajo de 900 px (se abre con estado de React y la nav de escritorio no se muestra). | Navegación sin JS en mobile. | M |
| xii | `npx tsc --noEmit` falla en un clon recién hecho hasta correr `npm run typegen` o `next build` (preexistente). | Fricción de onboarding y de un CI futuro. | S |
| xiii | `d8e62a7` está etiquetado `chore:` pero solo cambia un test y dos comentarios; `b09abf1` tiene otro email de autor. | Cosmético; no vale reescribir historia ya pusheada. | — |
| xiv | Sin JS en celulares apaisados (844×390, 667×375) el error de campo aterriza 83–88 px bajo el borde inferior (el éxito sí se ve), porque el permalink apunta a la sección y ahí el título y el copy gastan el alto antes del formulario. Arreglo posible: `id` en `<div className="contact-form">` y permalink a ese id (obliga a cambiar los 6 asserts `#contact$` del e2e). **2026-11-11:** con Nombre y Email en una fila (recomposición del cierre) el error pasó a quedar 11 px (844×390) y 5 px (667×375) bajo el borde: el texto se ve cortado, ya no fuera de pantalla. Sigue abierto. | Solo sin JS y en pantallas bajas. | S |
| xv | `.env.example` dice que `CONTACT_DRY_RUN` es "solo e2e, nunca en producción"; sigue siendo cierto, pero no aclara que el bloqueo automático solo existe en Vercel. | Documentación. | S |

### Endurecimiento del formulario (tarea 7)

- **El e2e nunca reutiliza un servidor** (`2edf03a`, `playwright.config.ts`): `reuseExistingServer: false` y el `env` del
  `webServer` fija `CONTACT_DRY_RUN=1` y vacía `RESEND_API_KEY`. Motivo: con un `npm run dev` en :3000 y una key real en
  `.env.local`, Playwright se conectaba a ese servidor sin dry run y `contact.spec.ts` mandaba ~12 mails reales por corrida.
  Next no pisa variables ya definidas (aunque sean `""`), así que `.env.local` no repone la key. Costo: con el puerto 3000
  ocupado el e2e falla de inmediato; remedio, levantar el dev en otro puerto (`npm run dev -- -p 3001`).
- **El dry run se ignora en producción de Vercel** (`4a846a3`, `lib/resend.ts`): con `VERCEL_ENV === "production"`,
  `CONTACT_DRY_RUN` no tiene efecto y se loguea `[contact] CONTACT_DRY_RUN ignorado en producción`. El log sale dos veces por
  envío porque `isDryRun()` se consulta en la action y en `sendEmail`: es una alarma de mala configuración, sin datos
  personales, y se dejó así a propósito (deduplicar con un flag de módulo escondería la alarma tras el primer request). No se
  usa `NODE_ENV`: el e2e corre `next start` (NODE_ENV=production) con dry run a propósito. **Límite:** en hosts que no son
  Vercel `VERCEL_ENV` no existe y el dry run se respeta en producción (éxito falso, leads perdidos). Además, Vercel solo
  expone `VERCEL_ENV` si el proyecto tiene activado "Automatically expose System Environment Variables" (viene activado).
- **Sin JS, el formulario vuelve a `#contact` tras enviar** (`633a0aa`, `ContactForm.tsx`):
  `useActionState(..., INITIAL_STATE, \`/${locale}#contact\`)`. Sin JS el formulario postea a ese permalink; con JS no se
  usa. React deriva `$ACTION_KEY` (`p/<locale>#contact`) del mismo string al emitir el HTML y al comparar en el postback, así
  que el estado se asocia bien (probado con un POST real: con la clave cambiada el estado se ignora). Debe ser único por
  formulario en la página y llevar el `basePath` si algún día se configura (`next.config.ts` está vacío). Verificado en
  es/en/ca con JS apagado (la URL termina en `#contact`, el mensaje queda en el viewport y los valores se conservan) y con JS
  encendido (sin warnings de hidratación en `next dev` ni `next start`, la URL no cambia). Limitación: seguimiento xiv.
