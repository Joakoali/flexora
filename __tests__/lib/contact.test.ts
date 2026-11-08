import { describe, expect, it } from "vitest";
import { buildEmail, isHoneypotFilled, isTooFast, validateContact, type ContactData } from "@/lib/contact";

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

  it("normaliza CRLF y CR sueltos a LF en el mensaje", () => {
    const r = validateContact(fd({ ...valid, message: "uno\r\ndos\rtres\ncuatro" }));
    expect(r.ok && r.data.message).toBe("uno\ndos\ntres\ncuatro");
  });

  it("el límite del mensaje cuenta cada salto de línea como 1 (como el textarea del navegador)", () => {
    // Largo en LF = lfLength; en crudo suma 1000 por los CRLF. Sin saltos en los extremos: text() hace trim.
    const crlfMessage = (lfLength: number) => "a" + "\r\n".repeat(1000) + "a".repeat(lfLength - 1001);

    // 2000 en LF = 3000 en crudo: el navegador lo permite y el servidor debe aceptarlo.
    expect(validateContact(fd({ ...valid, message: crlfMessage(2000) })).ok).toBe(true);

    const r = validateContact(fd({ ...valid, message: crlfMessage(2001) }));
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

describe("isHoneypotFilled", () => {
  it("honeypot con contenido → true", () => {
    expect(isHoneypotFilled(fd({ website: "http://spam" }))).toBe(true);
  });

  it("honeypot vacío, solo espacios o ausente → false", () => {
    expect(isHoneypotFilled(fd({ website: "" }))).toBe(false);
    expect(isHoneypotFilled(fd({ website: "  " }))).toBe(false);
    expect(isHoneypotFilled(fd({}))).toBe(false);
  });

  it("no depende de startedAt", () => {
    expect(isHoneypotFilled(fd({ website: "x", startedAt: "0" }))).toBe(true);
    expect(isHoneypotFilled(fd({ startedAt: String(Date.now()) }))).toBe(false);
  });
});

describe("isTooFast", () => {
  const now = 1_000_000;

  it("menos de 2000 ms → true; 2000 ms o más → false", () => {
    expect(isTooFast(fd({ startedAt: String(now - 1999) }), now)).toBe(true);
    expect(isTooFast(fd({ startedAt: String(now - 2000) }), now)).toBe(false);
    expect(isTooFast(fd({ startedAt: String(now - 10_000) }), now)).toBe(false);
  });

  it("elapsed 0 (justo ahora) → true", () => {
    expect(isTooFast(fd({ startedAt: String(now) }), now)).toBe(true);
  });

  it("startedAt ausente, vacío o no numérico → false (no se puede juzgar)", () => {
    expect(isTooFast(fd({}), now)).toBe(false);
    expect(isTooFast(fd({ startedAt: "" }), now)).toBe(false);
    expect(isTooFast(fd({ startedAt: "abc" }), now)).toBe(false);
  });

  it("startedAt en el futuro (reloj del cliente adelantado) → false", () => {
    expect(isTooFast(fd({ startedAt: String(now + 60_000) }), now)).toBe(false);
  });

  it("ignora el honeypot", () => {
    expect(isTooFast(fd({ website: "http://spam", startedAt: String(now - 10_000) }), now)).toBe(false);
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

  it("un mensaje que llegó con CRLF sale sin \\r en el cuerpo del mail", () => {
    const v = validateContact(fd({ ...valid, message: "Hola\r\nqué tal" }));
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const { text } = buildEmail(v.data);
    expect(text.includes("\r")).toBe(false);
    expect(text.endsWith("Mensaje:\nHola\nqué tal")).toBe(true);
  });
});
