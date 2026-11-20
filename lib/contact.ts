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

export const LIMITS = { name: 80, email: 254, whatsapp: 30, message: 2000 } as const;
export const MIN_FILL_MS = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function projectTypes(formData: FormData): ProjectType[] {
  const picked = new Set(formData.getAll("projectType").filter((v): v is string => typeof v === "string"));
  return PROJECT_TYPES.filter((type) => picked.has(type));
}

/**
 * Lee y normaliza lo que la persona escribió, sin validar nada. Lo usa `validateContact` y también
 * el cliente para devolverle sus valores al form cuando la action ni siquiera llegó al servidor.
 */
export function readContactValues(formData: FormData): ContactValues {
  return {
    // El nombre va al asunto del mail: una sola línea.
    name: text(formData, "name").replace(/\s+/g, " "),
    email: text(formData, "email"),
    // Tal cual lo tipeó (con trim): normalizarlo es cosa de validateContact.
    whatsapp: text(formData, "whatsapp"),
    projectTypes: projectTypes(formData),
    // El navegador manda los saltos del textarea como CRLF (2 caracteres) pero maxLength
    // los cuenta como 1: normalizamos a LF para que el límite del servidor sea el mismo.
    message: text(formData, "message").replace(/\r\n?/g, "\n"),
  };
}

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

/** Honeypot (`website`): un humano nunca lo ve, así que cualquier contenido delata a un bot. */
export function isHoneypotFilled(formData: FormData): boolean {
  return text(formData, "website") !== "";
}

/**
 * Se envió antes de MIN_FILL_MS desde que se montó el form. No implica bot: un autofill
 * seguido de Enter también lo dispara, así que la action pide reintentar en vez de descartar.
 */
export function isTooFast(formData: FormData, now: number): boolean {
  const raw = text(formData, "startedAt");
  // Sin startedAt (usuario sin JS) no se puede juzgar.
  if (raw === "") return false;
  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) return false;

  const elapsed = now - startedAt;
  // Negativo = reloj del cliente adelantado respecto al servidor: no se puede juzgar.
  return elapsed >= 0 && elapsed < MIN_FILL_MS;
}

export function buildEmail(data: ContactData): { subject: string; text: string; replyTo?: string } {
  const types = data.projectTypes.map((type) => PROJECT_TYPE_LABELS_ES[type]).join(", ");
  // Sin email el mail sale sin Reply-To: quien responda por costumbre escribe a CONTACT_FROM_EMAIL y la respuesta
  // se pierde. El asunto avisa que hay que contestar por WhatsApp.
  const subject =
    (types ? `Nuevo contacto: ${data.name} · ${types}` : `Nuevo contacto: ${data.name}`) +
    (data.email ? "" : " · solo WhatsApp");
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

/**
 * Normaliza el WhatsApp que escribió la persona a dígitos con código de país ("34604164897"), o null si no
 * es un número aceptable. Recibe el valor ya recortado y no vacío.
 * Con prefijo (+ o 00) se respeta el código de país. Casi todos escriben desde España: sin prefijo se acepta un
 * número español de 9 dígitos que empieza con 6-9 (se le suma el 34) o el 34 seguido de un móvil (6 o 7). Un número
 * de otro país sin prefijo no se puede adivinar y se rechaza. Un "(0)" troncal (+44 (0)7700…) se descarta.
 */
export function normalizeWhatsapp(raw: string): string | null {
  if (raw.length > LIMITS.whatsapp) return null;
  // Separadores habituales (espacios, puntos, guiones, paréntesis): se descartan.
  // "(0)" es el prefijo troncal que se marca solo dentro del país (+44 (0)7700…): en formato internacional sobra.
  const compact = raw.replace(/\(0\)/g, "").replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  const digits = compact.replace(/^\+/, "");
  let intl: string;
  if (compact.startsWith("+")) intl = digits;
  else if (digits.startsWith("00")) intl = digits.slice(2);
  else if (/^[6-9]\d{8}$/.test(digits)) return `34${digits}`;
  // Alguien de España que puso el 34 pero no el +: se acepta solo si sigue un móvil (6 o 7), para no tomar como
  // español un número nacional de otro país que empiece con 34 (p. ej. móviles de Brasil, área 34: 349…).
  else if (/^34[67]\d{8}$/.test(digits)) return digits;
  else return null;

  // E.164: hasta 15 dígitos contando el código de país, que nunca empieza con 0. Menos de 8 no es un número real.
  if (!/^[1-9]\d{7,14}$/.test(intl)) return null;
  // Un +34 tiene que ser un número español completo: atrapa el dígito de menos o de más.
  if (intl.startsWith("34") && !/^34[6-9]\d{8}$/.test(intl)) return null;
  return intl;
}
