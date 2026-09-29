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
