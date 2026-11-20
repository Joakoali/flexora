# Formulario con email, WhatsApp o los dos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el formulario de contacto acepte email, WhatsApp o los dos (al menos uno), con el WhatsApp normalizado y un link `wa.me` en el mail.

**Architecture:** La lógica pura vive en `lib/contact.ts`: `normalizeWhatsapp`, la regla "al menos uno" como error del par (`errors.reach`) y `buildEmail` con WhatsApp. `lib/resend.ts` manda `reply_to` solo si hay email. La server action vuelve a llenar el form con lo tipeado. `ContactForm` suma un `fieldset` con Email y WhatsApp lado a lado (container query), y Nombre pasa a todo el ancho. Sin JS funciona igual: la regla la valida el servidor.

**Tech Stack:** Next.js 16 App Router (Server Actions), React 19 (`useActionState`), TypeScript estricto, Vitest + Testing Library (jsdom), Playwright, CSS plano BEM en `app/globals.css`.

**Spec:** `docs/superpowers/specs/2026-11-20-contact-reach-design.md`

## Global Constraints

- Rama: `feature/contact-reach` (ya creada, con el spec commiteado). No trabajar en `main`.
- Leer `AGENTS.md` antes de tocar código de Next. Este cambio no usa APIs nuevas de Next.
- **Sin dependencias nuevas.**
- `LIMITS = { name: 80, email: 254, whatsapp: 30, message: 2000 }`.
- Códigos de error: campo `"required" | "too_long" | "invalid" | "invalid_phone"`, par `reach: "need_one"`, form `"send_failed" | "too_fast"`. La action devuelve códigos, nunca textos.
- `whatsapp` normalizado = solo dígitos con código de país, sin `+` (`"34604164897"`).
- Copy exacto, en los tres diccionarios (`app/[lang]/dictionaries/{es,en,ca}.json`, dentro de `closing.form`):

  | Clave | es | en | ca |
  |---|---|---|---|
  | `whatsappLabel` | WhatsApp | WhatsApp | WhatsApp |
  | `whatsappPlaceholder` | +34 600 000 000 | +34 600 000 000 | +34 600 000 000 |
  | `reachLegend` | ¿Cómo te contactamos? | How should we reach you? | Com et contactem? |
  | `reachHint` | (uno o los dos) | (one or both) | (un o tots dos) |
  | `errors.need_one` | Dejanos un mail o un WhatsApp para poder responderte. | Leave an email or a WhatsApp number so we can get back to you. | Deixa'ns un correu o un WhatsApp per poder respondre't. |
  | `errors.invalid_phone` | Revisá el número. Si no es de España, empezá con el prefijo del país (+54…). | Check the number. If it isn't Spanish, start with the country code (+44…). | Revisa el número. Si no és d'Espanya, comença amb el prefix del país (+33…). |

- CSS: BEM en `app/globals.css` con los tokens existentes. No agregar `transition`/`animation` (lo vigila `__tests__/design/tokens.test.ts`).
- `tsconfig.json` incluye los tests: **cada tarea termina con `npx tsc --noEmit` limpio**, además de `npm run test` y `npm run lint`.
- Unit: `npx vitest run <archivo>`. Suite: `npm run test`. e2e: `npm run e2e` (hace build + start en el puerto 3000; tiene que estar libre: `lsof -i :3000` no debe devolver nada).
- Commits en español (`feat: …`, `test: …`, `docs: …`), terminando con una línea en blanco y `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

Cosas que el spec no nombra pero que le pueden romper la experiencia a una persona real. Cada una tiene su test en la tarea dueña:

1. **Autofill del teléfono.** `autocomplete="tel"` completa con formatos variados (`+34 604 16 48 97`, `604164897`, `(+34) 604-164-897`), y todos tienen que pasar. Tests en Task 1.
2. **Teclado móvil sin `+` a mano.** `0034…` tiene que valer igual que `+34…`. Test en Task 1.
3. **`reply_to` vacío.** Si se mandara `reply_to: ""` cuando no hay email, Resend respondería 422 y el lead se perdería. Lo esperado es que la clave no viaje. Test en Task 2.
4. **Un email válido no tapa un número roto.** Con email bien y WhatsApp mal, hay que mostrar `invalid_phone`: el equipo respondería a un número equivocado. Test en Task 2.
5. **Foco con varios errores.** Nombre vacío + `need_one` → el foco va al Nombre. Solo `need_one` → al Email. Test en Task 3.
6. **Sin JS, el error del par a la vista.** Tras el POST la página vuelve a `#contact` y `need_one` se ve entero. e2e en Task 4.
7. **Revisión visual (la hace el controlador después de Task 4):** capturas reales a 1440, 1100, 768 y 390 px en los dos temas, comparadas con el mockup aprobado.

---

## File Structure

| Archivo | Responsabilidad en este cambio | Tarea |
|---|---|---|
| `lib/contact.ts` | `normalizeWhatsapp`; tipos; `readContactValues` y `validateContact` con WhatsApp y "al menos uno"; `buildEmail` con WhatsApp y `replyTo` opcional | 1, 2 |
| `lib/resend.ts` | `replyTo?`; `reply_to` solo si existe | 2 |
| `app/[lang]/actions/contact.ts` | Volver a llenar el form con `result.values` | 2 |
| `app/[lang]/dictionaries/{es,en,ca}.json` | Copy nuevo | 2 |
| `components/site/ContactForm.tsx` | Nombre a todo el ancho, `fieldset` Email/WhatsApp, error del par, foco | 3 |
| `app/globals.css` | `.contact-form__pair` reemplaza a `.contact-form__field--half` | 3 |
| `__tests__/lib/contact.test.ts` | Tests de lo anterior | 1, 2 |
| `__tests__/lib/resend.test.ts` | Sin `reply_to` | 2 |
| `__tests__/actions/contact.test.ts` | Solo WhatsApp, `need_one`, lo tipeado vuelve al form | 2 |
| `__tests__/components/ContactForm.test.tsx` | Fixtures (Task 2); grupo, errores, foco (Task 3) | 2, 3 |
| `e2e/contact.spec.ts`, `e2e/closing.spec.ts` | Envío con solo WhatsApp, `need_one` sin JS, fila Email/WhatsApp | 4 |
| `CLAUDE.md`, `README.md`, `docs/superpowers/specs/2026-09-29-contact-form-design.md` | Docs | 4 |

---

### Task 1: `normalizeWhatsapp`

Función pura, nueva y sin consumidores todavía. No cambia ningún tipo existente.

**Files:**
- Modify: `lib/contact.ts` (`LIMITS` y una función nueva al final del archivo)
- Test: `__tests__/lib/contact.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `export function normalizeWhatsapp(raw: string): string | null` y `LIMITS.whatsapp === 30`. La Task 2 la usa dentro de `validateContact`.

- [ ] **Step 1: Write the failing test**

En `__tests__/lib/contact.test.ts`, sumá `LIMITS` y `normalizeWhatsapp` al import de `@/lib/contact`:

```ts
import {
  LIMITS,
  buildEmail,
  isHoneypotFilled,
  isTooFast,
  normalizeWhatsapp,
  readContactValues,
  validateContact,
  type ContactData,
} from "@/lib/contact";
```

Y agregá este bloque al final del archivo:

```ts
describe("normalizeWhatsapp", () => {
  it.each([
    ["+34 604 16 48 97", "34604164897"],
    ["0034 604164897", "34604164897"],
    ["(+34) 604-164-897", "34604164897"],
    ["604 164 897", "34604164897"],
    ["912 345 678", "34912345678"],
    ["+54 9 11 2345-6789", "5491123456789"],
    ["+1 (555) 123-4567", "15551234567"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizeWhatsapp(raw)).toBe(expected);
  });

  it.each([
    ["+34 60416489", "un +34 con 8 dígitos"],
    ["11 2345 6789", "sin prefijo y no es español"],
    ["34604164897", "código de país sin +"],
    ["512 345 678", "sin prefijo, empieza con 5"],
    ["+1234567", "7 dígitos"],
    ["+1234567890123456", "16 dígitos"],
    ["604 ABC 897", "letras"],
    ["6+04164897", "+ en el medio"],
  ])("%s → null (%s)", (raw) => {
    expect(normalizeWhatsapp(raw)).toBeNull();
  });

  it("mide el largo crudo: 30 caracteres pasa, 31 → null aunque los dígitos sirvan", () => {
    expect(LIMITS.whatsapp).toBe(30);
    expect(normalizeWhatsapp(`+34${" ".repeat(18)}604164897`)).toBe("34604164897");
    expect(normalizeWhatsapp(`+34${" ".repeat(19)}604164897`)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/contact.test.ts`
Expected: FAIL con `normalizeWhatsapp is not a function` (o un error de import), y `LIMITS.whatsapp` en `undefined`.

- [ ] **Step 3: Write minimal implementation**

En `lib/contact.ts`, reemplazá la línea de `LIMITS`:

```ts
export const LIMITS = { name: 80, email: 254, whatsapp: 30, message: 2000 } as const;
```

Y agregá al final del archivo:

```ts
/**
 * Normaliza el WhatsApp que escribió la persona a dígitos con código de país ("34604164897"), o null si no
 * es un número aceptable. Recibe el valor ya recortado y no vacío.
 * Casi todos escriben desde España: sin prefijo solo se acepta un número español (9 dígitos que empiezan
 * con 6-9) y se le suma el 34. Un número de otro país sin prefijo no se puede adivinar y se rechaza.
 */
export function normalizeWhatsapp(raw: string): string | null {
  if (raw.length > LIMITS.whatsapp) return null;
  // Separadores habituales (espacios, puntos, guiones, paréntesis): se descartan.
  const compact = raw.replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  const digits = compact.replace(/^\+/, "");
  let intl: string;
  if (compact.startsWith("+")) intl = digits;
  else if (digits.startsWith("00")) intl = digits.slice(2);
  else return /^[6-9]\d{8}$/.test(digits) ? `34${digits}` : null;

  // E.164: hasta 15 dígitos contando el código de país, que nunca empieza con 0. Menos de 8 no es un número real.
  if (!/^[1-9]\d{7,14}$/.test(intl)) return null;
  // Un +34 tiene que ser un número español completo: atrapa el dígito de menos o de más.
  if (intl.startsWith("34") && !/^34[6-9]\d{8}$/.test(intl)) return null;
  return intl;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/contact.test.ts`
Expected: PASS (los tests viejos siguen en verde).

Run: `npx tsc --noEmit && npm run lint`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/contact.ts __tests__/lib/contact.test.ts
git commit -m "feat: normalizeWhatsapp para el WhatsApp del formulario

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Contrato de datos, validación, mail, action y copy

Email pasa a ser opcional, se suma `whatsapp` y aparece la regla "al menos uno". El mail lleva el WhatsApp y `Reply-To` solo si hay email. El copy entra entero acá porque `FieldErrorCode` ahora incluye `invalid_phone` y `ContactForm` indexa `t.errors[code]`: sin esa clave en el diccionario, `tsc` falla. La UI no cambia todavía: tras esta tarea el form sigue mostrando Nombre/Email como hoy (Email todavía `required` en el HTML).

**Files:**
- Modify: `lib/contact.ts` (tipos, `readContactValues`, `validateContact`, `buildEmail`)
- Modify: `lib/resend.ts`
- Modify: `app/[lang]/actions/contact.ts`
- Modify: `app/[lang]/dictionaries/es.json`, `en.json`, `ca.json`
- Test: `__tests__/lib/contact.test.ts`, `__tests__/lib/resend.test.ts`, `__tests__/actions/contact.test.ts`, `__tests__/components/ContactForm.test.tsx` (solo fixtures)

**Interfaces:**
- Consumes: `normalizeWhatsapp(raw: string): string | null` y `LIMITS.whatsapp` (Task 1).
- Produces (los usa la Task 3):
  ```ts
  export type ContactField = "name" | "email" | "whatsapp" | "message";
  export type FieldErrorCode = "required" | "too_long" | "invalid" | "invalid_phone";
  export type ReachErrorCode = "need_one";
  export type ContactErrors = Partial<Record<ContactField, FieldErrorCode>> & { reach?: ReachErrorCode; form?: FormErrorCode };
  export type ContactValues = { name: string; email: string; whatsapp: string; projectTypes: ProjectType[]; message: string };
  export type ContactData = { name: string; email: string | null; whatsapp: string | null; projectTypes: ProjectType[]; message: string; locale: Locale };
  validateContact(formData): { ok: true; data: ContactData; values: ContactValues } | { ok: false; errors: ContactErrors; values: ContactValues };
  buildEmail(data: ContactData): { subject: string; text: string; replyTo?: string };
  // lib/resend.ts
  export type EmailMessage = { from: string; to: string; replyTo?: string; subject: string; text: string };
  ```
  Diccionario `closing.form`: `whatsappLabel`, `whatsappPlaceholder`, `reachLegend`, `reachHint`, `errors.invalid_phone`, `errors.need_one`.

- [ ] **Step 1: Write the failing tests — `__tests__/lib/contact.test.ts`**

1. Sumá `type ContactErrors` al import de `@/lib/contact`.

2. En `describe("readContactValues")`:
   - En el primer test, las dos expectativas suman `whatsapp: ""` después de `email`:
     ```ts
     expect(readContactValues(fd({}))).toEqual({ name: "", email: "", whatsapp: "", projectTypes: [], message: "" });
     expect(readContactValues(fd({ name: "  Ana  ", email: " mal ", message: "  hola  " }))).toEqual({
       name: "Ana",
       email: "mal",
       whatsapp: "",
       projectTypes: [],
       message: "hola",
     });
     ```
   - En `"ignora los valores que no son texto (archivos)"`, la expectativa pasa a ser:
     ```ts
     expect(readContactValues(f)).toEqual({ name: "", email: "", whatsapp: "", projectTypes: [], message: "" });
     ```
   - En `"es lo mismo que validateContact devuelve en values"`, sumá un WhatsApp al FormData:
     ```ts
     const f = fd({
       name: " Ana  Pérez ",
       email: "mal",
       whatsapp: " 11 2345 ",
       projectType: ["mobile", "x"],
       message: " hola\r\nchau ",
     });
     ```
   - Test nuevo dentro del mismo `describe`:
     ```ts
     it("WhatsApp: solo trim, tal cual lo tipeó (normalizar es cosa de validateContact)", () => {
       expect(readContactValues(fd({ whatsapp: "  (+34) 604-16 48 97 " })).whatsapp).toBe("(+34) 604-16 48 97");
     });
     ```

3. En `describe("validateContact")`:
   - `"acepta el mínimo (nombre + email) y aplica trim"` pasa a ser:
     ```ts
     it("acepta el mínimo (nombre + email) y aplica trim", () => {
       const r = validateContact(fd({ name: "  Ana  ", email: " ana@example.com ", lang: "en" }));
       expect(r).toEqual({
         ok: true,
         data: { name: "Ana", email: "ana@example.com", whatsapp: null, projectTypes: [], message: "", locale: "en" },
         values: { name: "Ana", email: "ana@example.com", whatsapp: "", projectTypes: [], message: "" },
       });
     });
     ```
   - Reemplazá el test `"email vacío → required; mal formado → invalid; >254 → invalid"` entero por este (el email vacío ya no es un error de campo, ver el `describe` nuevo):
     ```ts
     it("email mal formado → invalid; >254 → invalid", () => {
       for (const bad of ["ana", "ana@", "ana@example", "ana @example.com", "@example.com"]) {
         const r = validateContact(fd({ ...valid, email: bad }));
         expect(!r.ok && r.errors.email, bad).toBe("invalid");
       }

       const at254 = `${"a".repeat(242)}@example.com`; // 242 + 12 = 254
       expect(at254.length).toBe(254);
       expect(validateContact(fd({ ...valid, email: at254 })).ok).toBe(true);

       const at255 = `${"a".repeat(243)}@example.com`;
       const r = validateContact(fd({ ...valid, email: at255 }));
       expect(!r.ok && r.errors.email).toBe("invalid");
     });
     ```
   - En `"con errores devuelve values normalizados para rehidratar el formulario"`, el `values` esperado suma `whatsapp: ""`:
     ```ts
     values: { name: "Ana", email: "mal", whatsapp: "", projectTypes: ["mobile"], message: "hola" },
     ```

4. `describe` nuevo, después de `describe("validateContact")`:
   ```ts
   describe("validateContact: email, WhatsApp o los dos", () => {
     const base = { name: "Ana", lang: "es" };

     it("solo email → ok, sin WhatsApp", () => {
       const r = validateContact(fd({ ...base, email: "ana@example.com" }));
       expect(r.ok && r.data).toMatchObject({ email: "ana@example.com", whatsapp: null });
     });

     it("solo WhatsApp → ok, sin email y con el número normalizado; values guarda lo tipeado", () => {
       const r = validateContact(fd({ ...base, whatsapp: " 604 16 48 97 " }));
       expect(r.ok).toBe(true);
       if (!r.ok) return;
       expect(r.data).toMatchObject({ email: null, whatsapp: "34604164897" });
       expect(r.values.whatsapp).toBe("604 16 48 97");
     });

     it("los dos → ok con los dos", () => {
       const r = validateContact(fd({ ...base, email: "ana@example.com", whatsapp: "+54 9 11 2345-6789" }));
       expect(r.ok && r.data).toMatchObject({ email: "ana@example.com", whatsapp: "5491123456789" });
     });

     it("ninguno (o solo espacios) → need_one, sin errores de campo en Email ni WhatsApp", () => {
       // Tipado explícito: inferido, {} suma `email?: undefined` y no entra en Record<string, string>.
       const blanks: Record<string, string>[] = [{}, { email: "  ", whatsapp: "  " }];
       for (const blank of blanks) {
         const r = validateContact(fd({ ...base, ...blank }));
         expect(!r.ok && r.errors, JSON.stringify(blank)).toEqual({ reach: "need_one" });
       }
     });

     it("un campo escrito y mal tiene su propio error y no need_one", () => {
       const cases: [Record<string, string>, ContactErrors][] = [
         [{ email: "mal" }, { email: "invalid" }],
         [{ whatsapp: "11 2345 6789" }, { whatsapp: "invalid_phone" }],
         [{ email: "mal", whatsapp: "11 2345 6789" }, { email: "invalid", whatsapp: "invalid_phone" }],
         // Un email válido no excusa un número mal escrito: el equipo respondería a un número equivocado.
         [{ email: "ana@example.com", whatsapp: "11 2345 6789" }, { whatsapp: "invalid_phone" }],
       ];
       for (const [fields, errors] of cases) {
         const r = validateContact(fd({ ...base, ...fields }));
         expect(!r.ok && r.errors, JSON.stringify(fields)).toEqual(errors);
       }
     });

     it("nombre vacío y ningún contacto → los dos errores juntos", () => {
       const r = validateContact(fd({ lang: "es" }));
       expect(!r.ok && r.errors).toEqual({ name: "required", reach: "need_one" });
     });

     it("WhatsApp de más de 30 caracteres → invalid_phone", () => {
       const r = validateContact(fd({ ...base, whatsapp: `+34${" ".repeat(19)}604164897` }));
       expect(!r.ok && r.errors).toEqual({ whatsapp: "invalid_phone" });
     });
   });
   ```

5. En `describe("buildEmail")`:
   - `base` suma `whatsapp: null`:
     ```ts
     const base: ContactData = {
       name: "Ana",
       email: "ana@example.com",
       whatsapp: null,
       projectTypes: [],
       message: "",
       locale: "es",
     };
     ```
   - En `"sin chips ni mensaje"`, el `text` esperado suma `"WhatsApp: —"` después del email:
     ```ts
     text: [
       "Nombre: Ana",
       "Email: ana@example.com",
       "WhatsApp: —",
       "Qué necesita: —",
       "Idioma del sitio: es",
       "",
       "Mensaje:",
       "—",
     ].join("\n"),
     ```
   - Tests nuevos:
     ```ts
     it("con WhatsApp: el número con + y el link wa.me para abrir el chat", () => {
       const r = buildEmail({ ...base, whatsapp: "34604164897" });
       expect(r.text).toContain("\nWhatsApp: +34604164897 · https://wa.me/34604164897\n");
       expect(r.replyTo).toBe("ana@example.com");
     });

     it("sin email: 'Email: —' y sin replyTo (no hay a quién responder por mail)", () => {
       const r = buildEmail({ ...base, email: null, whatsapp: "34604164897" });
       expect(r.text).toContain("\nEmail: —\n");
       expect(r).not.toHaveProperty("replyTo");
     });
     ```

- [ ] **Step 2: Write the failing tests — `__tests__/lib/resend.test.ts`**

Test nuevo dentro de `describe("sendEmail")`, después del primero:

```ts
it("sin replyTo (la persona dejó solo WhatsApp) no manda reply_to", async () => {
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  const withoutReplyTo: EmailMessage = { from: msg.from, to: msg.to, subject: msg.subject, text: msg.text };
  await expect(sendEmail(withoutReplyTo)).resolves.toEqual({ ok: true });

  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  // Ni siquiera vacío: Resend rechaza un reply_to "" y el lead se perdería.
  expect(body).not.toHaveProperty("reply_to");
  expect(body).toEqual({ from: msg.from, to: [msg.to], subject: msg.subject, text: msg.text });
});
```

- [ ] **Step 3: Write the failing tests — `__tests__/actions/contact.test.ts`**

1. Los `values` esperados suman `whatsapp: ""`. Hacé estos dos reemplazos en todo el archivo (replace all):
   - `email: "ana@example.com", projectTypes` → `email: "ana@example.com", whatsapp: "", projectTypes`
   - `email: "mal", projectTypes` → `email: "mal", whatsapp: "", projectTypes`

2. Tests nuevos al final del `describe("contactAction")`:
   ```ts
   it("solo WhatsApp → success, envía sin replyTo y con el link wa.me", async () => {
     await expect(contactAction(IDLE, form({ email: "", whatsapp: "604 16 48 97" }))).resolves.toEqual({
       status: "success",
     });
     expect(sendEmail).toHaveBeenCalledOnce();
     const sent = sendEmail.mock.calls[0][0];
     expect(sent).not.toHaveProperty("replyTo");
     expect(sent.text).toContain("https://wa.me/34604164897");
   });

   it("ni email ni WhatsApp → need_one sin enviar", async () => {
     const r = await contactAction(IDLE, form({ email: "" }));
     expect(r).toEqual({
       status: "error",
       errors: { reach: "need_one" },
       values: { name: "Ana", email: "", whatsapp: "", projectTypes: ["webapp"], message: "Hola" },
     });
     expect(sendEmail).not.toHaveBeenCalled();
   });

   it("too_fast y send_failed devuelven el WhatsApp tal cual se tipeó, no normalizado", async () => {
     const tooFast = await contactAction(IDLE, form({ whatsapp: "604 16 48 97", startedAt: String(Date.now()) }));
     expect(tooFast).toMatchObject({
       status: "error",
       errors: { form: "too_fast" },
       values: { whatsapp: "604 16 48 97" },
     });

     sendEmail.mockResolvedValue({ ok: false });
     const failed = await contactAction(IDLE, form({ whatsapp: "604 16 48 97" }));
     expect(failed).toMatchObject({
       status: "error",
       errors: { form: "send_failed" },
       values: { whatsapp: "604 16 48 97" },
     });
   });
   ```

- [ ] **Step 4: Adapt fixtures — `__tests__/components/ContactForm.test.tsx`**

Solo tipos: los `values` de los mocks tienen que cumplir el `ContactValues` nuevo. Hacé estos dos reemplazos en todo el archivo (replace all):
- `email: "mal", projectTypes` → `email: "mal", whatsapp: "", projectTypes`
- `email: "ana@example.com", projectTypes` → `email: "ana@example.com", whatsapp: "", projectTypes`

No toques nada más de este archivo en esta tarea.

- [ ] **Step 5: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/contact.test.ts __tests__/lib/resend.test.ts __tests__/actions/contact.test.ts`
Expected: FAIL. Entre otros: `values` sin `whatsapp`, `need_one` inexistente, línea `WhatsApp:` ausente en el mail, `reply_to` presente.

- [ ] **Step 6: Implement — `lib/contact.ts`**

1. Reemplazá el bloque de tipos (desde `export type ContactField` hasta el cierre de `ContactState`) por:
   ```ts
   export type ContactField = "name" | "email" | "whatsapp" | "message";
   export type FieldErrorCode = "required" | "too_long" | "invalid" | "invalid_phone";
   export type ReachErrorCode = "need_one";
   export type FormErrorCode = "send_failed" | "too_fast";
   export type ContactErrors = Partial<Record<ContactField, FieldErrorCode>> & {
     /** Ni email ni WhatsApp: el error es del par, no de un campo. */
     reach?: ReachErrorCode;
     form?: FormErrorCode;
   };
   /** Lo que la persona escribió, sin validar: para volver a llenar el form. */
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
     /** null: no dejó email. */
     email: string | null;
     /** Dígitos con código de país ("34604164897"); null: no dejó WhatsApp. */
     whatsapp: string | null;
     projectTypes: ProjectType[];
     message: string;
     locale: Locale;
   };
   export type ContactState =
     | { status: "idle" }
     | { status: "success" }
     | { status: "error"; errors: ContactErrors; values: ContactValues };
   ```

2. En `readContactValues`, sumá `whatsapp` después de `email`:
   ```ts
       email: text(formData, "email"),
       // Tal cual lo tipeó (con trim): normalizarlo es cosa de validateContact.
       whatsapp: text(formData, "whatsapp"),
   ```

3. Reemplazá `validateContact` entera por:
   ```ts
   export function validateContact(
     formData: FormData,
   ):
     | { ok: true; data: ContactData; values: ContactValues }
     | { ok: false; errors: ContactErrors; values: ContactValues } {
     const values = readContactValues(formData);

     const errors: ContactErrors = {};
     if (!values.name) errors.name = "required";
     else if (values.name.length > LIMITS.name) errors.name = "too_long";

     if (values.email && (values.email.length > LIMITS.email || !EMAIL_RE.test(values.email))) errors.email = "invalid";

     const whatsapp = values.whatsapp ? normalizeWhatsapp(values.whatsapp) : null;
     if (values.whatsapp && !whatsapp) errors.whatsapp = "invalid_phone";

     // Email o WhatsApp, al menos uno. Si uno está escrito pero mal, ya tiene su propio error.
     if (!values.email && !values.whatsapp) errors.reach = "need_one";

     if (values.message.length > LIMITS.message) errors.message = "too_long";

     if (Object.keys(errors).length > 0) return { ok: false, errors, values };

     const lang = text(formData, "lang");
     return {
       ok: true,
       data: {
         name: values.name,
         email: values.email || null,
         whatsapp,
         projectTypes: values.projectTypes,
         message: values.message,
         locale: isLocale(lang) ? lang : defaultLocale,
       },
       values,
     };
   }
   ```

4. Reemplazá `buildEmail` entera por:
   ```ts
   export function buildEmail(data: ContactData): { subject: string; text: string; replyTo?: string } {
     const types = data.projectTypes.map((type) => PROJECT_TYPE_LABELS_ES[type]).join(", ");
     const subject = types ? `Nuevo contacto: ${data.name} · ${types}` : `Nuevo contacto: ${data.name}`;
     const body = [
       `Nombre: ${data.name}`,
       `Email: ${data.email ?? "—"}`,
       // El link abre el chat con un toque. Solo lleva dígitos ya normalizados: nada que inyectar en la URL.
       `WhatsApp: ${data.whatsapp ? `+${data.whatsapp} · https://wa.me/${data.whatsapp}` : "—"}`,
       `Qué necesita: ${types || "—"}`,
       `Idioma del sitio: ${data.locale}`,
       "",
       "Mensaje:",
       data.message || "—",
     ].join("\n");
     // Sin email no hay a quién responder por mail: el equipo responde desde el link de WhatsApp.
     return data.email ? { subject, text: body, replyTo: data.email } : { subject, text: body };
   }
   ```

- [ ] **Step 7: Implement — `lib/resend.ts`**

1. Primera línea:
   ```ts
   export type EmailMessage = { from: string; to: string; replyTo?: string; subject: string; text: string };
   ```
2. En el `JSON.stringify` del body, reemplazá `reply_to: msg.replyTo,` por:
   ```ts
           // Sin email de la persona no va reply_to: ni siquiera vacío, Resend lo rechaza y el lead se pierde.
           ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
   ```

- [ ] **Step 8: Implement — `app/[lang]/actions/contact.ts`**

Reemplazá desde `const result = validateContact(formData);` hasta la línea `const failed: ContactState = …` (inclusive) por:

```ts
  const result = validateContact(formData);
  if (!result.ok) return { status: "error", errors: result.errors, values: result.values };

  // Para volver a llenar el form va lo que la persona tipeó, no lo normalizado (result.data): el WhatsApp
  // vuelve como lo escribió ("604 16 48 97") y no como "34604164897".
  const { values } = result;

  // Una persona real puede mandar en <2 s (autofill + Enter): no se descarta en silencio,
  // se le pide reintentar conservando lo que escribió. Va después de validar para que
  // los errores de campo, que sí son accionables, tengan prioridad.
  if (isTooFast(formData, Date.now())) return { status: "error", errors: { form: "too_fast" }, values };

  const failed: ContactState = { status: "error", errors: { form: "send_failed" }, values };
```

Con esto salen el `eslint-disable-next-line` y `const { locale: _locale, ...values } = result.data;`. El resto de la función (chequeo de env y `sendEmail({ from, to, ...buildEmail(result.data) })`) no cambia.

- [ ] **Step 9: Implement — diccionarios**

En los tres archivos, dentro de `closing.form` (no en `closing`, que tiene su propio `emailLabel`):

- Después de la clave `"emailLabel"` de `closing.form`:

  `es.json`:
  ```json
      "whatsappLabel": "WhatsApp",
      "whatsappPlaceholder": "+34 600 000 000",
      "reachLegend": "¿Cómo te contactamos?",
      "reachHint": "(uno o los dos)",
  ```
  `en.json`:
  ```json
      "whatsappLabel": "WhatsApp",
      "whatsappPlaceholder": "+34 600 000 000",
      "reachLegend": "How should we reach you?",
      "reachHint": "(one or both)",
  ```
  `ca.json`:
  ```json
      "whatsappLabel": "WhatsApp",
      "whatsappPlaceholder": "+34 600 000 000",
      "reachLegend": "Com et contactem?",
      "reachHint": "(un o tots dos)",
  ```

- Dentro de `closing.form.errors`, después de `"invalid"`:

  `es.json`:
  ```json
        "invalid_phone": "Revisá el número. Si no es de España, empezá con el prefijo del país (+54…).",
        "need_one": "Dejanos un mail o un WhatsApp para poder responderte.",
  ```
  `en.json`:
  ```json
        "invalid_phone": "Check the number. If it isn't Spanish, start with the country code (+44…).",
        "need_one": "Leave an email or a WhatsApp number so we can get back to you.",
  ```
  `ca.json`:
  ```json
        "invalid_phone": "Revisa el número. Si no és d'Espanya, comença amb el prefix del país (+33…).",
        "need_one": "Deixa'ns un correu o un WhatsApp per poder respondre't.",
  ```

Respetá la indentación que ya tiene cada archivo. El `…` es el carácter de puntos suspensivos (U+2026), igual que en `"sending": "Enviando…"`.

- [ ] **Step 10: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/contact.test.ts __tests__/lib/resend.test.ts __tests__/actions/contact.test.ts __tests__/i18n/dictionaries-parity.test.ts`
Expected: PASS.

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: todo en verde. `ContactForm.test.tsx` también pasa: la UI todavía no cambió.

- [ ] **Step 11: Commit**

```bash
git add lib/contact.ts lib/resend.ts "app/[lang]/actions/contact.ts" "app/[lang]/dictionaries" __tests__/lib/contact.test.ts __tests__/lib/resend.test.ts __tests__/actions/contact.test.ts __tests__/components/ContactForm.test.tsx
git commit -m "feat: email o WhatsApp en la validación, el mail y la action del formulario

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: UI del formulario

Nombre pasa a todo el ancho. Email y WhatsApp van en un `fieldset` "¿Cómo te contactamos? (uno o los dos)", lado a lado por container query. Se suman el error del par y el orden de foco nuevo.

**Files:**
- Modify: `components/site/ContactForm.tsx`
- Modify: `app/globals.css` (bloque de `.contact-form__form` y el comentario del `@media (min-width: 1100px)` de `.closing`)
- Test: `__tests__/components/ContactForm.test.tsx`

**Interfaces:**
- Consumes (Task 2): `ContactField` con `"whatsapp"`, `ContactErrors.reach?: "need_one"`, `ContactValues.whatsapp`, `LIMITS.whatsapp`, y las claves `t.whatsappLabel`, `t.whatsappPlaceholder`, `t.reachLegend`, `t.reachHint`, `t.errors.need_one`, `t.errors.invalid_phone`.
- Produces: inputs `name="email"` y `name="whatsapp"` dentro de un `fieldset` cuyo nombre accesible empieza con `reachLegend`; clase CSS `.contact-form__pair`; error del par con id `${useId}-reach-error`. La Task 4 los mide en e2e.

- [ ] **Step 1: Write the failing tests**

En `__tests__/components/ContactForm.test.tsx`:

1. Sumá `LIMITS` como import de valor (el archivo hoy importa solo tipos de `@/lib/contact`):
   ```ts
   import { LIMITS, type ContactState } from "@/lib/contact";
   ```
   (reemplaza a `import type { ContactState } from "@/lib/contact";`).

2. Debajo de `const WA = …`, sumá:
   ```ts
   const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
   const reachGroup = () => screen.getByRole("group", { name: new RegExp(`^${escapeRe(t.reachLegend)}`) });
   ```

3. Tests nuevos dentro de `describe("ContactForm")`, después de `"tiene labels visibles, fieldset con legend y 6 chips checkbox"`:
   ```ts
   it("Email y WhatsApp van en un grupo con legend y aclaración, y ninguno es obligatorio por sí solo", () => {
     setup();
     const group = reachGroup();
     expect(group.textContent).toContain(t.reachHint);
     const email = within(group).getByLabelText(t.emailLabel) as HTMLInputElement;
     const whatsapp = within(group).getByLabelText(t.whatsappLabel) as HTMLInputElement;

     expect(email.type).toBe("email");
     expect(email.required).toBe(false);

     expect(whatsapp.name).toBe("whatsapp");
     expect(whatsapp.type).toBe("tel");
     expect(whatsapp.required).toBe(false);
     expect(whatsapp.getAttribute("autocomplete")).toBe("tel");
     expect(whatsapp.placeholder).toBe(t.whatsappPlaceholder);
     expect(whatsapp.maxLength).toBe(LIMITS.whatsapp);

     // Nombre queda fuera del grupo y sigue obligatorio.
     const name = screen.getByLabelText(t.nameLabel) as HTMLInputElement;
     expect(group.contains(name)).toBe(false);
     expect(name.required).toBe(true);
   });

   it("need_one: marca Email y WhatsApp, los asocia a un único mensaje dentro del grupo y enfoca el Email", async () => {
     actionMock.mockResolvedValue({
       status: "error",
       errors: { reach: "need_one" },
       values: { name: "Ana", email: "", whatsapp: "", projectTypes: [], message: "" },
     });
     const { form } = setup();
     await submit(form);

     const email = screen.getByLabelText(t.emailLabel);
     const whatsapp = screen.getByLabelText(t.whatsappLabel);
     await waitFor(() => expect(email.getAttribute("aria-invalid")).toBe("true"));
     expect(whatsapp.getAttribute("aria-invalid")).toBe("true");

     const describedBy = email.getAttribute("aria-describedby")!;
     expect(whatsapp.getAttribute("aria-describedby")).toBe(describedBy);
     const message = document.getElementById(describedBy)!;
     expect(message.textContent).toBe(t.errors.need_one);
     expect(screen.getAllByText(t.errors.need_one)).toHaveLength(1);
     expect(reachGroup().contains(message)).toBe(true);

     expect(document.activeElement).toBe(email);
     expect(screen.getByLabelText(t.nameLabel).getAttribute("aria-invalid")).toBeNull();
   });

   it("Nombre vacío + need_one: el foco va al Nombre, que va primero", async () => {
     actionMock.mockResolvedValue({
       status: "error",
       errors: { name: "required", reach: "need_one" },
       values: { name: "", email: "", whatsapp: "", projectTypes: [], message: "" },
     });
     const { form } = setup();
     await submit(form);

     const name = screen.getByLabelText(t.nameLabel);
     await waitFor(() => expect(name.getAttribute("aria-invalid")).toBe("true"));
     expect(document.activeElement).toBe(name);
     expect(screen.getByLabelText(t.emailLabel).getAttribute("aria-invalid")).toBe("true");
   });

   it("invalid_phone: el mensaje va asociado al WhatsApp, el Email no se marca y vuelve lo tipeado", async () => {
     actionMock.mockResolvedValue({
       status: "error",
       errors: { whatsapp: "invalid_phone" },
       values: { name: "Ana", email: "", whatsapp: "11 2345 6789", projectTypes: [], message: "" },
     });
     const { form } = setup();
     await submit(form);

     const whatsapp = screen.getByLabelText(t.whatsappLabel) as HTMLInputElement;
     await waitFor(() => expect(whatsapp.getAttribute("aria-invalid")).toBe("true"));
     expect(document.getElementById(whatsapp.getAttribute("aria-describedby")!)!.textContent).toBe(
       t.errors.invalid_phone,
     );
     expect(screen.getByLabelText(t.emailLabel).getAttribute("aria-invalid")).toBeNull();
     expect(screen.queryByText(t.errors.need_one)).toBeNull();
     expect(document.activeElement).toBe(whatsapp);
     expect(whatsapp.value).toBe("11 2345 6789");
   });
   ```

4. En el test existente `"si la action se rechaza (red caída, 5xx, action vieja) no rompe la página: send_failed y conserva lo escrito"`:
   - Después del `fireEvent.change` del email, sumá:
     ```ts
     fireEvent.change(screen.getByLabelText(t.whatsappLabel), { target: { value: " 604 16 48 97 " } });
     ```
   - Después de la expectativa del email, sumá:
     ```ts
     expect((screen.getByLabelText(t.whatsappLabel) as HTMLInputElement).value).toBe("604 16 48 97");
     ```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/ContactForm.test.tsx`
Expected: FAIL. No existe el grupo `reachLegend` ni el input con label `WhatsApp`.

- [ ] **Step 3: Implement — `components/site/ContactForm.tsx`**

1. `FIELD_ORDER`:
   ```ts
   // Orden visual del form: el foco va al primer campo con problema.
   const FIELD_ORDER: ContactField[] = ["name", "email", "whatsapp", "message"];
   ```

2. En el effect de foco, reemplazá:
   ```ts
       } else if (state.status === "error") {
         const first = FIELD_ORDER.find((field) => state.errors[field]);
         if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
       }
   ```
   por:
   ```ts
       } else if (state.status === "error") {
         // need_one es del par Email/WhatsApp: cuenta como error del Email, el primero del par.
         const first = FIELD_ORDER.find((field) => state.errors[field] || (field === "email" && state.errors.reach));
         if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
       }
   ```

3. Reemplazá `fieldA11y`:
   ```ts
     const fieldA11y = (field: ContactField) =>
       errors[field] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${field}-error` } : {};
   ```
   por:
   ```ts
     const reachErrorId = `${id}-reach-error`;
     const fieldA11y = (field: ContactField) => {
       if (errors[field]) return { "aria-invalid": true as const, "aria-describedby": `${id}-${field}-error` };
       // need_one es del par: marca los dos inputs y los dos apuntan al mismo mensaje, debajo del par.
       if (errors.reach && (field === "email" || field === "whatsapp"))
         return { "aria-invalid": true as const, "aria-describedby": reachErrorId };
       return {};
     };
   ```

4. Reemplazá los dos bloques `<div className="contact-form__field contact-form__field--half">` (el de Nombre y el de Email, desde el primero hasta el `</div>` que cierra el de Email) por:
   ```tsx
             <div className="contact-form__field">
               <label htmlFor={`${id}-name`} className="contact-form__label">
                 {t.nameLabel}
               </label>
               <input
                 ref={nameRef}
                 id={`${id}-name`}
                 name="name"
                 type="text"
                 required
                 maxLength={LIMITS.name}
                 autoComplete="name"
                 defaultValue={values?.name}
                 className="contact-form__input"
                 {...fieldA11y("name")}
               />
               {fieldError("name")}
             </div>

             {/* Email o WhatsApp, al menos uno: ninguno es required y la regla la valida el servidor (HTML no tiene
                 una nativa para "al menos uno de estos dos"), igual con y sin JS. */}
             <fieldset className="contact-form__group">
               <legend className="contact-form__label">
                 {t.reachLegend} <span className="contact-form__optional">{t.reachHint}</span>
               </legend>
               <div className="contact-form__pair">
                 <div className="contact-form__field">
                   <label htmlFor={`${id}-email`} className="contact-form__label">
                     {t.emailLabel}
                   </label>
                   <input
                     id={`${id}-email`}
                     name="email"
                     type="email"
                     maxLength={LIMITS.email}
                     autoComplete="email"
                     defaultValue={values?.email}
                     className="contact-form__input"
                     {...fieldA11y("email")}
                   />
                   {fieldError("email")}
                 </div>

                 <div className="contact-form__field">
                   <label htmlFor={`${id}-whatsapp`} className="contact-form__label">
                     {t.whatsappLabel}
                   </label>
                   {/* Sin pattern: el mensaje nativo saldría en el idioma del navegador. Valida el servidor. */}
                   <input
                     id={`${id}-whatsapp`}
                     name="whatsapp"
                     type="tel"
                     maxLength={LIMITS.whatsapp}
                     autoComplete="tel"
                     placeholder={t.whatsappPlaceholder}
                     defaultValue={values?.whatsapp}
                     className="contact-form__input"
                     {...fieldA11y("whatsapp")}
                   />
                   {fieldError("whatsapp")}
                 </div>
               </div>
               {errors.reach && (
                 <p id={reachErrorId} className="contact-form__error">
                   {t.errors[errors.reach]}
                 </p>
               )}
             </fieldset>
   ```

- [ ] **Step 4: Implement — `app/globals.css`**

1. Reemplazá este bloque (está debajo de `/* ---------- Contact form ---------- */`):
   ```css
   /* Con 30rem de ancho interno, Nombre y Email (.contact-form__field--half) comparten fila: cada input queda
      en ~230 px o más y el formulario baja ~100 px. El resto de los campos sigue a todo el ancho.
      align-items: start: el mensaje de error alarga solo la celda de su campo; estirada, la celda vecina
      repartiría ese alto entre sus filas y su input crecería (de 48 a ~63 px). */
   @container (min-width: 30rem) {
     .contact-form__form {
       grid-template-columns: repeat(2, minmax(0, 1fr));
       align-items: start;
     }
     .contact-form__form > * {
       grid-column: 1 / -1;
     }
     .contact-form__form > .contact-form__field--half {
       grid-column: auto;
     }
   }
   ```
   por:
   ```css
   /* Email y WhatsApp (.contact-form__pair, dentro del grupo "¿Cómo te contactamos?"). Con 30rem de ancho
      interno comparten fila: cada input queda en ~230 px o más. El resto de los campos va a todo el ancho.
      align-items: start: el mensaje de error alarga solo la celda de su campo; estirada, la celda vecina
      repartiría ese alto entre sus filas y su input crecería (de 48 a ~63 px). */
   .contact-form__pair {
     display: grid;
     gap: var(--contact-gap);
   }
   @container (min-width: 30rem) {
     .contact-form__pair {
       grid-template-columns: repeat(2, minmax(0, 1fr));
       align-items: start;
     }
   }
   ```

2. En el comentario de arriba del `@media (min-width: 1100px)` de `.closing`, reemplazá:
   ```
      Recién desde 1100px: más angosto, el panel no llega al ancho en que Nombre y Email comparten fila
      (ver .contact-form), el formulario vuelve a medir ~630 px y el hueco reaparece. Por debajo va apilado. */
   ```
   por:
   ```
      Recién desde 1100px: más angosto, el panel no llega al ancho en que Email y WhatsApp comparten fila
      (ver .contact-form__pair), el formulario se alarga y el hueco reaparece. Por debajo va apilado. */
   ```

3. Comprobá que no quedó ninguna referencia a la clase vieja:
   Run: `grep -rn "field--half" app components __tests__ e2e`
   Expected: sin resultados.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/components/ContactForm.test.tsx __tests__/components/Closing.test.tsx __tests__/design/tokens.test.ts`
Expected: PASS.

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: todo en verde.

- [ ] **Step 6: Commit**

```bash
git add components/site/ContactForm.tsx app/globals.css __tests__/components/ContactForm.test.tsx
git commit -m "feat: el formulario pide email, WhatsApp o los dos en un grupo propio

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: e2e y docs

Los e2e cubren el envío con solo WhatsApp, el error del par sin JS y la geometría nueva (fila Email/WhatsApp, Nombre a todo el ancho). Después se actualizan los docs y se corre la verificación completa.

**Files:**
- Modify: `e2e/contact.spec.ts`
- Modify: `e2e/closing.spec.ts`
- Modify: `CLAUDE.md`, `README.md`, `docs/superpowers/specs/2026-09-29-contact-form-design.md`

**Interfaces:**
- Consumes (Tasks 2-3): labels `t.whatsappLabel`, `t.emailLabel`, `t.nameLabel`; textos `t.errors.need_one`, `t.errors.invalid_phone`; inputs `input[name="name"|"email"|"whatsapp"]`; Email y WhatsApp en la misma fila desde 30rem de ancho interno del panel.
- Produces: nada que consuma otra tarea.

- [ ] **Step 1: e2e — `e2e/contact.spec.ts`**

1. Dentro del loop `for (const lang of ["es", "en", "ca"] as const)`, después del test `` `contacto ${lang}: envío correcto muestra el éxito y permite enviar otro` ``:
   ```ts
   test(`contacto ${lang}: envío con solo WhatsApp (sin email) muestra el éxito`, async ({ page }) => {
     await page.goto(`/${lang}`);
     const form = page.getByRole("form", { name: t.formLabel });
     await form.scrollIntoViewIfNeeded();

     await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
     await form.getByLabel(t.whatsappLabel, { exact: true }).fill("604 16 48 97");
     await waitTimeGate(form);
     await form.getByRole("button", { name: t.submit }).click();

     await expect(page.getByRole("heading", { name: t.successTitle })).toBeVisible();
   });
   ```

2. Dentro de `` test.describe(`contacto ${lang}: sin JavaScript`, …) ``, al final:
   ```ts
   test("sin email ni WhatsApp: vuelve a #contact con el error del par a la vista y el nombre conservado", async ({
     page,
   }) => {
     await page.goto(`/${lang}`);
     const form = page.getByRole("form", { name: t.formLabel });
     await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
     await form.getByRole("button", { name: t.submit }).click();

     const again = page.getByRole("form", { name: t.formLabel });
     const error = again.getByText(t.errors.need_one);
     await expect(error).toBeVisible();
     expect(page.url()).toMatch(new RegExp(`/${lang}#contact$`));
     await expect(error).toBeInViewport({ ratio: 1 });
     await expect(again.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
     await expect(again.getByLabel(t.emailLabel, { exact: true })).toHaveAttribute("aria-invalid", "true");
     await expect(again.getByLabel(t.whatsappLabel, { exact: true })).toHaveAttribute("aria-invalid", "true");
   });
   ```

3. Reemplazá el `test.describe("contacto: en fila, el error de un campo no deforma al vecino", …)` entero, con su comentario de arriba, por:
   ```ts
   // Email y WhatsApp comparten fila cuando el panel tiene ancho (ver e2e/closing.spec.ts). El mensaje de error
   // se suma solo a la celda del campo que falló: si la celda vecina se estirara para igualar el alto de la
   // fila, su input crecería con ella y los dos campos quedarían de distinto alto.
   test.describe("contacto: en fila, el error de un campo no deforma al vecino", () => {
     test.use({ viewport: { width: 1280, height: 720 } });

     const t = es.closing.form;

     test("con error solo en WhatsApp, Email conserva su alto y los dos inputs siguen alineados", async ({ page }) => {
       await page.goto("/es");
       const form = page.getByRole("form", { name: t.formLabel });
       await form.scrollIntoViewIfNeeded();
       const email = form.getByLabel(t.emailLabel, { exact: true });
       const whatsapp = form.getByLabel(t.whatsappLabel, { exact: true });
       const rect = (input: Locator) =>
         input.evaluate((el) => {
           const { top, left, right, height } = el.getBoundingClientRect();
           return { top, left, right, height };
         });

       await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
       await email.fill("ana@example.com");
       // Sin prefijo y sin forma de número español: el servidor lo rechaza (invalid_phone).
       await whatsapp.fill("11 2345 6789");
       const emailBefore = await rect(email);
       // Precondición: están en la misma fila. Apilados, el error de WhatsApp no tiene vecino que deformar.
       expect((await rect(whatsapp)).left, "WhatsApp debe estar a la derecha de Email, en la misma fila").toBeGreaterThan(
         emailBefore.right,
       );

       await waitTimeGate(form);
       await form.getByRole("button", { name: t.submit }).click();
       await expect(form.getByText(t.errors.invalid_phone)).toBeVisible();

       const [emailAfter, whatsappAfter] = [await rect(email), await rect(whatsapp)];
       expect(emailAfter.height, "Email conserva su alto").toBe(emailBefore.height);
       expect(whatsappAfter.height, "WhatsApp mide lo mismo que Email").toBe(emailAfter.height);
       expect(Math.abs(whatsappAfter.top - emailAfter.top), "los dos inputs siguen a la misma altura").toBeLessThanOrEqual(
         1,
       );
     });
   });
   ```

Los demás tests del archivo no cambian: llenan Nombre + Email, que sigue siendo válido.

- [ ] **Step 2: e2e — `e2e/closing.spec.ts`**

1. Comentario de arriba del archivo: reemplazá
   ```
   // formulario se compacta: Nombre y Email comparten fila cuando el panel tiene ancho para eso.
   // Las dos columnas solo valen donde el formulario entra compacto. A 1024 px el panel de una columna de
   // escritorio es demasiado angosto para la fila Nombre/Email, el formulario vuelve a medir ~630 px y el hueco
   // reaparece: ahí va apilado. El viewport se fija en cada caso (el corte es por ancho, no por proyecto).
   ```
   por
   ```
   // formulario se compacta: Email y WhatsApp comparten fila cuando el panel tiene ancho para eso.
   // Las dos columnas solo valen donde el formulario entra compacto. A 1024 px el panel de una columna de
   // escritorio es demasiado angosto para la fila Email/WhatsApp, el formulario se alarga y el hueco
   // reaparece: ahí va apilado. El viewport se fija en cada caso (el corte es por ancho, no por proyecto).
   ```

2. En `measure`, sumá `whatsapp` al objeto que devuelve:
   ```ts
         name: box('input[name="name"]'),
         email: box('input[name="email"]'),
         whatsapp: box('input[name="whatsapp"]'),
   ```

3. Reemplazá el bloque `if (inputs === "fila") { … } else { … }` por:
   ```ts
       if (inputs === "fila") {
         test("Email y WhatsApp comparten fila, y Nombre ocupa el ancho del par", async ({ page }) => {
           const { name, email, whatsapp } = await measure(page);
           expect(Math.abs(email.top - whatsapp.top), "Email y WhatsApp a la misma altura").toBeLessThanOrEqual(1);
           expect(whatsapp.left, "WhatsApp va a la derecha de Email").toBeGreaterThan(email.right);
           expect(Math.abs(name.left - email.left), "Nombre arranca donde Email").toBeLessThanOrEqual(ALIGNED);
           expect(Math.abs(name.right - whatsapp.right), "Nombre termina donde WhatsApp").toBeLessThanOrEqual(ALIGNED);
         });
       } else {
         test("Email y WhatsApp van apilados: en una fila quedarían demasiado angostos", async ({ page }) => {
           const { email, whatsapp } = await measure(page);
           expect(whatsapp.top, "WhatsApp va debajo de Email").toBeGreaterThanOrEqual(email.bottom);
         });
       }
   ```

Los tests de dos columnas y apilado de la introducción no cambian: el formulario es más alto, pero la introducción sigue terminando al ras del panel.

- [ ] **Step 3: Run e2e**

Run: `lsof -i :3000` → no debe devolver nada (si hay algo, no lo mates: reportalo).
Run: `npx playwright test e2e/contact.spec.ts e2e/closing.spec.ts e2e/a11y.spec.ts`
Expected: PASS en `desktop` y `mobile`, con los mismos skips por diseño que ya existían.

Si `toBeInViewport({ ratio: 1 })` del test sin JS falla en `mobile`, no ablandes la aserción. Es la experiencia real de una persona sin JS que no ve el error tras recargar: reportalo como bloqueo, con la captura que deja Playwright.

- [ ] **Step 4: Commit e2e**

```bash
git add e2e/contact.spec.ts e2e/closing.spec.ts
git commit -m "test: e2e del formulario con solo WhatsApp, need_one sin JS y fila Email/WhatsApp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Docs — `CLAUDE.md`**

1. Párrafo **Contact form**: reemplazá la oración
   ```
   Pure logic lives in `lib/contact.ts` (`validateContact`, `isHoneypotFilled`, `isTooFast`, `buildEmail`; message line breaks are normalized to `\n` before the 2000-char limit) and the Resend REST call in `lib/resend.ts`.
   ```
   por
   ```
   Name is required; email and WhatsApp are each optional but at least one is (`errors.reach = "need_one"`, an error of the pair, validated server-side only, with or without JS). Pure logic lives in `lib/contact.ts` (`validateContact`, `normalizeWhatsapp` — digits with country code; without `+`/`00` only a Spanish number, 9 digits starting with 6–9, is accepted and gets `34` —, `isHoneypotFilled`, `isTooFast`, `buildEmail`, which adds a `wa.me` link and sets `replyTo` only when there is an email; message line breaks are normalized to `\n` before the 2000-char limit) and the Resend REST call in `lib/resend.ts` (sends `reply_to` only when `replyTo` is set). The action refills the form with `result.values` (what the person typed), never with the normalized data.
   ```
   Y al final del mismo párrafo, reemplazá `Spec: \`docs/superpowers/specs/2026-09-29-contact-form-design.md\`.` por:
   ```
   Specs: `docs/superpowers/specs/2026-09-29-contact-form-design.md` and, for email or WhatsApp, `docs/superpowers/specs/2026-11-20-contact-reach-design.md`.
   ```

2. Párrafo **Closing layout**: reemplazá
   ```
   Below 1100 px it stacks on purpose: a desktop column there is too narrow for the compact form, the form goes back to ~630 px tall and the gap returns. Name and Email share a row through a container query on `.contact-form` (inner width ≥ 30rem, `.contact-form__field--half`), not a viewport media query, so it also applies to the wide stacked panel on tablets; keep `align-items: start` on that grid, otherwise a field error stretches the neighbouring input.
   ```
   por
   ```
   Below 1100 px it stacks on purpose: a desktop column there is too narrow for the Email/WhatsApp row, the form gets taller and the gap returns. Name takes the full width; Email and WhatsApp share a row inside the "¿Cómo te contactamos?" fieldset (`.contact-form__pair`) through a container query on `.contact-form` (inner width ≥ 30rem), not a viewport media query, so it also applies to the wide stacked panel on tablets; keep `align-items: start` on that grid, otherwise a field error stretches the neighbouring input.
   ```

3. Sección **Testing**, en la línea de `e2e/`:
   - Reemplazá
     ```
     a rejected action, the live region, focus not hidden by the header/FAB and a field error not deforming its row neighbour)
     ```
     por
     ```
     a rejected action, the live region, focus not hidden by the header/FAB, a field error not deforming its row neighbour, sending with WhatsApp only and the `need_one` error without JS)
     ```
   - Reemplazá
     ```
     intro flush with the form panel, Name/Email row)
     ```
     por
     ```
     intro flush with the form panel, Email/WhatsApp row with Name at full width)
     ```

- [ ] **Step 6: Docs — `README.md` y spec viejo**

1. En `README.md`, sección `## Documentación`, después de la línea `- Formulario de contacto: …`:
   ```
   - Formulario con email, WhatsApp o los dos: `docs/superpowers/specs/2026-11-20-contact-reach-design.md`
   ```

2. Al final de `docs/superpowers/specs/2026-09-29-contact-form-design.md`:
   ```markdown

   ## Cambios posteriores (2026-11-20, email o WhatsApp)

   El formulario pasó a pedir **email, WhatsApp o los dos** (al menos uno). Detalle
   y decisiones: `2026-11-20-contact-reach-design.md`.

   - Email deja de ser obligatorio y se suma el campo `whatsapp` (`type="tel"`).
     Sin ninguno de los dos, error del par `reach: "need_one"`, validado solo en
     el servidor.
   - `normalizeWhatsapp` deja el número en dígitos con código de país. Sin prefijo
     solo se acepta un número español (9 dígitos que empiezan con 6–9), al que se
     le suma el 34.
   - Nombre va a todo el ancho. Email y WhatsApp comparten fila dentro del grupo
     "¿Cómo te contactamos?" (`.contact-form__pair`), con la misma container query
     de 30rem que antes juntaba Nombre y Email.
   - El mail suma la línea `WhatsApp: +34… · https://wa.me/34…`, y `Reply-To`
     solo va si hay email.
   ```

- [ ] **Step 7: Verificación completa**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: todo en verde.

Run: `npm run e2e`
Expected: PASS en `desktop` y `mobile` (con los skips por diseño de siempre).

- [ ] **Step 8: Commit docs**

```bash
git add CLAUDE.md README.md docs/superpowers/specs/2026-09-29-contact-form-design.md
git commit -m "docs: el formulario acepta email, WhatsApp o los dos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
