# Formulario de contacto: email, WhatsApp o los dos

## Contexto

El formulario de contacto (`components/site/ContactForm.tsx`, spec
`2026-09-29-contact-form-design.md`) pide Nombre y Email como obligatorios,
"¿Qué necesitás?" (chips) y Mensaje como opcionales. Cada envío llega como mail a
`CONTACT_TO_EMAIL` con `Reply-To` = el email de la persona.

Hay gente que prefiere dejar su WhatsApp y no su mail. Hoy no puede.

## Objetivo

Que la persona deje **su email, su WhatsApp o los dos**, con al menos uno
obligatorio. El equipo solo necesita los datos para responder: no se registra
una preferencia de canal. Si deja los dos, el equipo elige por dónde responder.

### Criterios de éxito

- Se puede enviar con solo Email, con solo WhatsApp o con los dos. Sin ninguno
  de los dos, el formulario muestra un único error para el par.
- Un número español escrito sin prefijo (`604 16 48 97`) llega como
  `+34604164897`. Un número de otro país sin prefijo se rechaza con un mensaje
  que pide el prefijo.
- El mail trae el WhatsApp con un link `wa.me` para abrir el chat con un toque.
  Sin email, el mail sale sin `Reply-To`.
- Sigue funcionando sin JavaScript, incluido el error de "al menos uno".
- Pasan el test de paridad de diccionarios, el scan de axe y los e2e de layout
  del cierre (`e2e/closing.spec.ts`) con la fila compartida ahora entre Email
  y WhatsApp.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Qué elige la persona | Solo qué datos deja. Sin preferencia de canal. |
| Interacción | Los dos campos siempre a la vista, cada uno opcional, regla "al menos uno". Se descartaron un selector de canal que revela campos (un paso más, el form salta, estados raros con campos ocultos) y un campo único "email o WhatsApp" (no permite los dos). |
| Mercado | Casi todo España. Sin prefijo se asume +34 si el número tiene forma de número español. Con `+` o `00` se respeta el prefijo. |
| Dónde se valida "al menos uno" | Solo en el servidor (HTML no tiene una regla nativa para eso). Igual con y sin JS. |
| Layout | Nombre a todo el ancho; debajo, un grupo "¿Cómo te contactamos? (uno o los dos)" con Email y WhatsApp lado a lado. Aprobado sobre capturas de un mockup inyectado en la página real (1440, 1100, 768 y 390 px, oscuro y claro, con los dos errores). |
| Formato del número en el mail | `+` y los dígitos (`+34604164897`), sin agrupar. |

## Fuera de alcance

- Selector de país o de prefijo.
- Verificar que el número tenga WhatsApp.
- Preferencia de canal ("respondeme por…").
- Formatear el número en el mail más allá de `+` y los dígitos.
- Mail de confirmación a quien escribe.
- El aire de la columna izquierda del cierre a partir de 1100 px: crece con el
  formulario (ver §UI, Impacto en el layout). Si molesta, se ve aparte.

## Arquitectura

| Archivo | Cambio |
|---|---|
| `lib/contact.ts` | Campo `whatsapp`, `normalizeWhatsapp`, reglas nuevas de `validateContact`, `buildEmail` con WhatsApp y `replyTo` opcional, tipos. |
| `lib/resend.ts` | `EmailMessage.replyTo` opcional; `reply_to` solo va al body si hay `replyTo`. |
| `app/[lang]/actions/contact.ts` | Usa `result.values` para volver a llenar el form (`too_fast`, `send_failed`). Sale el `eslint-disable` que descartaba `locale`. |
| `components/site/ContactForm.tsx` | Nombre a todo el ancho, `fieldset` con Email y WhatsApp, error del par, foco. |
| `app/globals.css` | `.contact-form__pair` (dos columnas por container query) reemplaza a `.contact-form__field--half`; la grilla del form vuelve a una columna. |
| `app/[lang]/dictionaries/{es,en,ca}.json` | Claves nuevas en `closing.form` (ver §Copy). |
| Tests | Ver §Testing. |
| Docs | `CLAUDE.md`, `README.md` y nota fechada en `2026-09-29-contact-form-design.md` (ver §Docs). |

## Datos y validación (`lib/contact.ts`)

### Tipos

```ts
export const LIMITS = { name: 80, email: 254, whatsapp: 30, message: 2000 } as const;

export type ContactField = "name" | "email" | "whatsapp" | "message";
export type FieldErrorCode = "required" | "too_long" | "invalid" | "invalid_phone";
export type ReachErrorCode = "need_one";
export type FormErrorCode = "send_failed" | "too_fast";
export type ContactErrors = Partial<Record<ContactField, FieldErrorCode>> & {
  reach?: ReachErrorCode; // ni email ni WhatsApp
  form?: FormErrorCode;
};

/** Lo que la persona escribió, tal cual (sin validar): para volver a llenar el form. */
export type ContactValues = {
  name: string;
  email: string;
  whatsapp: string;
  projectTypes: ProjectType[];
  message: string;
};

/** Lo validado, listo para el mail. */
export type ContactData = {
  name: string;
  email: string | null;    // null si no lo dejó
  whatsapp: string | null; // normalizado, solo dígitos con código de país ("34604164897"); null si no lo dejó
  projectTypes: ProjectType[];
  message: string;
  locale: Locale;
};

export function validateContact(
  formData: FormData,
):
  | { ok: true; data: ContactData; values: ContactValues }
  | { ok: false; errors: ContactErrors; values: ContactValues };
```

`readContactValues` suma `whatsapp: text(formData, "whatsapp")` (recortado, sin
otra transformación).

### `normalizeWhatsapp(raw: string): string | null`

Función pura exportada. Recibe el valor ya recortado y no vacío. Devuelve los
dígitos con código de país, o `null` si no es un número aceptable.

1. Si `raw.length > LIMITS.whatsapp` → `null`.
2. `compact` = `raw` sin espacios, puntos, guiones ni paréntesis
   (`/[\s().-]/g`).
3. Si `compact` no cumple `^\+?\d+$` → `null` (letras, `+` en el medio, otros
   símbolos).
4. Prefijo, mirando `compact` (`digits` = `compact` sin el `+` inicial):
   - `compact` empieza con `+` → `intl` = `digits`.
   - `compact` empieza con `00` → `intl` = `digits` sin el `00` inicial.
   - Si no, no tiene prefijo: si `digits` cumple `^[6-9]\d{8}$` → devuelve
     `"34" + digits`. Si no → `null`.
5. `intl` tiene que cumplir `^[1-9]\d{7,14}$` (8 a 15 dígitos en total, E.164, el
   código de país no empieza con 0). Si no → `null`.
6. Si `intl` empieza con `34`, tiene que cumplir `^34[6-9]\d{8}$`. Si no → `null`.
7. Devuelve `intl`.

| Entrada | Resultado |
|---|---|
| `+34 604 16 48 97` | `34604164897` |
| `0034 604164897` | `34604164897` |
| `(+34) 604-164-897` | `34604164897` |
| `604 164 897` | `34604164897` |
| `912 345 678` | `34912345678` |
| `+54 9 11 2345-6789` | `5491123456789` |
| `+1 (555) 123-4567` | `15551234567` |
| `+34 60416489` (8 dígitos) | `null` |
| `11 2345 6789` (sin prefijo, no español) | `null` |
| `34604164897` (sin `+`) | `null` |
| `512 345 678` (sin prefijo, empieza con 5) | `null` |
| `+1234567` (7 dígitos) | `null` |
| `+1234567890123456` (16 dígitos) | `null` |
| `604 ABC 897` | `null` |
| `6+04164897` | `null` |

### Reglas de `validateContact`

| Campo | Regla | Error |
|---|---|---|
| Nombre | Obligatorio, ≤ 80 (sin cambios) | `required` / `too_long` |
| Email | Opcional. Si viene: ≤ 254 y la regex actual | `invalid` |
| WhatsApp | Opcional. Si viene: `normalizeWhatsapp` ≠ `null` | `invalid_phone` |
| Email y WhatsApp vacíos los dos | — | `reach: "need_one"` |
| Mensaje | ≤ 2000 tras normalizar CRLF (sin cambios) | `too_long` |

- `need_one` aparece **solo** cuando los dos están vacíos. Si uno está escrito y
  mal, se muestra el error de ese campo y no `need_one`.
- Los errores de distintos campos conviven (Nombre vacío + `need_one`, Email
  inválido + WhatsApp inválido, etc.).
- En éxito, `data.email` es el email o `null`, y `data.whatsapp` es el número
  normalizado o `null`. `values` siempre es lo tipeado.

## Action (`app/[lang]/actions/contact.ts`)

El orden no cambia: honeypot → validación → time-gate → envío. Cambia solo de
dónde salen los valores para volver a llenar el form:

```ts
const result = validateContact(formData);
if (!result.ok) return { status: "error", errors: result.errors, values: result.values };
if (isTooFast(formData, Date.now()))
  return { status: "error", errors: { form: "too_fast" }, values: result.values };
const failed: ContactState = { status: "error", errors: { form: "send_failed" }, values: result.values };
// ... chequeo de env y sendEmail({ from, to, ...buildEmail(result.data) }) igual que hoy
```

Así, tras `too_fast` o `send_failed`, el WhatsApp vuelve como la persona lo
escribió (`604 16 48 97`) y no normalizado. Sale el
`eslint-disable` + `const { locale: _locale, ...values }`.

## UI (`components/site/ContactForm.tsx` + `app/globals.css`)

### Estructura

Orden del form: honeypot y ocultos (sin cambios) → **Nombre** (a todo el ancho)
→ **grupo de contacto** → ¿Qué necesitás? → Mensaje → estado + Enviar.

```html
<fieldset class="contact-form__group">
  <legend class="contact-form__label">
    {reachLegend} <span class="contact-form__optional">{reachHint}</span>
  </legend>
  <div class="contact-form__pair">
    <div class="contact-form__field"><!-- Email --></div>
    <div class="contact-form__field"><!-- WhatsApp --></div>
  </div>
  <!-- solo con errors.reach: -->
  <p id="{id}-reach-error" class="contact-form__error">{errors.need_one}</p>
</fieldset>
```

- Mismo patrón visual que "¿Qué necesitás?" (`fieldset` + `legend` con la
  aclaración en gris).
- **Email**: igual que hoy pero **sin `required`**. Sigue `type="email"`, así que
  el navegador valida el formato si se escribe algo.
- **WhatsApp**: `name="whatsapp"`, `type="tel"`, `autoComplete="tel"`,
  `maxLength={LIMITS.whatsapp}`, `placeholder={t.whatsappPlaceholder}`,
  `defaultValue={values?.whatsapp}`. Sin `required` y sin `pattern` (el mensaje
  nativo saldría en el idioma del navegador; la validación es del servidor).
- **Nombre**: deja de usar `.contact-form__field--half`.

### Errores y foco

- `invalid_phone`: `<p id="{id}-whatsapp-error">` debajo del input de WhatsApp,
  igual que los demás errores de campo (`aria-invalid` + `aria-describedby`).
- `need_one`: los dos inputs (Email y WhatsApp) con `aria-invalid="true"` y
  `aria-describedby="{id}-reach-error"`. El mensaje va una sola vez, debajo del
  par. Nunca coincide con un error propio de esos campos (ver reglas).
- Foco tras un error: el primer campo con problema en el orden
  Nombre → Email → WhatsApp → Mensaje, donde Email cuenta como "con problema"
  también cuando hay `errors.reach`. Ejemplo: Nombre vacío + `need_one` → foco
  en Nombre; solo `need_one` → foco en Email.

### CSS

- La grilla de `.contact-form__form` vuelve a ser de una columna (sale el
  `grid-template-columns` de la container query y las reglas
  `> * { grid-column: 1 / -1 }` y `> .contact-form__field--half`).
- Nuevo `.contact-form__pair`: `display: grid; gap: var(--contact-gap)`. Con
  `@container (min-width: 30rem)` (el mismo corte que hoy, sobre
  `.contact-form`): `grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start`. `align-items: start` se mantiene por la misma razón que
  hoy: un error en un campo no estira el input del vecino.
- Se actualiza el comentario que explica la fila (hoy habla de Nombre y Email).
- Sin tokens de motion nuevos.

### Impacto en el layout

Medido en el mockup: a 1440 px el panel pasa de 486 a 622 px (+136). A partir
de 1100 px la columna izquierda copia ese alto (`align-content:
space-between`), así que el aire entre la frase y "Escribir por WhatsApp" crece
de ~260 a ~400 px. Es el comportamiento del layout actual; queda fuera de
alcance ajustarlo.

## Copy (`closing.form`)

Claves nuevas, en los tres diccionarios. `successBody` ("Te respondemos en el
día") no cambia: vale para los dos canales.

| Clave | es | en | ca |
|---|---|---|---|
| `reachLegend` | ¿Cómo te contactamos? | How should we reach you? | Com et contactem? |
| `reachHint` | (uno o los dos) | (one or both) | (un o tots dos) |
| `whatsappLabel` | WhatsApp | WhatsApp | WhatsApp |
| `whatsappPlaceholder` | +34 600 000 000 | +34 600 000 000 | +34 600 000 000 |
| `errors.need_one` | Dejanos un mail o un WhatsApp para poder responderte. | Leave an email or a WhatsApp number so we can get back to you. | Deixa'ns un correu o un WhatsApp per poder respondre't. |
| `errors.invalid_phone` | Revisá el número. Si no es de España, empezá con el prefijo del país (+54…). | Check the number. If it isn't Spanish, start with the country code (+44…). | Revisa el número. Si no és d'Espanya, comença amb el prefix del país (+33…). |

## El mail (`buildEmail` y `lib/resend.ts`)

```
Nombre: Ana Pérez
Email: ana@ejemplo.com
WhatsApp: +34604164897 · https://wa.me/34604164897
Qué necesita: Landing page
Idioma del sitio: es

Mensaje:
…
```

- `Email: —` si no hay email; `WhatsApp: —` si no hay WhatsApp.
- El asunto no cambia (`Nuevo contacto: {nombre}` + ` · {tipos}`).
- `buildEmail` devuelve `{ subject, text, replyTo? }`: `replyTo` solo si hay
  email.
- `EmailMessage.replyTo` pasa a `replyTo?: string`. `sendEmail` incluye
  `reply_to` en el body JSON solo si `msg.replyTo` existe.
- El link se arma solo con dígitos ya normalizados: no hay forma de inyectar
  nada en la URL.

## Testing (TDD)

**Unit (`__tests__/`)**

- `lib/contact.test.ts`
  - `normalizeWhatsapp`: todos los casos de la tabla de §Datos y validación.
  - `validateContact`: solo Email → ok, `whatsapp: null`; solo WhatsApp → ok,
    `email: null`; los dos → ok; ninguno → `reach: "need_one"` y ningún error
    de campo en Email/WhatsApp; Email inválido + WhatsApp vacío → solo
    `email: "invalid"`; Email vacío + WhatsApp inválido → solo
    `whatsapp: "invalid_phone"`; Nombre vacío + ninguno → `name` y `reach`;
    `values.whatsapp` es lo tipeado; `data.whatsapp` es lo normalizado.
  - `buildEmail`: línea de WhatsApp con link; `—` en cada canal ausente;
    `replyTo` presente solo con email.
  - `readContactValues` incluye `whatsapp`.
- `lib/resend.test.ts`: sin `replyTo`, el body enviado no tiene `reply_to`; con
  `replyTo`, sí (el caso existente).
- `actions/contact.test.ts`: envío con solo WhatsApp → `sendEmail` llamado sin
  `replyTo` y éxito; ninguno de los dos → `need_one` sin llamar a `sendEmail`;
  `too_fast` y `send_failed` devuelven el WhatsApp tal cual se tipeó.
- `components/ContactForm.test.tsx`: `fieldset` con nombre accesible
  `reachLegend`; Email sin `required` (reemplaza la aserción actual sobre
  `required`, que queda solo para Nombre); input WhatsApp `type="tel"`; con
  `need_one`: los dos inputs con `aria-invalid` y `aria-describedby` al mismo
  mensaje, y foco en Email; con `invalid_phone`: mensaje asociado al WhatsApp;
  valores vueltos a llenar, incluido WhatsApp.
- `i18n/dictionaries-parity.test.ts` y `design/tokens.test.ts`: sin cambios,
  tienen que seguir pasando.

**e2e (`e2e/`)**

- `contact.spec.ts`
  - En el loop por idioma: envío con Nombre + solo WhatsApp → éxito.
  - En `sin JavaScript`, por idioma: Nombre sin Email ni WhatsApp → la página
    vuelve a `#contact` con `errors.need_one` a la vista y el Nombre conservado.
  - `contacto: en fila, el error de un campo no deforma al vecino`: pasa a medir
    el par Email/WhatsApp. Email válido + WhatsApp `11 2345 6789` →
    `invalid_phone`; Email conserva su alto, los dos inputs siguen alineados.
    Precondición: WhatsApp a la derecha de Email.
  - El resto de los tests sigue igual (llenan Nombre + Email, que sigue siendo
    válido).
- `closing.spec.ts`: `measure` suma `whatsapp`. Los tests "Nombre y Email
  comparten fila" / "van apilados" pasan a "Email y WhatsApp comparten fila" /
  "van apilados", con los mismos anchos (`fila` desde 768, `apilados` a 390), y
  se suma que Nombre ocupa el ancho del par (mismo borde izquierdo que Email,
  mismo borde derecho que WhatsApp, ±2 px). Los tests de dos columnas y apilado
  de la introducción no cambian.
- `a11y.spec.ts`: sin cambios, cubre el `fieldset` nuevo en el scan de carga.

## Docs

- `CLAUDE.md`
  - Párrafo *Contact form*: Email o WhatsApp, al menos uno (`reach: "need_one"`);
    `normalizeWhatsapp` en la lista de funciones de `lib/contact.ts`; `replyTo`
    solo con email.
  - Párrafo *Closing layout*: la fila compartida pasa a ser Email/WhatsApp
    (`.contact-form__pair`), Nombre va a todo el ancho; se mantiene la nota de
    `align-items: start`.
  - Sección Testing: actualizar la descripción de `closing.spec.ts` (fila
    Email/WhatsApp).
- `README.md` (§Documentación): sumar este spec.
- `2026-09-29-contact-form-design.md`: sección final
  "Cambios posteriores (2026-11-20, email o WhatsApp)" que resuma el cambio y
  apunte a este spec.
