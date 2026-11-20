import { describe, expect, it } from "vitest";
import {
  LIMITS,
  buildEmail,
  isHoneypotFilled,
  isTooFast,
  normalizeWhatsapp,
  readContactValues,
  validateContact,
  type ContactData,
  type ContactErrors,
} from "@/lib/contact";

function fd(entries: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    for (const item of Array.isArray(v) ? v : [v]) f.append(k, item);
  }
  return f;
}

const valid = { name: "Ana", email: "ana@example.com", lang: "es" };

describe("readContactValues", () => {
  it("devuelve los valores con trim y sin validar nada (ni siquiera lo obligatorio)", () => {
    expect(readContactValues(fd({}))).toEqual({ name: "", email: "", whatsapp: "", projectTypes: [], message: "" });
    expect(readContactValues(fd({ name: "  Ana  ", email: " mal ", message: "  hola  " }))).toEqual({
      name: "Ana",
      email: "mal",
      whatsapp: "",
      projectTypes: [],
      message: "hola",
    });
  });

  it("WhatsApp: solo trim, tal cual lo tipeó (normalizar es cosa de validateContact)", () => {
    expect(readContactValues(fd({ whatsapp: "  (+34) 604-16 48 97 " })).whatsapp).toBe("(+34) 604-16 48 97");
  });

  it("colapsa el whitespace interno del nombre (una sola línea)", () => {
    expect(readContactValues(fd({ name: "Ana\r\n\tMaría   Pérez" })).name).toBe("Ana María Pérez");
  });

  it("normaliza CRLF y CR sueltos a LF en el mensaje", () => {
    expect(readContactValues(fd({ message: "uno\r\ndos\rtres\ncuatro" })).message).toBe("uno\ndos\ntres\ncuatro");
  });

  it("chips: descarta inválidos y duplicados, y ordena como PROJECT_TYPES", () => {
    const values = readContactValues(fd({ projectType: ["webapp", "hacker", "website", "webapp"] }));
    expect(values.projectTypes).toEqual(["website", "webapp"]);
  });

  it("ignora los valores que no son texto (archivos)", () => {
    const f = new FormData();
    f.append("name", new File(["x"], "x.txt"));
    f.append("projectType", new File(["x"], "x.txt"));
    expect(readContactValues(f)).toEqual({ name: "", email: "", whatsapp: "", projectTypes: [], message: "" });
  });

  it("es lo mismo que validateContact devuelve en values", () => {
    const f = fd({
      name: " Ana  Pérez ",
      email: "mal",
      whatsapp: " 11 2345 ",
      projectType: ["mobile", "x"],
      message: " hola\r\nchau ",
    });
    const r = validateContact(f);
    expect(!r.ok && r.values).toEqual(readContactValues(f));
  });
});

describe("validateContact", () => {
  it("acepta el mínimo (nombre + email) y aplica trim", () => {
    const r = validateContact(fd({ name: "  Ana  ", email: " ana@example.com ", lang: "en" }));
    expect(r).toEqual({
      ok: true,
      data: { name: "Ana", email: "ana@example.com", whatsapp: null, projectTypes: [], message: "", locale: "en" },
      values: { name: "Ana", email: "ana@example.com", whatsapp: "", projectTypes: [], message: "" },
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
      values: { name: "Ana", email: "mal", whatsapp: "", projectTypes: ["mobile"], message: "hola" },
    });
  });
});

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
  const base: ContactData = {
    name: "Ana",
    email: "ana@example.com",
    whatsapp: null,
    projectTypes: [],
    message: "",
    locale: "es",
  };

  it("sin chips ni mensaje", () => {
    expect(buildEmail(base)).toEqual({
      subject: "Nuevo contacto: Ana",
      replyTo: "ana@example.com",
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
    });
  });

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

  it("sin email: el asunto termina en '· solo WhatsApp' (la respuesta por costumbre se perdería)", () => {
    expect(buildEmail({ ...base, email: null, whatsapp: "34604164897", projectTypes: ["landing"] }).subject).toBe(
      "Nuevo contacto: Ana · Landing page · solo WhatsApp",
    );
    expect(buildEmail({ ...base, email: null, whatsapp: "34604164897" }).subject).toBe(
      "Nuevo contacto: Ana · solo WhatsApp",
    );
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

describe("normalizeWhatsapp", () => {
  it.each([
    ["+34 604 16 48 97", "34604164897"],
    ["0034 604164897", "34604164897"],
    ["(+34) 604-164-897", "34604164897"],
    ["604 164 897", "34604164897"],
    ["912 345 678", "34912345678"],
    ["+54 9 11 2345-6789", "5491123456789"],
    ["+1 (555) 123-4567", "15551234567"],
    ["+44 (0)7700 900123", "447700900123"],
    ["34604164897", "34604164897"],
    ["34 604 16 48 97", "34604164897"],
  ])("%s → %s", (raw, expected) => {
    expect(normalizeWhatsapp(raw)).toBe(expected);
  });

  it.each([
    ["+34 60416489", "un +34 con 8 dígitos"],
    ["11 2345 6789", "sin prefijo y no es español"],
    ["34912345678", "34 + fijo sin + (solo móviles)"],
    ["34991234567", "34 + 9…: podría ser un móvil de Brasil"],
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
