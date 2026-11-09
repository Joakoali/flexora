"use server";

import { buildEmail, isHoneypotFilled, isTooFast, validateContact, type ContactState } from "@/lib/contact";
import { isDryRun, sendEmail } from "@/lib/resend";

export async function contactAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // A un bot se le responde éxito para que no reintente con otra estrategia.
  if (isHoneypotFilled(formData)) return { status: "success" };

  const result = validateContact(formData);
  if (!result.ok) return { status: "error", errors: result.errors, values: result.values };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { locale: _locale, ...values } = result.data;

  // Una persona real puede mandar en <2 s (autofill + Enter): no se descarta en silencio,
  // se le pide reintentar conservando lo que escribió. Va después de validar para que
  // los errores de campo, que sí son accionables, tengan prioridad.
  if (isTooFast(formData, Date.now())) return { status: "error", errors: { form: "too_fast" }, values };

  const failed: ContactState = { status: "error", errors: { form: "send_failed" }, values };

  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!to || !from || (!isDryRun() && !process.env.RESEND_API_KEY)) {
    console.error("[contact] faltan variables de entorno: CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL y/o RESEND_API_KEY");
    return failed;
  }

  const { ok } = await sendEmail({ from, to, ...buildEmail(result.data) });
  return ok ? { status: "success" } : failed;
}
