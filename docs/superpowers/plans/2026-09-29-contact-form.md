# Formulario de contacto en Closing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La sección Closing ("Hablemos") suma un formulario corto (Nombre, Email, chips de tipo de proyecto, Mensaje) que envía un mail vía Resend, como alternativa a WhatsApp.

**Architecture:** Lógica pura en `lib/contact.ts` (validación, anti-spam, armado del mail), un cliente mínimo de la API REST de Resend en `lib/resend.ts`, un Server Action que orquesta ambos, y un client component `ContactForm` con `useActionState` que se monta dentro de `Closing`. El formulario funciona sin JS (progressive enhancement).

**Tech Stack:** Next.js 16 App Router (Server Actions), React 19 (`useActionState`), TypeScript, Vitest + Testing Library (jsdom), Playwright, CSS plano BEM + variables en `app/globals.css` (no utilidades Tailwind).

**Spec:** `docs/superpowers/specs/2026-09-29-contact-form-design.md`

## Global Constraints

- Leer `AGENTS.md`: este Next.js tiene convenciones distintas. Referencia de formularios: `node_modules/next/dist/docs/01-app/02-guides/forms.md` y `.../server-actions.md`.
- **Sin dependencias nuevas.** Resend se llama con `fetch` a `https://api.resend.com/emails`. No instalar `resend`, `zod` ni nada.
- Variables de entorno server-only: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_DRY_RUN`. Ninguna con prefijo `NEXT_PUBLIC_`.
- Chips: exactamente `["website", "landing", "ecommerce", "webapp", "mobile", "other"]`, en ese orden, independientes de `dict.services`.
- Solo `name` y `email` son obligatorios. Límites: nombre 80, email 254, mensaje 2000 caracteres.
- Tiempo mínimo anti-bot: `2000` ms.
- La acción devuelve **códigos** de error (`required`, `too_long`, `invalid`, `send_failed`), nunca textos. El componente los traduce con el diccionario.
- Copy nuevo solo en `closing.form` de `es.json` y `en.json`, con las mismas claves (lo verifica `__tests__/i18n/dictionaries-parity.test.ts`).
- CSS: BEM en `app/globals.css`, tokens existentes. Duraciones y curvas solo `var(--dur-*)` / `var(--ease-*)`. Nunca `transition: all` ni `ease-in` (lo verifica `__tests__/design/tokens.test.ts`).
- Mensajes de commit en español, estilo `feat: …` / `test: …`, terminando con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Comando de tests unitarios: `npx vitest run <archivo>`. Suite completa: `npm run test`. Lint: `npm run lint`.

## Review Focus

Condiciones que el spec no nombra pero que pueden romperle la experiencia a una persona real. Cada una tiene su test en la tarea dueña del código:

1. **Reloj del visitante adelantado:** si el reloj del cliente va adelantado respecto al servidor, `now - startedAt` da negativo. Tratarlo como bot descartaría en silencio el mensaje de una persona real. Lo esperado es que un tiempo negativo se trate como "no se puede juzgar" y se acepte. Test en Task 1. Esto refina el spec, que decía solo "<2000 → bot".
2. **Saltos de línea en el nombre:** un nombre con `\r\n` o tabs terminaría dentro del `subject` del mail. Lo esperado es que el whitespace interno del nombre se colapse a un espacio. Test en Task 1.
3. **Resend que no responde:** un `fetch` colgado dejaría el botón en "Enviando…" para siempre. Lo esperado es cortar a los 10 s y mostrar `send_failed`. Test en Task 2.
4. **Conservar lo escrito tras un error:** React 19 resetea el `<form action>` después de cada envío. Lo esperado es que los valores vuelvan desde `state.values` y no queden vacíos. Test en Task 5.
5. **Bordes de input invisibles:** con `--border` (8% de opacidad) los inputs no llegan al contraste de 3:1 para componentes (WCAG 1.4.11). Lo esperado es que los bordes de inputs y chips usen `--fg-muted`. Esto refina el spec, que decía `--border` para inputs. Se verifica en la revisión visual de la Task 7.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `lib/contact.ts` | Crear | Tipos, constantes, `validateContact`, `isLikelyBot`, `buildEmail`. Sin I/O. |
| `lib/resend.ts` | Crear | `sendEmail(msg)` → `POST` a Resend. Nunca lanza. Modo dry-run. |
| `app/[lang]/actions/contact.ts` | Crear | Server Action `contactAction`. |
| `components/site/ContactForm.tsx` | Crear | Client component del formulario. |
| `components/ui/Button.tsx` | Modificar | Aceptar `type?: "button" \| "submit"`. |
| `components/site/Closing.tsx` | Modificar | Título a ancho completo + grid de dos columnas con `ContactForm`. |
| `app/[lang]/page.tsx` | Modificar | Pasar `locale` a `Closing`. |
| `app/[lang]/dictionaries/{es,en}.json` | Modificar | Bloque `closing.form`. |
| `app/globals.css` | Modificar | Token `--danger`, estilos `.closing__grid`, `.contact-form*`. |
| `.env.example` | Modificar | Tres variables nuevas. |
| `playwright.config.ts` | Modificar | `webServer.env` con dry-run. |
| `__tests__/lib/contact.test.ts` | Crear | |
| `__tests__/lib/resend.test.ts` | Crear | |
| `__tests__/actions/contact.test.ts` | Crear | |
| `__tests__/components/ContactForm.test.tsx` | Crear | |
| `__tests__/components/Button.test.tsx` | Modificar | |
| `__tests__/components/Closing.test.tsx` | Modificar | |
| `__tests__/design/tokens.test.ts` | Modificar | `--danger` en ambos temas. |
| `e2e/contact.spec.ts` | Crear | |

---

### Task 1: Lógica pura del contacto (`lib/contact.ts`)

**Files:**
- Create: `lib/contact.ts`
- Test: `__tests__/lib/contact.test.ts`

**Interfaces:**
- Consumes: `isLocale`, `defaultLocale`, `type Locale` de `@/lib/i18n`.
- Produces (exports exactos que usan las tareas 3 y 5):
  - `PROJECT_TYPES: readonly ["website","landing","ecommerce","webapp","mobile","other"]`
  - `type ProjectType`
  - `PROJECT_TYPE_LABELS_ES: Record<ProjectType, string>`
  - `LIMITS: { name: 80; email: 254; message: 2000 }`
  - `MIN_FILL_MS = 2000`
  - `type ContactField = "name" | "email" | "message"`
  - `type FieldErrorCode = "required" | "too_long" | "invalid"`
  - `type ContactErrors = Partial<Record<ContactField, FieldErrorCode>> & { form?: "send_failed" }`
  - `type ContactValues = { name: string; email: string; projectTypes: ProjectType[]; message: string }`
  - `type ContactData = ContactValues & { locale: Locale }`
  - `type ContactState = { status: "idle" } | { status: "success" } | { status: "error"; errors: ContactErrors; values: ContactValues }`
  - `validateContact(formData: FormData): { ok: true; data: ContactData } | { ok: false; errors: ContactErrors; values: ContactValues }`
  - `isLikelyBot(formData: FormData, now: number): boolean`
  - `buildEmail(data: ContactData): { subject: string; text: string; replyTo: string }`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `__tests__/lib/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildEmail, isLikelyBot, validateContact, type ContactData } from "@/lib/contact";

function fd(entries: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    for (const item of Array.isArray(v) ? v : [v]) f.append(k, item);
  }
  return f;
}

const valid = { name: "Ana", email: "ana@example.com", lang: "es" };

describe("validateContact", () => {
  it("acepta el mínimo (nombre + email) y aplica trim", () => {
    const r = validateContact(fd({ name: "  Ana  ", email: " ana@example.com ", lang: "en" }));
    expect(r).toEqual({
      ok: true,
      data: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "", locale: "en" },
    });
  });

  it("colapsa el whitespace interno del nombre (sin saltos de línea)", () => {
    const r = validateContact(fd({ ...valid, name: "Ana\r\n\tMaría   Pérez" }));
    expect(r.ok && r.data.name).toBe("Ana María Pérez");
  });

  it("nombre vacío → required; 80 ok; 81 → too_long", () => {
    const empty = validateContact(fd({ ...valid, name: "   " }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.name).toBe("required");

    expect(validateContact(fd({ ...valid, name: "a".repeat(80) })).ok).toBe(true);

    const long = validateContact(fd({ ...valid, name: "a".repeat(81) }));
    expect(!long.ok && long.errors.name).toBe("too_long");
  });

  it("email vacío → required; mal formado → invalid; >254 → invalid", () => {
    const empty = validateContact(fd({ ...valid, email: "" }));
    expect(!empty.ok && empty.errors.email).toBe("required");

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

  it("mensaje opcional; 2000 ok; 2001 → too_long", () => {
    expect(validateContact(fd({ ...valid, message: "a".repeat(2000) })).ok).toBe(true);
    const r = validateContact(fd({ ...valid, message: "a".repeat(2001) }));
    expect(!r.ok && r.errors.message).toBe("too_long");
  });

  it("chips: descarta inválidos y duplicados, y ordena como PROJECT_TYPES", () => {
    const r = validateContact(fd({ ...valid, projectType: ["webapp", "hacker", "website", "webapp"] }));
    expect(r.ok && r.data.projectTypes).toEqual(["website", "webapp"]);
  });

  it("lang inválido o ausente → es", () => {
    const r1 = validateContact(fd({ name: "Ana", email: "ana@example.com", lang: "fr" }));
    const r2 = validateContact(fd({ name: "Ana", email: "ana@example.com" }));
    expect(r1.ok && r1.data.locale).toBe("es");
    expect(r2.ok && r2.data.locale).toBe("es");
  });

  it("con errores devuelve values normalizados para rehidratar el formulario", () => {
    const r = validateContact(fd({ name: "  Ana ", email: "mal", projectType: ["mobile", "x"], message: " hola " }));
    expect(r).toEqual({
      ok: false,
      errors: { email: "invalid" },
      values: { name: "Ana", email: "mal", projectTypes: ["mobile"], message: "hola" },
    });
  });
});

describe("isLikelyBot", () => {
  const now = 1_000_000;

  it("honeypot con contenido → bot", () => {
    expect(isLikelyBot(fd({ website: "http://spam", startedAt: String(now - 10_000) }), now)).toBe(true);
  });

  it("honeypot vacío o solo espacios → no es bot por el honeypot", () => {
    expect(isLikelyBot(fd({ website: "  ", startedAt: String(now - 10_000) }), now)).toBe(false);
  });

  it("menos de 2000 ms → bot; 2000 ms o más → no", () => {
    expect(isLikelyBot(fd({ startedAt: String(now - 1999) }), now)).toBe(true);
    expect(isLikelyBot(fd({ startedAt: String(now - 2000) }), now)).toBe(false);
  });

  it("startedAt ausente, vacío o no numérico → no se rechaza (usuario sin JS)", () => {
    expect(isLikelyBot(fd({}), now)).toBe(false);
    expect(isLikelyBot(fd({ startedAt: "" }), now)).toBe(false);
    expect(isLikelyBot(fd({ startedAt: "abc" }), now)).toBe(false);
  });

  it("startedAt en el futuro (reloj del cliente adelantado) → no se rechaza", () => {
    expect(isLikelyBot(fd({ startedAt: String(now + 60_000) }), now)).toBe(false);
  });
});

describe("buildEmail", () => {
  const base: ContactData = { name: "Ana", email: "ana@example.com", projectTypes: [], message: "", locale: "es" };

  it("sin chips ni mensaje", () => {
    expect(buildEmail(base)).toEqual({
      subject: "Nuevo contacto: Ana",
      replyTo: "ana@example.com",
      text: [
        "Nombre: Ana",
        "Email: ana@example.com",
        "Qué necesita: —",
        "Idioma del sitio: es",
        "",
        "Mensaje:",
        "—",
      ].join("\n"),
    });
  });

  it("con chips (etiquetas en español) y mensaje, aunque el sitio esté en inglés", () => {
    const r = buildEmail({ ...base, projectTypes: ["ecommerce", "webapp"], message: "Hola\nqué tal", locale: "en" });
    expect(r.subject).toBe("Nuevo contacto: Ana · E-commerce, Web app");
    expect(r.text).toContain("Qué necesita: E-commerce, Web app");
    expect(r.text).toContain("Idioma del sitio: en");
    expect(r.text.endsWith("Mensaje:\nHola\nqué tal")).toBe(true);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run __tests__/lib/contact.test.ts`
Expected: FAIL, porque no se puede resolver `@/lib/contact`.

- [ ] **Step 3: Implementar `lib/contact.ts`**

```ts
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

export const PROJECT_TYPES = ["website", "landing", "ecommerce", "webapp", "mobile", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

/** Etiquetas fijas para el mail: siempre en español, sin importar el idioma del visitante. */
export const PROJECT_TYPE_LABELS_ES: Record<ProjectType, string> = {
  website: "Sitio web",
  landing: "Landing page",
  ecommerce: "E-commerce",
  webapp: "Web app",
  mobile: "App móvil",
  other: "Otro",
};

export const LIMITS = { name: 80, email: 254, message: 2000 } as const;
export const MIN_FILL_MS = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactField = "name" | "email" | "message";
export type FieldErrorCode = "required" | "too_long" | "invalid";
export type ContactErrors = Partial<Record<ContactField, FieldErrorCode>> & { form?: "send_failed" };
export type ContactValues = { name: string; email: string; projectTypes: ProjectType[]; message: string };
export type ContactData = ContactValues & { locale: Locale };
export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: ContactErrors; values: ContactValues };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function projectTypes(formData: FormData): ProjectType[] {
  const picked = new Set(formData.getAll("projectType").filter((v): v is string => typeof v === "string"));
  return PROJECT_TYPES.filter((type) => picked.has(type));
}

export function validateContact(
  formData: FormData,
): { ok: true; data: ContactData } | { ok: false; errors: ContactErrors; values: ContactValues } {
  const values: ContactValues = {
    // El nombre va al asunto del mail: una sola línea.
    name: text(formData, "name").replace(/\s+/g, " "),
    email: text(formData, "email"),
    projectTypes: projectTypes(formData),
    message: text(formData, "message"),
  };

  const errors: ContactErrors = {};
  if (!values.name) errors.name = "required";
  else if (values.name.length > LIMITS.name) errors.name = "too_long";

  if (!values.email) errors.email = "required";
  else if (values.email.length > LIMITS.email || !EMAIL_RE.test(values.email)) errors.email = "invalid";

  if (values.message.length > LIMITS.message) errors.message = "too_long";

  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  const lang = text(formData, "lang");
  return { ok: true, data: { ...values, locale: isLocale(lang) ? lang : defaultLocale } };
}

export function isLikelyBot(formData: FormData, now: number): boolean {
  if (text(formData, "website") !== "") return true;

  const raw = text(formData, "startedAt");
  // Sin startedAt (usuario sin JS) no se puede juzgar: queda solo el honeypot.
  if (raw === "") return false;
  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) return false;

  const elapsed = now - startedAt;
  // Negativo = reloj del cliente adelantado respecto al servidor: no se puede juzgar.
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

export function buildEmail(data: ContactData): { subject: string; text: string; replyTo: string } {
  const types = data.projectTypes.map((type) => PROJECT_TYPE_LABELS_ES[type]).join(", ");
  const subject = types ? `Nuevo contacto: ${data.name} · ${types}` : `Nuevo contacto: ${data.name}`;
  const body = [
    `Nombre: ${data.name}`,
    `Email: ${data.email}`,
    `Qué necesita: ${types || "—"}`,
    `Idioma del sitio: ${data.locale}`,
    "",
    "Mensaje:",
    data.message || "—",
  ].join("\n");
  return { subject, text: body, replyTo: data.email };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npx vitest run __tests__/lib/contact.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add lib/contact.ts __tests__/lib/contact.test.ts
git commit -m "feat: lógica pura del formulario de contacto (validación, anti-bot, mail)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cliente de Resend (`lib/resend.ts`)

**Files:**
- Create: `lib/resend.ts`
- Test: `__tests__/lib/resend.test.ts`

**Interfaces:**
- Consumes: nada del proyecto.
- Produces:
  - `type EmailMessage = { from: string; to: string; replyTo: string; subject: string; text: string }`
  - `sendEmail(msg: EmailMessage): Promise<{ ok: boolean }>`: nunca lanza. Lee `RESEND_API_KEY` y `CONTACT_DRY_RUN` de `process.env` en cada llamada.
  - `RESEND_TIMEOUT_MS = 10_000`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `__tests__/lib/resend.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RESEND_TIMEOUT_MS, sendEmail, type EmailMessage } from "@/lib/resend";

const msg: EmailMessage = {
  from: "Flexora <onboarding@resend.dev>",
  to: "hola@example.com",
  replyTo: "ana@example.com",
  subject: "Nuevo contacto: Ana",
  text: "cuerpo",
};

describe("sendEmail", () => {
  const fetchMock = vi.fn();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "re_secret_123");
    vi.stubEnv("CONTACT_DRY_RUN", "");
  });

  afterEach(() => {
    fetchMock.mockReset();
    errorSpy.mockClear();
    infoSpy.mockClear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("hace POST a Resend con auth, reply_to y to como array", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer re_secret_123", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({
      from: msg.from,
      to: [msg.to],
      reply_to: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("respuesta no-2xx → { ok: false } y loguea status sin la API key", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"invalid"}', { status: 422 }));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: false });
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("422");
    expect(logged).not.toContain("re_secret_123");
  });

  it("fetch lanza (red caída o timeout) → { ok: false } sin propagar", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: false });
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("re_secret_123");
  });

  it("usa un timeout de 10 s", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail(msg);
    expect(RESEND_TIMEOUT_MS).toBe(10_000);
    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    timeoutSpy.mockRestore();
  });

  it("CONTACT_DRY_RUN=1 → no llama a fetch y devuelve ok", async () => {
    vi.stubEnv("CONTACT_DRY_RUN", "1");
    await expect(sendEmail(msg)).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run __tests__/lib/resend.test.ts`
Expected: FAIL, porque no se puede resolver `@/lib/resend`.

- [ ] **Step 3: Implementar `lib/resend.ts`**

```ts
export type EmailMessage = { from: string; to: string; replyTo: string; subject: string; text: string };

const RESEND_URL = "https://api.resend.com/emails";
export const RESEND_TIMEOUT_MS = 10_000;

/** Envía un mail por la API REST de Resend. Nunca lanza: devuelve { ok }. */
export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean }> {
  if (process.env.CONTACT_DRY_RUN === "1") {
    console.info(`[contact] dry run, no se envía: ${msg.subject}`);
    return { ok: true };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: msg.from,
        to: [msg.to],
        reply_to: msg.replyTo,
        subject: msg.subject,
        text: msg.text,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[contact] Resend respondió ${res.status}: ${body}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[contact] no se pudo llamar a Resend:", err instanceof Error ? err.message : String(err));
    return { ok: false };
  }
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npx vitest run __tests__/lib/resend.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/resend.ts __tests__/lib/resend.test.ts
git commit -m "feat: cliente mínimo de la API de Resend con timeout y dry run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Server Action + variables de entorno

**Files:**
- Create: `app/[lang]/actions/contact.ts`
- Modify: `.env.example`
- Test: `__tests__/actions/contact.test.ts`

**Interfaces:**
- Consumes: `validateContact`, `isLikelyBot`, `buildEmail`, `type ContactState`, `type ContactValues` de `@/lib/contact` (Task 1); `sendEmail` de `@/lib/resend` (Task 2).
- Produces: `contactAction(prev: ContactState, formData: FormData): Promise<ContactState>`, exportada desde `@/app/[lang]/actions/contact`. Es el **único** export del archivo (`"use server"` solo admite exports de funciones async).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `__tests__/actions/contact.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn();
vi.mock("@/lib/resend", () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));

import { contactAction } from "@/app/[lang]/actions/contact";

const IDLE = { status: "idle" } as const;

function form(overrides: Record<string, string | string[]> = {}): FormData {
  const entries: Record<string, string | string[]> = {
    name: "Ana",
    email: "ana@example.com",
    projectType: ["webapp"],
    message: "Hola",
    lang: "es",
    website: "",
    startedAt: String(Date.now() - 10_000),
    ...overrides,
  };
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) for (const item of Array.isArray(v) ? v : [v]) f.append(k, item);
  return f;
}

describe("contactAction", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("CONTACT_TO_EMAIL", "hola@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "Flexora <onboarding@resend.dev>");
    vi.stubEnv("CONTACT_DRY_RUN", "");
    sendEmail.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    sendEmail.mockReset();
    errorSpy.mockClear();
    vi.unstubAllEnvs();
  });

  it("caso correcto → success y envía con from/to/replyTo/subject", async () => {
    await expect(contactAction(IDLE, form())).resolves.toEqual({ status: "success" });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      from: "Flexora <onboarding@resend.dev>",
      to: "hola@example.com",
      replyTo: "ana@example.com",
      subject: "Nuevo contacto: Ana · Web app",
    });
  });

  it("bot (honeypot) → success sin enviar", async () => {
    await expect(contactAction(IDLE, form({ website: "spam" }))).resolves.toEqual({ status: "success" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("bot (demasiado rápido) → success sin enviar", async () => {
    await expect(contactAction(IDLE, form({ startedAt: String(Date.now()) }))).resolves.toEqual({ status: "success" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("inválido → error con códigos y values, sin enviar", async () => {
    const r = await contactAction(IDLE, form({ name: "", email: "mal" }));
    expect(r).toEqual({
      status: "error",
      errors: { name: "required", email: "invalid" },
      values: { name: "", email: "mal", projectTypes: ["webapp"], message: "Hola" },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each(["CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL", "RESEND_API_KEY"])(
    "falta %s → send_failed sin enviar, y lo loguea",
    async (key) => {
      vi.stubEnv(key, "");
      const r = await contactAction(IDLE, form());
      expect(r).toEqual({
        status: "error",
        errors: { form: "send_failed" },
        values: { name: "Ana", email: "ana@example.com", projectTypes: ["webapp"], message: "Hola" },
      });
      expect(sendEmail).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    },
  );

  it("en dry run no exige RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_DRY_RUN", "1");
    await expect(contactAction(IDLE, form())).resolves.toEqual({ status: "success" });
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("el envío falla → send_failed con values", async () => {
    sendEmail.mockResolvedValue({ ok: false });
    const r = await contactAction(IDLE, form());
    expect(r).toMatchObject({ status: "error", errors: { form: "send_failed" } });
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npx vitest run __tests__/actions/contact.test.ts`
Expected: FAIL, porque no se puede resolver `@/app/[lang]/actions/contact`.

- [ ] **Step 3: Implementar la acción**

Crear `app/[lang]/actions/contact.ts`:

```ts
"use server";

import { buildEmail, isLikelyBot, validateContact, type ContactState } from "@/lib/contact";
import { sendEmail } from "@/lib/resend";

export async function contactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // A un bot se le responde éxito para que no reintente con otra estrategia.
  if (isLikelyBot(formData, Date.now())) return { status: "success" };

  const result = validateContact(formData);
  if (!result.ok) return { status: "error", errors: result.errors, values: result.values };

  const { locale: _locale, ...values } = result.data;
  const failed: ContactState = { status: "error", errors: { form: "send_failed" }, values };

  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  const dryRun = process.env.CONTACT_DRY_RUN === "1";
  if (!to || !from || (!dryRun && !process.env.RESEND_API_KEY)) {
    console.error("[contact] faltan variables de entorno: CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL y/o RESEND_API_KEY");
    return failed;
  }

  const { ok } = await sendEmail({ from, to, ...buildEmail(result.data) });
  return ok ? { status: "success" } : failed;
}
```

Si `npm run lint` marca `_locale` como variable sin usar, agregar arriba de esa línea `// eslint-disable-next-line @typescript-eslint/no-unused-vars` (mismo patrón que `components/ui/Button.tsx`).

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npx vitest run __tests__/actions/contact.test.ts`
Expected: PASS.

- [ ] **Step 5: Documentar las variables en `.env.example`**

Agregar al final de `.env.example`:

```bash
# --- Formulario de contacto (server-only, nunca NEXT_PUBLIC_) ---
# La crea la integración de Resend en Vercel Marketplace (resend/resend-email)
RESEND_API_KEY=
# Casilla que recibe los mensajes. Sin dominio verificado en Resend, tiene que
# ser la misma casilla con la que se creó la cuenta de Resend.
CONTACT_TO_EMAIL=
# Remitente. Sin dominio: el de prueba de Resend. Con dominio verificado:
# Flexora <contacto@tudominio>
CONTACT_FROM_EMAIL=Flexora <onboarding@resend.dev>
# Solo e2e: "1" no envía nada. Nunca en producción.
CONTACT_DRY_RUN=
```

- [ ] **Step 6: Lint y commit**

Run: `npm run lint`
Expected: sin errores.

```bash
git add "app/[lang]/actions/contact.ts" __tests__/actions/contact.test.ts .env.example
git commit -m "feat: server action del formulario de contacto

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `Button` acepta `type="submit"`

**Files:**
- Modify: `components/ui/Button.tsx`
- Test: `__tests__/components/Button.test.tsx`

**Interfaces:**
- Produces: `<Button type="submit">` renderiza `<button type="submit">`. Sin `type` sigue siendo `"button"`. La variante link no cambia.

- [ ] **Step 1: Agregar el test que falla**

En `__tests__/components/Button.test.tsx`, dentro del `describe("Button")`, agregar:

```tsx
  it("acepta type=submit y por defecto sigue siendo button", () => {
    render(
      <>
        <Button type="submit">Enviar</Button>
        <Button>Otro</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Enviar" }).getAttribute("type")).toBe("submit");
    expect(screen.getByRole("button", { name: "Otro" }).getAttribute("type")).toBe("button");
  });
```

- [ ] **Step 2: Verificar que falla**

Run: `npx tsc --noEmit`
Expected: FAIL con un error de tipos en `Button.test.tsx`: `type` no existe en las props, porque está en el `Omit`. Vitest no chequea tipos, y en runtime el `{...rest}` va después del `type="button"` hardcodeado, así que el test de Vitest puede pasar ya. El contrato que falta es el de TypeScript.

- [ ] **Step 3: Implementar**

En `components/ui/Button.tsx`, cambiar el tipo `ButtonProps` y la rama `<button>`:

```tsx
type ButtonProps = Common & {
  href?: undefined;
  external?: undefined;
  type?: "button" | "submit";
} & Omit<ComponentProps<"button">, "className" | "children" | "type">;
```

```tsx
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { href: _href, external: _external, variant: _variant, className: _className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
```

- [ ] **Step 4: Verificar que pasa**

Run: `npx tsc --noEmit` y `npx vitest run __tests__/components/Button.test.tsx`
Expected: sin errores de tipos; PASS (los 5 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx __tests__/components/Button.test.tsx
git commit -m "feat: Button acepta type=submit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `ContactForm`: copy, componente y estilos

**Files:**
- Modify: `app/[lang]/dictionaries/es.json`, `app/[lang]/dictionaries/en.json`
- Create: `components/site/ContactForm.tsx`
- Modify: `app/globals.css` (token `--danger` + estilos `.contact-form*`)
- Modify: `__tests__/design/tokens.test.ts`
- Test: `__tests__/components/ContactForm.test.tsx`

**Interfaces:**
- Consumes: `contactAction` (Task 3); `PROJECT_TYPES`, `LIMITS`, `type ContactField`, `type ContactState` (Task 1); `Button` con `type="submit"` (Task 4); `TextLink` de `@/components/ui/TextLink`; `type Dictionary` de `@/app/[lang]/dictionaries`; `type Locale` de `@/lib/i18n`.
- Produces: `export function ContactForm(props: { t: Dictionary["closing"]["form"]; locale: Locale; whatsappHref: string })`.

- [ ] **Step 1: Agregar el copy**

En `app/[lang]/dictionaries/es.json`, dentro de `"closing"`, después de `"email": "info@flexoradesign.com"` (agregar la coma), sumar:

```json
    "form": {
      "formLabel": "Formulario de contacto",
      "nameLabel": "Nombre",
      "emailLabel": "Email",
      "projectLegend": "¿Qué necesitás?",
      "optional": "(opcional)",
      "messageLabel": "Mensaje",
      "messagePlaceholder": "Contanos un poco del proyecto",
      "submit": "Enviar",
      "sending": "Enviando…",
      "successTitle": "¡Listo!",
      "successBody": "Recibimos tu mensaje. Te respondemos en el día.",
      "sendAnother": "Enviar otro mensaje",
      "projectTypes": {
        "website": "Sitio web",
        "landing": "Landing page",
        "ecommerce": "E-commerce",
        "webapp": "Web app",
        "mobile": "App móvil",
        "other": "Otro"
      },
      "errors": {
        "required": "Este campo es obligatorio.",
        "invalid": "Ingresá un email válido.",
        "too_long": "Es demasiado largo.",
        "send_failed": "No pudimos enviarlo. Probá de nuevo o",
        "sendFailedLink": "escribinos por WhatsApp."
      }
    }
```

En `app/[lang]/dictionaries/en.json`, en el mismo lugar:

```json
    "form": {
      "formLabel": "Contact form",
      "nameLabel": "Name",
      "emailLabel": "Email",
      "projectLegend": "What do you need?",
      "optional": "(optional)",
      "messageLabel": "Message",
      "messagePlaceholder": "Tell us a bit about the project",
      "submit": "Send",
      "sending": "Sending…",
      "successTitle": "Done!",
      "successBody": "We got your message. We'll reply the same day.",
      "sendAnother": "Send another message",
      "projectTypes": {
        "website": "Website",
        "landing": "Landing page",
        "ecommerce": "E-commerce",
        "webapp": "Web app",
        "mobile": "Mobile app",
        "other": "Other"
      },
      "errors": {
        "required": "This field is required.",
        "invalid": "Enter a valid email.",
        "too_long": "This is too long.",
        "send_failed": "We couldn't send it. Try again or",
        "sendFailedLink": "message us on WhatsApp."
      }
    }
```

Run: `npx vitest run __tests__/i18n`
Expected: PASS (paridad y strings no vacíos).

- [ ] **Step 2: Escribir los tests del componente que fallan**

Crear `__tests__/components/ContactForm.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ContactState } from "@/lib/contact";

const actionMock = vi.fn<(prev: ContactState, formData: FormData) => Promise<ContactState>>();
vi.mock("@/app/[lang]/actions/contact", () => ({
  contactAction: (prev: ContactState, formData: FormData) => actionMock(prev, formData),
}));

import { ContactForm } from "@/components/site/ContactForm";
import es from "@/app/[lang]/dictionaries/es.json";

const t = es.closing.form;
const WA = "https://wa.me/1?text=x";

function setup() {
  const utils = render(<ContactForm t={t} locale="es" whatsappHref={WA} />);
  const form = screen.getByRole("form", { name: t.formLabel });
  return { ...utils, form };
}

async function submit(form: HTMLElement) {
  await act(async () => {
    fireEvent.submit(form);
  });
}

afterEach(() => actionMock.mockReset());

describe("ContactForm", () => {
  it("tiene labels visibles, fieldset con legend y 6 chips checkbox", () => {
    setup();
    expect(screen.getByLabelText(t.nameLabel)).toHaveProperty("required", true);
    expect(screen.getByLabelText(t.emailLabel)).toHaveProperty("type", "email");
    expect(screen.getByLabelText(new RegExp(t.messageLabel))).toHaveProperty("tagName", "TEXTAREA");
    const group = screen.getByRole("group", { name: new RegExp(t.projectLegend.replace("?", "\\?")) });
    expect(group.querySelectorAll('input[type="checkbox"][name="projectType"]')).toHaveLength(6);
    expect(screen.getByRole("checkbox", { name: t.projectTypes.webapp })).toHaveProperty("value", "webapp");
  });

  it("el honeypot queda fuera de la accesibilidad y del tab", () => {
    const { container } = setup();
    const hp = container.querySelector<HTMLInputElement>('input[name="website"]')!;
    expect(hp.tabIndex).toBe(-1);
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("completa startedAt al montar y manda lang", () => {
    const { container } = setup();
    expect(container.querySelector<HTMLInputElement>('input[name="startedAt"]')!.value).toMatch(/^\d+$/);
    expect(container.querySelector<HTMLInputElement>('input[name="lang"]')!.value).toBe("es");
  });

  it("con errores: marca aria-invalid, muestra el texto, enfoca el primero y conserva lo que vino del servidor", async () => {
    actionMock.mockResolvedValue({
      status: "error",
      errors: { email: "invalid" },
      values: { name: "Ana", email: "mal", projectTypes: ["webapp"], message: "hola" },
    });
    const { form } = setup();
    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "  Ana  " } });
    await submit(form);

    const email = await screen.findByLabelText(t.emailLabel);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const errorId = email.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)!.textContent).toBe(t.errors.invalid);
    expect(document.activeElement).toBe(email);

    // "Ana" (sin espacios) prueba que el valor viene de state.values y no del DOM previo.
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("Ana");
    expect((email as HTMLInputElement).value).toBe("mal");
    expect((screen.getByRole("checkbox", { name: t.projectTypes.webapp }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(new RegExp(t.messageLabel)) as HTMLTextAreaElement).value).toBe("hola");
    expect(screen.getByLabelText(t.nameLabel).getAttribute("aria-invalid")).toBeNull();
  });

  it("send_failed: muestra el mensaje con link a WhatsApp", async () => {
    actionMock.mockResolvedValue({
      status: "error",
      errors: { form: "send_failed" },
      values: { name: "Ana", email: "ana@example.com", projectTypes: [], message: "" },
    });
    const { form } = setup();
    await submit(form);
    expect(await screen.findByText(t.errors.send_failed, { exact: false })).toBeTruthy();
    expect(screen.getByRole("link", { name: t.errors.sendFailedLink }).getAttribute("href")).toBe(WA);
  });

  it("mientras envía: botón deshabilitado con texto de enviando", async () => {
    actionMock.mockReturnValue(new Promise(() => {}));
    const { form } = setup();
    await submit(form);
    const button = await screen.findByRole("button", { name: t.sending });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("éxito: reemplaza el formulario, enfoca el título y 'Enviar otro' lo restaura vacío", async () => {
    actionMock.mockResolvedValue({ status: "success" });
    const { form, container } = setup();
    fireEvent.change(screen.getByLabelText(t.nameLabel), { target: { value: "Ana" } });
    await submit(form);

    const title = await screen.findByRole("heading", { name: t.successTitle });
    expect(document.activeElement).toBe(title);
    expect(screen.queryByRole("form", { name: t.formLabel })).toBeNull();
    expect(screen.getByText(t.successBody)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t.sendAnother }));
    });
    expect(screen.getByRole("form", { name: t.formLabel })).toBeTruthy();
    expect((screen.getByLabelText(t.nameLabel) as HTMLInputElement).value).toBe("");
    expect(container.querySelector<HTMLInputElement>('input[name="startedAt"]')!.value).toMatch(/^\d+$/);
  });
});
```

- [ ] **Step 3: Verificar que fallan**

Run: `npx vitest run __tests__/components/ContactForm.test.tsx`
Expected: FAIL, porque no se puede resolver `@/components/site/ContactForm`.

- [ ] **Step 4: Implementar `components/site/ContactForm.tsx`**

```tsx
"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { LIMITS, PROJECT_TYPES, type ContactField, type ContactState } from "@/lib/contact";
import { contactAction } from "@/app/[lang]/actions/contact";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";

type Props = { t: Dictionary["closing"]["form"]; locale: Locale; whatsappHref: string };

const INITIAL_STATE: ContactState = { status: "idle" };
const FIELD_ORDER: ContactField[] = ["name", "email", "message"];

export function ContactForm(props: Props) {
  // Cambiar la key remonta el cuerpo: estado de la acción en idle y startedAt nuevo.
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="contact-form">
      <ContactFormBody key={formKey} {...props} onSendAnother={() => setFormKey((k) => k + 1)} />
    </div>
  );
}

function ContactFormBody({ t, locale, whatsappHref, onSendAnother }: Props & { onSendAnother: () => void }) {
  const [state, formAction, isPending] = useActionState(contactAction, INITIAL_STATE);
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const successTitleRef = useRef<HTMLHeadingElement>(null);

  // Se setea en el cliente: la página se prerenderiza en el build, un valor del servidor sería viejo.
  useEffect(() => {
    if (startedAtRef.current) startedAtRef.current.value = String(Date.now());
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      successTitleRef.current?.focus();
    } else if (state.status === "error") {
      const first = FIELD_ORDER.find((field) => state.errors[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  const errors = state.status === "error" ? state.errors : {};
  // React 19 resetea el form después de cada envío: los valores vuelven vía defaultValue.
  const values = state.status === "error" ? state.values : undefined;

  const fieldA11y = (field: ContactField) =>
    errors[field] ? { "aria-invalid": true as const, "aria-describedby": `${id}-${field}-error` } : {};
  const fieldError = (field: ContactField) => {
    const code = errors[field];
    return code ? (
      <p id={`${id}-${field}-error`} className="contact-form__error">
        {t.errors[code]}
      </p>
    ) : null;
  };

  return (
    <>
      {state.status !== "success" && (
        <form ref={formRef} action={formAction} aria-label={t.formLabel} className="contact-form__form">
          <input type="hidden" name="lang" value={locale} />
          <input ref={startedAtRef} type="hidden" name="startedAt" />
          <div className="contact-form__hp" aria-hidden="true">
            <label htmlFor={`${id}-website`}>Leave empty</label>
            <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>

          <div className="contact-form__field">
            <label htmlFor={`${id}-name`} className="contact-form__label">
              {t.nameLabel}
            </label>
            <input
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

          <div className="contact-form__field">
            <label htmlFor={`${id}-email`} className="contact-form__label">
              {t.emailLabel}
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              maxLength={LIMITS.email}
              autoComplete="email"
              defaultValue={values?.email}
              className="contact-form__input"
              {...fieldA11y("email")}
            />
            {fieldError("email")}
          </div>

          <fieldset className="contact-form__group">
            <legend className="contact-form__label">
              {t.projectLegend} <span className="contact-form__optional">{t.optional}</span>
            </legend>
            <div className="contact-form__chips">
              {PROJECT_TYPES.map((type) => (
                <label key={type} className="contact-form__chip">
                  <input
                    type="checkbox"
                    name="projectType"
                    value={type}
                    defaultChecked={values?.projectTypes.includes(type)}
                    className="contact-form__chip-input"
                  />
                  <span className="contact-form__chip-label">{t.projectTypes[type]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="contact-form__field">
            <label htmlFor={`${id}-message`} className="contact-form__label">
              {t.messageLabel} <span className="contact-form__optional">{t.optional}</span>
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              rows={4}
              maxLength={LIMITS.message}
              placeholder={t.messagePlaceholder}
              defaultValue={values?.message}
              className="contact-form__input contact-form__textarea"
              {...fieldA11y("message")}
            />
            {fieldError("message")}
          </div>

          <p className="contact-form__form-error" aria-live="polite">
            {errors.form === "send_failed" && (
              <>
                {t.errors.send_failed}{" "}
                <TextLink href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  {t.errors.sendFailedLink}
                </TextLink>
              </>
            )}
          </p>

          <div className="contact-form__submit">
            <Button type="submit" disabled={isPending} aria-disabled={isPending || undefined}>
              {isPending ? t.sending : t.submit}
            </Button>
          </div>
        </form>
      )}

      <div aria-live="polite" className="contact-form__live">
        {state.status === "success" && (
          <div className="contact-form__success">
            <h3 ref={successTitleRef} tabIndex={-1} className="h3 contact-form__success-title">
              {t.successTitle}
            </h3>
            <p className="contact-form__success-body">{t.successBody}</p>
            <Button variant="secondary" onClick={onSendAnother}>
              {t.sendAnother}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verificar que los tests pasan**

Run: `npx vitest run __tests__/components/ContactForm.test.tsx`
Expected: PASS. Si el test de "conserva lo que vino del servidor" falla porque el nombre queda `""` o `"  Ana  "`, **no lo debilites**: es el caso 4 del Review Focus. Revisá que los inputs usen `defaultValue={values?.x}` (no `value`) y que el estado de error traiga `values`.

- [ ] **Step 6: Token `--danger` (test primero)**

En `__tests__/design/tokens.test.ts`, agregar `"--danger"` al array `SEMANTIC`:

```ts
const SEMANTIC = ["--bg", "--surface", "--fg", "--fg-muted", "--border", "--accent", "--accent-soft", "--switch-half", "--danger"];
```

Run: `npx vitest run __tests__/design/tokens.test.ts`
Expected: FAIL (`--danger en :root`).

En `app/globals.css`:
- En `:root`, después de `--accent-text: var(--accent-soft);`:

```css
  /* Errores de formulario. Oscuro: 6.7:1 sobre --surface (#111114). */
  --danger: #ff6b6b;
```

- En `[data-theme="light"]`, después de `--accent-text: var(--accent);`:

```css
  /* Claro: 5.8:1 sobre --surface (#ffffff). */
  --danger: #c2253a;
```

- En `@theme inline`, después de `--color-accent-text: var(--accent-text);`:

```css
  --color-danger: var(--danger);
```

Run: `npx vitest run __tests__/design/tokens.test.ts`
Expected: PASS.

- [ ] **Step 7: Estilos del formulario**

Agregar al final de `app/globals.css`:

```css
/* ---------- Contact form ---------- */
.contact-form {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: clamp(1.25rem, 3vw, 2rem);
}
.contact-form__form {
  display: grid;
  gap: 1.25rem;
}
.contact-form__field {
  display: grid;
  gap: 0.5rem;
}
.contact-form__label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--fg);
}
.contact-form__optional {
  font-weight: 400;
  color: var(--fg-muted);
}
.contact-form__input {
  width: 100%;
  min-height: 48px;
  padding: 0.625rem 0.875rem;
  font: inherit;
  color: var(--fg);
  background: var(--bg);
  /* --fg-muted y no --border: el borde de un input tiene que llegar a 3:1 (WCAG 1.4.11). */
  border: 1px solid var(--fg-muted);
  border-radius: var(--radius-sm);
  transition: border-color var(--dur-base) var(--ease-out);
}
.contact-form__input::placeholder {
  color: var(--fg-muted);
}
.contact-form__input:hover {
  border-color: var(--fg);
}
.contact-form__input:focus-visible {
  border-color: var(--accent);
}
.contact-form__input[aria-invalid="true"] {
  border-color: var(--danger);
}
.contact-form__textarea {
  min-height: 7.5rem;
  resize: vertical;
}
.contact-form__group {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.contact-form__group legend {
  padding: 0;
  margin-bottom: 0.75rem;
}
.contact-form__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.contact-form__chip {
  position: relative;
  display: inline-flex;
}
.contact-form__chip-input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.contact-form__chip-label {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0.375rem 0.875rem;
  font-size: 0.9375rem;
  color: var(--fg);
  border: 1px solid var(--fg-muted);
  border-radius: 999px;
  transition:
    background-color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out);
}
.contact-form__chip-input:hover + .contact-form__chip-label {
  border-color: var(--fg);
}
.contact-form__chip-input:checked + .contact-form__chip-label {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
/* El input es invisible (opacity 0): el anillo de foco global se dibuja en la pastilla. */
.contact-form__chip-input:focus-visible + .contact-form__chip-label {
  outline: 2px solid var(--accent-soft);
  outline-offset: 3px;
}
.contact-form__error,
.contact-form__form-error {
  font-size: 0.875rem;
  color: var(--danger);
}
.contact-form__form-error:empty {
  display: none;
}
.contact-form__form-error .text-link {
  color: var(--fg);
}
.contact-form__submit {
  display: flex;
  justify-content: flex-end;
}
.contact-form__hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.contact-form__success {
  display: grid;
  gap: 1rem;
  justify-items: start;
}
.contact-form__success-body {
  color: var(--fg-muted);
}
@media (prefers-reduced-motion: reduce) {
  .contact-form__input,
  .contact-form__chip-label {
    transition: none;
  }
}
```

Run: `npx vitest run __tests__/design/tokens.test.ts`
Expected: PASS (no hay `transition: all` ni `ease-in`).

- [ ] **Step 8: Suite completa + lint**

Run: `npm run test` y `npm run lint`
Expected: todo PASS, sin errores de lint.

- [ ] **Step 9: Commit**

```bash
git add components/site/ContactForm.tsx __tests__/components/ContactForm.test.tsx "app/[lang]/dictionaries/es.json" "app/[lang]/dictionaries/en.json" app/globals.css __tests__/design/tokens.test.ts
git commit -m "feat: componente ContactForm con estados, a11y y token --danger

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Integrar el formulario en `Closing`

**Files:**
- Modify: `components/site/Closing.tsx`
- Modify: `app/[lang]/page.tsx`
- Modify: `app/globals.css` (bloque `/* ---------- Closing ---------- */`)
- Test: `__tests__/components/Closing.test.tsx`

**Interfaces:**
- Consumes: `ContactForm` (Task 5).
- Produces: `Closing({ t, whatsappHref, locale }: { t: Dictionary["closing"]; whatsappHref: string; locale: Locale })`.

- [ ] **Step 1: Actualizar el test (falla)**

Reemplazar el contenido de `__tests__/components/Closing.test.tsx` por:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});
vi.mock("@/app/[lang]/actions/contact", () => ({ contactAction: vi.fn() }));

import { Closing } from "@/components/site/Closing";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Closing", () => {
  it("tiene id contact, CTA a WhatsApp y mail alternativo", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    expect(document.getElementById("contact")).not.toBeNull();
    expect(screen.getByRole("link", { name: es.closing.primary }).getAttribute("href")).toBe("https://wa.me/1?text=x");
    expect(screen.getByRole("link", { name: es.closing.email }).getAttribute("href")).toBe(`mailto:${es.closing.email}`);
  });

  it("incluye el formulario de contacto dentro de #contact", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    const form = screen.getByRole("form", { name: es.closing.form.formLabel });
    expect(document.getElementById("contact")!.contains(form)).toBe(true);
  });
});
```

Run: `npx vitest run __tests__/components/Closing.test.tsx`
Expected: FAIL (no encuentra el `form`).

- [ ] **Step 2: Implementar `Closing`**

Reemplazar `components/site/Closing.tsx` por:

```tsx
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { FlexField } from "@/components/gl/FlexField";
import { Reveal } from "./Reveal";
import { ContactForm } from "./ContactForm";

export function Closing({
  t,
  whatsappHref,
  locale,
}: {
  t: Dictionary["closing"];
  whatsappHref: string;
  locale: Locale;
}) {
  return (
    <section id="contact" className="closing" aria-labelledby="closing-title">
      <FlexField variant="closing" />
      <Reveal className="container-site closing__content">
        <h2 id="closing-title" className="display closing__title">{t.title}</h2>
        <div className="closing__grid">
          <div className="closing__intro">
            <p className="closing__desc measure">{t.description}</p>
            <div className="closing__actions">
              <Button href={whatsappHref} external>{t.primary}</Button>
              <p className="closing__email">
                {t.emailLabel} <TextLink href={`mailto:${t.email}`}>{t.email}</TextLink>
              </p>
            </div>
          </div>
          <ContactForm t={t.form} locale={locale} whatsappHref={whatsappHref} />
        </div>
      </Reveal>
    </section>
  );
}
```

En `app/[lang]/page.tsx`, cambiar la línea de `Closing`:

```tsx
      <Closing t={dict.closing} whatsappHref={wa} locale={locale} />
```

- [ ] **Step 3: Layout CSS**

En `app/globals.css`, en el bloque Closing, después de la regla `.closing__desc { … }`, agregar:

```css
.closing__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: start;
}
.closing__intro {
  display: grid;
  gap: 1.5rem;
  align-content: start;
}
@media (min-width: 900px) {
  .closing__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
```

No toques `.closing__title`: el título sigue siendo de ancho completo (hermano del grid, no hijo).

- [ ] **Step 4: Verificar**

Run: `npx vitest run __tests__/components/Closing.test.tsx` y después `npm run test` y `npm run lint`
Expected: todo PASS.

- [ ] **Step 5: Commit**

```bash
git add components/site/Closing.tsx "app/[lang]/page.tsx" app/globals.css __tests__/components/Closing.test.tsx
git commit -m "feat: formulario de contacto dentro de Closing, en dos columnas desde 900px

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: E2E, build y revisión visual

**Files:**
- Modify: `playwright.config.ts`
- Create: `e2e/contact.spec.ts`

**Interfaces:**
- Consumes: todo lo anterior, a través del navegador.

- [ ] **Step 1: Dry run en el servidor de e2e**

En `playwright.config.ts`, dentro de `webServer`, agregar:

```ts
    // El formulario de contacto no envía mails en e2e (ver lib/resend.ts).
    env: {
      CONTACT_DRY_RUN: "1",
      CONTACT_TO_EMAIL: "e2e@example.com",
      CONTACT_FROM_EMAIL: "Flexora <onboarding@resend.dev>",
    },
```

Nota: con `reuseExistingServer: !process.env.CI`, si ya hay un `npm run dev` o `start` corriendo en :3000 **sin** esas variables, Playwright lo reusa y el envío da `send_failed`. Cortá cualquier server en :3000 antes de correr e2e.

- [ ] **Step 2: Escribir `e2e/contact.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import es from "../app/[lang]/dictionaries/es.json";
import en from "../app/[lang]/dictionaries/en.json";

const DICTS = { es, en } as const;

for (const lang of ["es", "en"] as const) {
  const t = DICTS[lang].closing.form;

  test(`contacto ${lang}: envío correcto muestra el éxito y permite enviar otro`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example.com");
    await form.getByRole("checkbox", { name: t.projectTypes.webapp }).check();
    await form.getByRole("checkbox", { name: t.projectTypes.ecommerce }).check();
    await form.getByLabel(t.messageLabel).fill("Hola, quiero una web app.");

    // Tiempo mínimo anti-bot: 2000 ms desde el montaje.
    await page.waitForTimeout(2100);
    await form.getByRole("button", { name: t.submit }).click();

    const title = page.getByRole("heading", { name: t.successTitle });
    await expect(title).toBeVisible();
    await expect(title).toBeFocused();
    await expect(page.getByRole("form", { name: t.formLabel })).toHaveCount(0);

    await page.getByRole("button", { name: t.sendAnother }).click();
    const again = page.getByRole("form", { name: t.formLabel });
    await expect(again.getByLabel(t.nameLabel, { exact: true })).toHaveValue("");
  });

  test(`contacto ${lang}: email que pasa el navegador pero no el servidor muestra el error y conserva el nombre`, async ({ page }) => {
    await page.goto(`/${lang}`);
    const form = page.getByRole("form", { name: t.formLabel });
    await form.scrollIntoViewIfNeeded();

    await form.getByLabel(t.nameLabel, { exact: true }).fill("Ana Test");
    // type=email del navegador acepta "ana@example"; el servidor exige un punto en el dominio.
    await form.getByLabel(t.emailLabel, { exact: true }).fill("ana@example");
    await page.waitForTimeout(2100);
    await form.getByRole("button", { name: t.submit }).click();

    await expect(form.getByText(t.errors.invalid)).toBeVisible();
    await expect(form.getByLabel(t.emailLabel, { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel(t.nameLabel, { exact: true })).toHaveValue("Ana Test");
  });
}
```

Si TypeScript o Playwright se quejan del import de JSON con `[lang]` en la ruta, usar la misma forma que el resto del repo (`@/app/[lang]/dictionaries/es.json` si el tsconfig de Playwright resuelve alias; si no, la ruta relativa de arriba).

- [ ] **Step 3: Correr e2e**

Run: `npx playwright test e2e/contact.spec.ts e2e/a11y.spec.ts e2e/home.spec.ts`
Expected: PASS en los proyectos `desktop` y `mobile`. `a11y.spec.ts` sin violaciones de axe con el formulario en la página. `home.spec.ts` sin scroll horizontal ni errores de consola.

- [ ] **Step 4: Suite completa**

Run: `npm run test`, `npm run lint` y `npm run e2e`
Expected: todo PASS.

- [ ] **Step 5: Revisión visual**

Con `npm run build && npm run start` corriendo en otra terminal:

Run: `node scripts/capture-review.mjs`
Expected: se generan `.impeccable/review/{desktop,mobile}-{dark,light}.png`. Abrirlos y verificar:
- Desktop 1440: "HABLEMOS" a ancho completo, debajo dos columnas (intro | panel del formulario).
- Mobile 390: apilado (título → descripción → WhatsApp/mail → formulario), sin desborde horizontal.
- En los dos temas, el panel se lee bien sobre el WebGL, los bordes de inputs y chips son claramente visibles (Review Focus 5), los chips marcados se distinguen y el botón Enviar queda alineado a la derecha.

Si algo no cumple, ajustar solo el CSS de las Tasks 5 y 6 y volver a capturar.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e/contact.spec.ts
git commit -m "test: e2e del formulario de contacto con dry run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Después del plan (manual, fuera del código)

1. Crear la casilla de destino.
2. Instalar Resend desde Vercel Marketplace (`vercel integration add resend/resend-email`) con esa casilla.
3. Cargar `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` en Vercel; `vercel env pull`.
4. Probar un envío real en un preview deploy.
