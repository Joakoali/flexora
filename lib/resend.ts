export type EmailMessage = { from: string; to: string; replyTo: string; subject: string; text: string };

const RESEND_URL = "https://api.resend.com/emails";
export const RESEND_TIMEOUT_MS = 10_000;

/**
 * Modo de prueba: el form responde éxito sin llamar a Resend.
 * En producción de Vercel se ignora: un CONTACT_DRY_RUN=1 olvidado ahí perdería leads en silencio mostrando
 * éxito. Se mira VERCEL_ENV y no NODE_ENV porque solo Vercel define el primero; el e2e corre `next start`
 * (NODE_ENV=production) con dry run a propósito.
 */
export function isDryRun(): boolean {
  if (process.env.CONTACT_DRY_RUN !== "1") return false;
  if (process.env.VERCEL_ENV === "production") {
    console.error("[contact] CONTACT_DRY_RUN ignorado en producción");
    return false;
  }
  return true;
}

/** Envía un mail por la API REST de Resend. Nunca lanza: devuelve { ok }. */
export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean }> {
  if (isDryRun()) {
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
