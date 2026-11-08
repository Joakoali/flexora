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

  it("normaliza CRLF y CR sueltos a LF en el mensaje", () => {
    const r = validateContact(fd({ ...valid, message: "uno\r\ndos\rtres\ncuatro" }));
    expect(r.ok && r.data.message).toBe("uno\ndos\ntres\ncuatro");
    expect(r.ok && r.data.message.includes("\r")).toBe(false);
  });

  it("el límite del mensaje cuenta cada salto de línea como 1 (como el textarea del navegador)", () => {
    // 1999 caracteres con 9 saltos: el navegador los manda como CRLF → 2008 en crudo.
    const withBreaks = `${"a".repeat(199)}\r\n`.repeat(9) + "a".repeat(1999 - 9 * 200);
    expect(withBreaks.replace(/\r\n/g, "\n")).toHaveLength(1999);
    expect(withBreaks.length).toBe(2008);
    const ok = validateContact(fd({ ...valid, message: withBreaks }));
    expect(ok.ok).toBe(true);
    expect(ok.ok && ok.data.message).toHaveLength(1999);
    expect(ok.ok && ok.data.message.includes("\r")).toBe(false);

    const tooLong = `${"a".repeat(199)}\r\n`.repeat(9) + "a".repeat(2001 - 9 * 200);
    expect(tooLong.replace(/\r\n/g, "\n")).toHaveLength(2001);
    const r = validateContact(fd({ ...valid, message: tooLong }));
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

  it("un mensaje que llegó con CRLF sale sin \\r en el cuerpo del mail", () => {
    const v = validateContact(fd({ ...valid, message: "Hola\r\nqué tal" }));
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const { text } = buildEmail(v.data);
    expect(text.includes("\r")).toBe(false);
    expect(text.endsWith("Mensaje:\nHola\nqué tal")).toBe(true);
  });
});
