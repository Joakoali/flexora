# Formulario de contacto en la sección Closing

## Contexto

La sección `Closing` (`components/site/Closing.tsx`, `id="contact"`, "Hablemos")
es el cierre de la home: título a ancho completo, una descripción, el botón
"Escribir por WhatsApp" y el mail escrito. El footer es mínimo (logo + ©).

El spec de la home (`2026-09-07-flexora-home-design.md`, §fuera de alcance)
dejó el formulario de contacto para después. Esta es esa pieza.

El proyecto no tiene backend todavía: no hay API routes, server actions ni
servicio de email.

## Objetivo

Sumar un formulario corto como **alternativa de baja fricción** a WhatsApp,
para quien no quiere abrir WhatsApp ni su cliente de mail, y que además hace
que el sitio se vea más completo. WhatsApp sigue siendo el CTA principal.

Cada envío llega como un mail a una casilla de Flexora. No se guardan los
mensajes en ningún otro lado.

### Criterios de éxito

- Una persona completa nombre y email (lo único obligatorio), opcionalmente
  marca tipos de proyecto y escribe un mensaje, envía, y ve la confirmación.
- El mail llega a `CONTACT_TO_EMAIL` con `Reply-To` = el email de la persona.
- Funciona sin JavaScript (progressive enhancement).
- Pasa el scan de axe existente y el test de paridad de diccionarios.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Hosting | Vercel. El dominio (todavía no comprado) va a vivir en Cloudflare DNS, con los registros de Vercel en "DNS only". |
| Envío de mail | Resend (Vercel Marketplace, `resend/resend-email`) vía **API REST con `fetch`**, sin SDK. |
| Remitente sin dominio | `Flexora <onboarding@resend.dev>`. Resend solo permite enviar a la casilla dueña de la cuenta, que va a ser la casilla nueva de destino. Al comprar el dominio se verifica en Resend y se cambia `CONTACT_FROM_EMAIL`, sin tocar código. |
| Destino | Casilla nueva (a crear), configurada en `CONTACT_TO_EMAIL`. |
| Campos | Nombre, Email, "¿Qué necesitás?" (chips multi-selección) y Mensaje. Solo Nombre y Email son obligatorios. |
| Chips | Lista propia, **independiente de la sección Servicios** (que va a cambiar). |
| Ubicación | Dentro de `Closing`. |
| Anti-spam | Honeypot + tiempo mínimo. Sin dependencias ni servicios. |
| Mecanismo | Server Action + `useActionState`. |

## Fuera de alcance

- Guardar mensajes (base de datos, planilla).
- Rate limiting con almacenamiento, Vercel BotID, Cloudflare Turnstile.
- Mail de confirmación a quien escribe.
- Template HTML del mail (va en texto plano).
- Comprar y configurar el dominio, verificarlo en Resend y crear la casilla.
- Corregir el copy `closing.email` (`info@flexoradesign.com`, dominio que todavía
  no existe): se revisa aparte.
- Instalar la integración de Resend en Vercel (paso manual del dueño de la
  cuenta, ver §Configuración).

## Arquitectura

| Archivo | Responsabilidad | Depende de |
|---|---|---|
| `lib/contact.ts` (nuevo) | Lógica pura, sin I/O: `PROJECT_TYPES`, `validateContact`, `isHoneypotFilled`, `isTooFast`, `buildEmail`, tipos `ContactData` / `ContactState`. | nada |
| `lib/resend.ts` (nuevo) | `sendEmail(msg)`: un `POST https://api.resend.com/emails`. Devuelve `{ ok: boolean }`, nunca lanza. | `fetch`, env |
| `app/[lang]/actions/contact.ts` (nuevo) | Server Action `'use server'` `contactAction(prev, formData)`. Orquesta honeypot → validar → time-gate → mail → enviar. | `lib/contact`, `lib/resend` |
| `components/site/ContactForm.tsx` (nuevo) | Client component. `<form action>` con `useActionState`, campos, chips, estados. Recibe `t` (copy), `locale` y `whatsappHref` (para el link del error de envío). | action, `Button` |
| `components/site/Closing.tsx` | Nuevo layout: título a ancho completo, debajo dos columnas (contenido actual \| formulario). Sigue siendo server component. Recibe también `locale`. | `ContactForm` |
| `app/[lang]/page.tsx` | Pasa `locale` a `Closing`. | — |
| `components/ui/Button.tsx` | Acepta `type?: "button" \| "submit"` en la variante botón (default sigue siendo `"button"`). | — |
| `app/[lang]/dictionaries/{es,en}.json` | Nuevo bloque `closing.form`. | — |
| `app/globals.css` | Grid de `.closing`, estilos `.contact-form*`, token `--danger` por tema. | — |
| `.env.example` | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`. | — |
| `playwright.config.ts` | `CONTACT_DRY_RUN=1` en el entorno del `webServer`. | — |

### `lib/contact.ts`

```ts
export const PROJECT_TYPES = ["website", "landing", "ecommerce", "webapp", "mobile", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type ContactData = {
  name: string;
  email: string;
  projectTypes: ProjectType[];
  message: string;       // "" si vacío
  locale: Locale;        // de lib/i18n
};

export type FieldErrorCode = "required" | "too_long" | "invalid";
export type ContactValues = { name: string; email: string; projectTypes: string[]; message: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      errors: Partial<Record<"name" | "email" | "message", FieldErrorCode>> & { form?: "send_failed" | "too_fast" };
      values: ContactValues;
    };
```

- `validateContact(formData): { ok: true; data: ContactData } | { ok: false; errors; values }`
- `isHoneypotFilled(formData): boolean`: el honeypot `website` vino con contenido.
- `isTooFast(formData, now: number): boolean`: pasaron menos de 2 s desde el montaje del form (`startedAt`).
- `buildEmail(data): { subject: string; text: string; replyTo: string }`

Los nombres exactos de funciones y tipos pueden ajustarse en el plan; las
responsabilidades y el contrato (códigos, no textos) no.

## Flujo de datos

```
<form action={formAction}>  →  contactAction(prevState, formData)
  1. isHoneypotFilled(formData)
       sí → return { status: "success" }            // sin enviar; el bot no se entera
  2. validateContact(formData)
       errores → return { status: "error", errors, values }
  3. isTooFast(formData, Date.now())
       sí → return { status: "error", errors: { form: "too_fast" }, values }   // reintentar sin perder lo tipeado
  4. faltan RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL
       → console.error(...) ; return { status: "error", errors: { form: "send_failed" }, values }
       (en modo CONTACT_DRY_RUN no se exige RESEND_API_KEY)
  5. sendEmail({ from, to, replyTo, subject, text })
       { ok: false } → return { status: "error", errors: { form: "send_failed" }, values }
  6. return { status: "success" }
```

### Campos del formulario

| `name` del input | Tipo | Regla (servidor, tras `trim`) | Error |
|---|---|---|---|
| `name` | text | obligatorio; 1–80 caracteres | `required`, `too_long` |
| `email` | email | obligatorio; ≤254; coincide con `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `required`, `invalid` |
| `projectType` | checkbox (N) | opcional; se descartan valores fuera de `PROJECT_TYPES` y duplicados; se conserva el orden de `PROJECT_TYPES` | — |
| `message` | textarea | opcional; ≤2000 caracteres | `too_long` |
| `lang` | hidden | `locale` actual; si no es un locale válido, se usa `"es"` | — |
| `website` | text (honeypot) | debe venir vacío | — (bot) |
| `startedAt` | hidden | ms epoch, seteado en el cliente | `form: too_fast` (time-gate) |

El whitespace interno del nombre (incluidos saltos de línea) se colapsa a un
espacio, porque el nombre va al asunto del mail.

Si hay varios errores en un campo, se reporta uno solo, en el orden de la
tabla (`required` antes que `too_long`/`invalid`).

En el cliente solo se usa validación nativa (`required`, `type="email"`,
`maxLength={80|254|2000}`). No se duplica la lógica en JS.

### Anti-spam

- **Honeypot:** input `website` visualmente oculto (fuera de pantalla con CSS,
  no `display:none`), dentro de un contenedor `aria-hidden="true"`, con
  `tabIndex={-1}` y `autoComplete="off"`. Si llega con contenido no vacío, es un bot.
- **Tiempo mínimo:** `startedAt` se completa con `Date.now()` en un efecto al
  montar `ContactForm` en el cliente. No puede venir del render del servidor
  porque la página se prerenderiza en el build. Si `0 <= now - startedAt < 2000`, el envío fue demasiado rápido
  (`isTooFast`): no se asume que sea un bot (un autofill seguido de Enter también lo dispara), así que la action
  responde el error `form: "too_fast"` conservando lo tipeado. Un valor negativo
  (reloj del cliente adelantado) no se puede juzgar y se acepta.
  Si `startedAt` falta o no es un número (usuario sin JS), **no se rechaza**:
  queda solo el honeypot. Es un compromiso deliberado para no romper el caso sin JS.

### El mail

- **From:** `CONTACT_FROM_EMAIL` (default documentado: `Flexora <onboarding@resend.dev>`).
- **To:** `CONTACT_TO_EMAIL`.
- **Reply-To:** email de quien escribe.
- **Subject:** `Nuevo contacto: {name}`; si hay tipos de proyecto,
  `Nuevo contacto: {name} · {tipos separados por ", "}`.
- **Body (texto plano):**

  ```
  Nombre: {name}
  Email: {email}
  Qué necesita: {tipos separados por ", " | —}
  Idioma del sitio: {es|en}

  Mensaje:
  {message | —}
  ```

- Los tipos se escriben siempre con su etiqueta en español (del mapa
  `PROJECT_TYPE_LABELS_ES` en `lib/contact.ts`, no del diccionario), para que
  el mail sea consistente sin importar el idioma del visitante.

### `lib/resend.ts`

- Request: `POST https://api.resend.com/emails`, headers
  `Authorization: Bearer ${RESEND_API_KEY}` y `Content-Type: application/json`,
  body `{ from, to: [to], reply_to: replyTo, subject, text }`.
- Timeout de 10 s (`AbortSignal.timeout`): si Resend no responde, cuenta como fallo.
- Respuesta 2xx → `{ ok: true }`. No-2xx o excepción de `fetch` →
  `console.error` (status y cuerpo de la respuesta, nunca la API key) y `{ ok: false }`.
- **Modo sin red:** si `process.env.CONTACT_DRY_RUN === "1"`, no llama a
  `fetch`: loguea el asunto y devuelve `{ ok: true }`. Solo se usa en e2e.

## UI

### Layout

El título "HABLEMOS" está calculado para ocupar todo el ancho útil (`11.2vw`,
ver comentario en `.closing__title`), así que no entra en una columna. El
layout queda:

```
┌──────────────────── #contact ────────────────────┐
│  HABLEMOS  (ancho completo, igual que hoy)       │
│                                                  │
│  Contanos qué querés…   │  Nombre   [_________]  │
│  [Escribir por WA]      │  Email    [_________]  │
│  o por mail a …         │  ¿Qué necesitás?       │
│                         │  (chips…)              │
│                         │  Mensaje  [_________]  │
│                         │           [Enviar]     │
└──────────────────────────────────────────────────┘
```

- **≥900px** (mismo breakpoint que Work): dos columnas debajo del título.
- **<900px:** apilado: título → descripción → WhatsApp/mail → formulario.
- El `FlexField` de fondo no cambia.
- Se mantiene la animación `Reveal` existente sobre el contenido.

> **Actualización 2026-11-11: recomposición del cierre.** El diagrama y los cortes de arriba quedan como
> registro; el layout vigente es este.
>
> **Problema.** Con dos columnas iguales alineadas arriba, la introducción medía ~110 px contra un
> formulario de ~630 px: quedaban ~520 px vacíos debajo de WhatsApp/mail (medido a 1280, 1440 y 1920).
> Además el título ya no es el "HABLEMOS" de ancho completo: desde
> `2026-11-07-jerarquia-y-ritmo-design.md` es un `h2` y entra en una columna.
>
> **Layout vigente.**
>
> ```
> ┌───────────────────────── #contact ─────────────────────────┐
> │ Hablemos              │ Nombre          Email              │
> │ Contanos qué querés…  │ [____________]  [____________]     │
> │                       │ ¿Qué necesitás?  (chips…)          │
> │        (aire)         │ Mensaje                            │
> │                       │ [______________________________]   │
> │ [Escribir por WA]     │                                    │
> │ o por mail a …        │                          [Enviar]  │
> └────────────────────────────────────────────────────────────┘
> ```
>
> - **≥1100px:** dos columnas `5fr / 7fr`. La introducción toma el alto del formulario y lo reparte
>   (`align-content: space-between`): `.closing__head` (título + frase) arriba y `.closing__actions`
>   (WhatsApp, y el mail debajo) abajo, al ras del panel.
> - **<1100px:** apilado: título → frase → WhatsApp/mail → formulario a todo el ancho.
> - **Nombre y Email en una fila** cuando el panel tiene 30rem o más de ancho interno: container query
>   sobre `.contact-form`, no media query. Aplica también al panel ancho de la versión apilada (tablets);
>   en celulares en vertical siguen apilados.
> - El título pasó a ser hijo de `.closing__intro`; `.closing__grid` ya no existe (la grilla es
>   `.closing__content`). El orden del documento no cambió: título → frase → WhatsApp → mail → formulario.
>
> **Por qué 1100 y no 900.** Entre 900 y 1099 px la columna del formulario no llega a los 30rem internos:
> Nombre y Email no entran en fila y el formulario sigue midiendo ~630 px (634 px a 1080 de ancho con el
> layout anterior, que ahí dejaba 455 px de hueco). Anclar WhatsApp/mail abajo no lo arregla: el mismo
> vacío queda entre los dos bloques. 1100 ya era un corte del sitio (grilla de Trabajos).
>
> **Medidas (es; en y ca dan lo mismo).** Aire entre los dos bloques de la introducción: 326 px a 1100,
> 312 a 1280, 251 a 1440, 260 a 1920. Alto de la sección: 908 → 740 px a 1280, 931 → 711 a 1440,
> 951 → 728 a 1920. A 390 px no cambia nada (1049 px).
>
> **Consecuencias conocidas.**
>
> - La sección más el footer miden 877 px a 1920 de ancho: en una ventana más alta que eso, el ancla
>   `#contact` no llega al tope (a 1920×1080 la sección arranca 203 px más abajo). Se aceptó: contacto y
>   footer entran completos en una pantalla.
> - En el estado de éxito, en dos columnas, el panel se estira al alto de la introducción (259 px a 1440).
> - `align-items: start` en la grilla del formulario es necesario: sin él, el error de un campo estira la
>   celda vecina y su input crece de 48 a ~63 px.
>
> **Tests.** `e2e/closing.spec.ts` (apilado o dos columnas, al ras del panel y fila Nombre/Email, por
> viewport), `e2e/contact.spec.ts` ("en fila, el error de un campo no deforma al vecino") y
> `__tests__/components/Closing.test.tsx` (bloques de la introducción y orden de lectura).
>
> **Descartado por ahora.** Llenar la columna con contenido nuevo: no hay foto real en el repo y el texto
> posible repite Proceso o la marquesina. Si se consigue un testimonio real de un cliente (frase, nombre y
> empresa), va entre la frase y WhatsApp, como pieza aparte con su spec.

### Estilo

- CSS BEM + variables en `globals.css`, como el resto del sitio (no Tailwind utilities).
- Panel del formulario: fondo `--surface`, borde `1px solid var(--border)`,
  `--radius-md`, para asegurar legibilidad sobre el WebGL en ambos temas.
- Inputs y chips: borde 1px `--fg-muted` (no `--border`, que no llega al 3:1
  de WCAG 1.4.11 para componentes); foco visible con `--accent`.
- Chips: `<input type="checkbox">` nativos, visualmente ocultos, con un
  `<label>` estilizado como pastilla con borde. Checked: fondo `--accent` y
  texto de contraste. Foco visible sobre la pastilla (`:focus-visible` del input).
- Token nuevo `--danger`, definido para tema oscuro y claro, con contraste AA
  (≥4.5:1) contra `--surface` en cada tema. Se registra también en `@theme`
  como `--color-danger`, igual que los demás colores.
- Transiciones con los tokens de `lib/motion.ts` / variables CSS existentes.
  Sin duraciones ni curvas nuevas. Respeta `prefers-reduced-motion`.

### Estados

| Estado | Qué se ve |
|---|---|
| Idle | Formulario vacío. |
| Enviando | Botón con el texto `sending`, `disabled` y `aria-disabled`. Los campos siguen visibles. |
| Error de campo | Mensaje bajo cada campo con error; el input con `aria-invalid="true"` y `aria-describedby` al mensaje. Foco al primer campo con error. Los valores escritos se conservan. |
| Error de envío | Mensaje sobre el botón: `errors.send_failed` con un link a WhatsApp (`whatsappHref`). Valores conservados. |
| Éxito | El panel **reemplaza el formulario** por `successTitle` + `successBody` y un botón secundario `sendAnother` que vuelve a mostrar el formulario vacío (con un `startedAt` nuevo). El foco se mueve al título del mensaje de éxito. |

**Conservar valores:** React 19 resetea un `<form action>` después de cada
envío. Por eso la acción devuelve `values` en el estado de error y los inputs
usan `defaultValue` (y `defaultChecked` en chips) desde `state.values`.
Tiene que estar cubierto por un test.

### Accesibilidad

- Cada campo tiene `<label>` visible asociado. No se usan solo placeholders.
- `<form aria-label={t.formLabel}>`.
- Chips dentro de `<fieldset>` con `<legend>` `projectLegend` + `(opcional)`.
- La etiqueta de Mensaje también indica "(opcional)".
- Región `aria-live="polite"` para el éxito y el error de envío.
- El honeypot queda fuera del árbol de accesibilidad y del orden de tabulación.

### Copy (`closing.form`)

Claves (ES / EN). El texto final puede pulirse al implementar; las claves no.

| Clave | ES | EN |
|---|---|---|
| `formLabel` | Formulario de contacto | Contact form |
| `nameLabel` | Nombre | Name |
| `emailLabel` | Email | Email |
| `projectLegend` | ¿Qué necesitás? | What do you need? |
| `optional` | (opcional) | (optional) |
| `messageLabel` | Mensaje | Message |
| `messagePlaceholder` | Contanos un poco del proyecto | Tell us a bit about the project |
| `submit` | Enviar | Send |
| `sending` | Enviando… | Sending… |
| `successTitle` | ¡Listo! | Done! |
| `successBody` | Recibimos tu mensaje. Te respondemos en el día. | We got your message. We'll reply the same day. |
| `sendAnother` | Enviar otro mensaje | Send another message |
| `projectTypes.website` | Sitio web | Website |
| `projectTypes.landing` | Landing page | Landing page |
| `projectTypes.ecommerce` | E-commerce | E-commerce |
| `projectTypes.webapp` | Web app | Web app |
| `projectTypes.mobile` | App móvil | Mobile app |
| `projectTypes.other` | Otro | Other |
| `errors.required` | Este campo es obligatorio. | This field is required. |
| `errors.invalid` | Ingresá un email válido. | Enter a valid email. |
| `errors.too_long` | Es demasiado largo. | This is too long. |
| `errors.send_failed` | No pudimos enviarlo. Probá de nuevo o | We couldn't send it. Try again or |
| `errors.sendFailedLink` | escribinos por WhatsApp. | message us on WhatsApp. |

## Configuración

Variables de entorno (server-only, sin `NEXT_PUBLIC_`):

| Variable | Uso |
|---|---|
| `RESEND_API_KEY` | La crea la integración de Resend en Vercel. |
| `CONTACT_TO_EMAIL` | Casilla que recibe los mensajes (la de la cuenta de Resend mientras no haya dominio). |
| `CONTACT_FROM_EMAIL` | Remitente. Hoy `Flexora <onboarding@resend.dev>`; con dominio, `Flexora <contacto@dominio>`. |
| `CONTACT_DRY_RUN` | `1` solo en e2e: no envía. Nunca en producción. |

Pasos manuales (del dueño de la cuenta, fuera del código):

1. Crear la casilla de destino.
2. Instalar Resend desde Vercel Marketplace (`resend/resend-email`) con esa casilla.
3. Cargar `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` en Vercel y hacer `vercel env pull`.

## Testing (TDD)

**Unit (Vitest):**

- `__tests__/lib/contact.test.ts`: `trim`; nombre vacío, 80 y 81 caracteres;
  email vacío, inválido y 254/255; mensaje 2000/2001 y vacío; chips con valores
  inválidos, duplicados y desordenados; `lang` inválido → `es`; honeypot vacío y
  lleno; `startedAt` <2000 ms, ≥2000 ms, ausente y no numérico; `buildEmail`
  con y sin chips, y con y sin mensaje (asunto, cuerpo, `replyTo`).
- `__tests__/lib/resend.test.ts` (`fetch` mockeado): URL, headers y body
  (`reply_to`, `to` como array); no-2xx → `{ ok: false }`; `fetch` lanza →
  `{ ok: false }` sin propagar; la API key no aparece en los logs; `CONTACT_DRY_RUN=1` → no llama a `fetch`.
- `__tests__/actions/contact.test.ts` (`sendEmail` mockeado): honeypot lleno → `success`
  sin enviar; inválido → `error` con `errors` y `values`; env vars faltantes →
  `send_failed` sin enviar; envío falla → `send_failed`; ok → `success` y
  `sendEmail` recibe `from`/`to`/`replyTo` correctos.

**Componente (Testing Library):**

- `__tests__/components/ContactForm.test.tsx`: labels, fieldset/legend, 6
  checkboxes; errores con `aria-invalid`/`aria-describedby` y valores
  conservados; el éxito reemplaza el formulario y "Enviar otro mensaje" lo
  restaura vacío; honeypot con `aria-hidden` y `tabIndex=-1`; `startedAt` se
  completa al montar.
- `__tests__/components/Closing.test.tsx`: el formulario está dentro de `#contact`.
- `__tests__/components/Button.test.tsx`: `type="submit"` se respeta; default sigue siendo `"button"`.
- Paridad de diccionarios: ya cubierta por `__tests__/i18n/dictionaries-parity.test.ts`.

**E2E (Playwright, con `CONTACT_DRY_RUN=1`):**

- `e2e/contact.spec.ts`: camino feliz (completar, marcar dos chips, enviar
  después de >2 s, ver el éxito, "Enviar otro" vuelve al formulario); email
  inválido muestra el error y conserva el nombre; en ES y EN.
- `e2e/a11y.spec.ts`: sin cambios; ya escanea la home, que ahora incluye el formulario.

**Revisión visual:** `scripts/capture-review.mjs` a 1440 y 390 en ambos temas,
mirando la legibilidad del panel sobre el WebGL y el apilado en mobile.

## Cambios posteriores (2026-11-08, review de la PR #4)

El review de la PR #4 ajustó el comportamiento descrito arriba. Detalle de la
ronda: `2026-11-08-pr4-review-fixes.md`.

- **`too_fast` en vez de éxito falso por tiempo.** Antes (`isLikelyBot`) un envío
  en menos de 2 s respondía éxito falso y el lead se perdía en silencio
  (autofill + Enter, o el envío justo después de "Enviar otro mensaje", que
  reinicia `startedAt`). Ahora son dos chequeos: `isHoneypotFilled` (honeypot
  lleno → éxito falso, sin enviar) e `isTooFast` (menos de 2 s → error
  `form: "too_fast"` con los valores tipeados; el segundo intento ya pasa). El
  orden en la action es honeypot → validación → time-gate → envío, así que un
  error de campo tiene prioridad sobre `too_fast`. La UI muestra
  `errors.too_fast` sin el link a WhatsApp, que queda solo para `send_failed`.
- **Normalización CRLF.** `maxLength` del textarea cuenta cada salto de línea
  como 1 carácter, pero el navegador los envía como `\r\n` (2). La validación
  normaliza `\r\n` y `\r` a `\n` antes de medir el límite de 2000 y de armar el
  mail, para que el límite del servidor sea el mismo que el del navegador.
- **Wrapper `submitContact`, recién hidratado.** Si el POST de la action falla
  antes de llegar al servidor (sin conexión, timeout, 5xx, action ID viejo tras
  un deploy), `useActionState` re-lanza el error y, sin error boundary, se cae
  toda la página y se pierde lo escrito. `submitContact` envuelve la action con
  un `try/catch` y devuelve `send_failed` con los valores del form
  (`readContactValues`). Se activa recién cuando el componente está hidratado
  (`useHydrated`, con `useSyncExternalStore`: `false` en el servidor y durante
  la hidratación, `true` en el cliente); hasta entonces va la server action
  pelada. **Por qué:** un wrapper común pierde `$$FORM_ACTION`: React deja de
  emitir los campos ocultos de la server action y el envío sin JS (o antes de
  hidratar) queda inerte. `e2e/contact.spec.ts` verifica que el HTML inicial
  traiga esos campos.
- **Región `aria-live` siempre montada.** El contenedor `aria-live="polite"` del
  error de envío existe siempre y vacío no ocupa lugar; el `<p>` con el mensaje
  se renderiza solo cuando hay error. Antes estaba `:empty { display: none }`,
  así que salía del árbol de accesibilidad y, al aparecer el mensaje, nacía con
  contenido y los lectores de pantalla no lo anunciaban. Un test sobre el CSS
  veda `display: none`, `visibility: hidden` y `:empty` en esa región.
- **Foco tras "Enviar otro mensaje".** El botón enfocado se desmonta, así que el
  foco caía en `<body>`: ahora va al primer campo (Nombre). Solo en esa
  transición (`focusNameOnMount`): en la primera carga, o al llegar por
  `#contact`, no se le roba el foco a la página.
- **Visible sin JavaScript.** `Closing` está dentro de `Reveal`, que arranca en
  `opacity: 0` y solo con JS recibe `data-visible`: sin JS el formulario
  quedaba invisible, aunque el spec exige que funcione sin JS. El fallback es
  `@media (scripting: none)` en `app/globals.css`, que lo muestra en su lugar
  final. No cubre una hidratación caída con JS encendido.
- **Foco no tapado.** `html` declara `scroll-padding` arriba y abajo (header
  fijo y botón flotante de WhatsApp) para que el campo enfocado no quede
  debajo de ninguno de los dos (WCAG 2.4.11); lo cubre `e2e/contact.spec.ts`.
- **Volver a `#contact` sin JavaScript.** `useActionState` recibe como permalink
  `/${locale}#contact`: sin JS el formulario postea ahí y, tras enviar, la página
  queda en el formulario en vez de volver al tope. Con JS no se usa. En
  pantallas bajas (844×390) el error de campo aterriza unos 88 px bajo el borde
  inferior (sin JS no hay forma de enfocar el campo): seguimiento xiv del doc
  de la ronda.
- **El dry run no vale en producción de Vercel.** `CONTACT_DRY_RUN` se ignora
  (y se loguea) cuando `VERCEL_ENV` es `production`; en otros hosts esa variable
  no existe y el dry run se respeta. Las variables de entorno de la tabla de
  arriba y la configuración de Playwright de este spec describen el estado
  original: la vigente está en `CLAUDE.md` y en el doc de la ronda.
- **El e2e nunca reutiliza un servidor.** La config de Playwright usa
  `reuseExistingServer: false`, fija `CONTACT_DRY_RUN=1` y vacía
  `RESEND_API_KEY`, para que ninguna corrida pueda mandar mails reales.

Detalle, motivos y seguimientos de toda la ronda:
`docs/superpowers/specs/2026-11-08-pr4-review-fixes.md`.
