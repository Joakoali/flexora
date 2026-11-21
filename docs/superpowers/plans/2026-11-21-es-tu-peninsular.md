# Español peninsular (tú) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pasar `app/[lang]/dictionaries/es.json` de voseo rioplatense a tú peninsular y dejar un test que impida que el voseo vuelva.

**Architecture:** Un test nuevo (`__tests__/i18n/es-register.test.ts`) recorre todos los strings de `es.json` contra una lista explícita de formas de voseo. Se escribe primero y falla; después se editan las 13 cadenas del diccionario hasta que pasa. No cambia ninguna clave, así que la paridad con en/ca no se toca.

**Tech Stack:** Vitest, JSON, Playwright (solo para verificar).

**Spec:** `docs/superpowers/specs/2026-11-21-es-tu-peninsular-design.md`. Rama: `feature/es-tu-peninsular` (ya existe; no crear otra).

---

### Task 1: Test anti-voseo (rojo)

**Files:**
- Create: `__tests__/i18n/es-register.test.ts`

- [ ] **Step 1: Escribir el test**

```ts
import { describe, expect, it } from "vitest";
import es from "@/app/[lang]/dictionaries/es.json";

// Formas de voseo que no deben aparecer en el español del sitio (tú peninsular).
// Lista explícita y no una regla por terminación (-ás, -és): esa daría falsos
// positivos con «además», «después», «también». Se amplía cuando aparezca una forma nueva.
const VOSEO = [
  "contanos",
  "escribinos",
  "dejanos",
  "probá",
  "ingresá",
  "revisá",
  "empezá",
  "necesitás",
  "querés",
  "tenés",
  "podés",
  "hablás",
  "sabés",
  "vos",
  "sos",
  "mirá",
  "fijate",
  "acá",
];

// \b de JS no entiende las tildes, por eso los límites de palabra son lookarounds sobre \p{L}.
const VOSEO_RE = new RegExp(`(?<!\\p{L})(${VOSEO.join("|")})(?!\\p{L})`, "iu");

function strings(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  }
  return [];
}

describe("es.json: registro", () => {
  it("no usa voseo (el español del sitio es tú peninsular)", () => {
    const found = strings(es, "es")
      .map(([path, text]) => ({ path, match: text.match(VOSEO_RE)?.[0] }))
      .filter((r) => r.match)
      .map((r) => `${r.path}: «${r.match}»`);
    expect(found).toEqual([]);
  });

  it("el detector reconoce voseo y no da falsos positivos", () => {
    expect(VOSEO_RE.test("Contanos tu proyecto")).toBe(true);
    expect(VOSEO_RE.test("¿Qué necesitás?")).toBe(true);
    expect(VOSEO_RE.test("Cuéntanos tu proyecto")).toBe(false);
    expect(VOSEO_RE.test("Además, después y también")).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutarlo y comprobar que falla**

Run: `npx vitest run __tests__/i18n/es-register.test.ts`
Expected: el test «no usa voseo» FALLA y el array `found` lista 12 entradas (por ejemplo `es.hero.primary: «Contanos»`, `es.closing.form.errors.invalid: «Ingresá»`); el segundo test pasa.

- [ ] **Step 3: Commit**

```bash
git add __tests__/i18n/es-register.test.ts
git commit -m "test: es.json no debe usar voseo

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Pasar `es.json` a tú (verde)

**Files:**
- Modify: `app/[lang]/dictionaries/es.json`

Editar con la herramienta Edit, un reemplazo por cadena. Cada `old_string` de abajo es único en el archivo salvo donde se indica. No tocar nada más (ni claves, ni «Hablemos», ni `closing.email`).

- [ ] **Step 1: Aplicar los 13 reemplazos**

| # | old_string | new_string |
|---|---|---|
| 1 | `"label": "Escribinos por WhatsApp"` | `"label": "Escríbenos por WhatsApp"` |
| 2 | `"primary": "Contanos tu proyecto",` | `"primary": "Cuéntanos tu proyecto",` |
| 3 | `"description": "Una charla para entender qué necesitás, a quién le hablás y qué tiene que pasar."` | `"description": "Una charla para entender qué necesitas, a quién le hablas y qué tiene que pasar."` |
| 4 | `"description": "Contanos qué querés lograr. Te respondemos el mismo día.",` | `"description": "Cuéntanos qué quieres lograr. Te respondemos el mismo día.",` |
| 5 | `"emailLabel": "o por mail a",` | `"emailLabel": "o por email a",` |
| 6 | `"projectLegend": "¿Qué necesitás?",` | `"projectLegend": "¿Qué necesitas?",` |
| 7 | `"messagePlaceholder": "Contanos un poco del proyecto",` | `"messagePlaceholder": "Cuéntanos un poco del proyecto",` |
| 8 | `"invalid": "Ingresá un email válido.",` | `"invalid": "Introduce un email válido.",` |
| 9 | `"invalid_phone": "Revisá el número. Si no es de España, empezá con el prefijo del país (+54…).",` | `"invalid_phone": "Revisa el número. Si no es de España, empieza con el prefijo del país (+54…).",` |
| 10 | `"need_one": "Dejanos un mail o un WhatsApp para poder responderte.",` | `"need_one": "Déjanos un email o un WhatsApp para poder responderte.",` |
| 11 | `"send_failed": "No pudimos enviarlo. Probá de nuevo o",` | `"send_failed": "No pudimos enviarlo. Prueba de nuevo o",` |
| 11b | `"sendFailedLink": "escribinos por WhatsApp."` | `"sendFailedLink": "escríbenos por WhatsApp."` |
| 12 | `"too_fast": "Enviaste el formulario muy rápido. Probá de nuevo en un momento."` | `"too_fast": "Enviaste el formulario muy rápido. Prueba de nuevo en un momento."` |

- [ ] **Step 2: Comprobar que no queda voseo ni se rompió el JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('app/[lang]/dictionaries/es.json','utf8')); console.log('json ok')"`
Expected: `json ok`

Run: `git diff --stat app/\[lang\]/dictionaries/es.json`
Expected: `1 file changed, 13 insertions(+), 13 deletions(-)`

- [ ] **Step 3: Correr el test nuevo y la paridad**

Run: `npx vitest run __tests__/i18n`
Expected: PASS en `es-register.test.ts` (2 tests) y `dictionaries-parity.test.ts` (2 tests).

- [ ] **Step 4: Commit**

```bash
git add "app/[lang]/dictionaries/es.json"
git commit -m "feat: el español del sitio pasa a tú peninsular

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Verificación completa

**Files:** ninguno (solo se ejecuta).

- [ ] **Step 1: Suite unitaria y lint**

Run: `npm run test && npm run lint`
Expected: todos los tests pasan (antes de esta rama eran 168 más los de la PR #5 y contact-reach; lo que importa es 0 fallos) y lint sin errores.

- [ ] **Step 2: E2E de home y contacto**

El e2e levanta su propio servidor en :3000 y falla si el puerto está ocupado. Si hay un `npm run dev` abierto, cerrarlo o moverlo a otro puerto antes.

Run: `npx playwright test e2e/home.spec.ts e2e/contact.spec.ts`
Expected: todo en verde en los proyectos `desktop` y `mobile` (los skips por diseño no cuentan como fallo).

Si algún e2e falla por un texto en voseo: buscarlo con `git grep -nE "Contanos|Escribinos|Dejanos|Probá|Ingresá|Revisá|necesitás|querés|empezá" -- e2e __tests__`, cambiarlo al texto nuevo y reportarlo (el spec no esperaba ninguno).

- [ ] **Step 3: Revisión visual rápida**

Run: `npm run dev -- -p 3001` y abrir `http://localhost:3001/es`.
Mirar: hero («Cuéntanos tu proyecto»), cierre (descripción y «o por email a») y provocar un error del formulario (enviarlo vacío) para ver «Introduce un email válido.» / «Déjanos un email o un WhatsApp…». Cerrar el servidor al terminar.

- [ ] **Step 4: Reportar**

Informar: salida de `npm run test` y `npm run lint`, resultado de los e2e y los dos commits. No hacer push ni abrir PR: lo decide el dueño.
