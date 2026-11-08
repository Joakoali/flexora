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
    // El navegador manda los saltos del textarea como CRLF (2 caracteres) pero maxLength
    // los cuenta como 1: normalizamos a LF para que el límite del servidor sea el mismo.
    message: text(formData, "message").replace(/\r\n?/g, "\n"),
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
