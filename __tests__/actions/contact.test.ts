import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn();
vi.mock("@/lib/resend", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/resend")>()),
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

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

  it("bot (honeypot) → success falso sin enviar", async () => {
    await expect(contactAction(IDLE, form({ website: "spam" }))).resolves.toEqual({ status: "success" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("honeypot lleno + demasiado rápido → success falso (el honeypot manda)", async () => {
    await expect(contactAction(IDLE, form({ website: "spam", startedAt: String(Date.now()) }))).resolves.toEqual({
      status: "success",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("honeypot lleno + campos inválidos → success falso (el honeypot va antes que la validación)", async () => {
    await expect(contactAction(IDLE, form({ website: "spam", name: "", email: "mal" }))).resolves.toEqual({
      status: "success",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("demasiado rápido → too_fast con los values de la persona, sin enviar", async () => {
    const r = await contactAction(IDLE, form({ startedAt: String(Date.now()) }));
    expect(r).toEqual({
      status: "error",
      errors: { form: "too_fast" },
      values: { name: "Ana", email: "ana@example.com", projectTypes: ["webapp"], message: "Hola" },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("demasiado rápido y con campos inválidos → mandan los errores de campo", async () => {
    const r = await contactAction(IDLE, form({ name: "", email: "mal", startedAt: String(Date.now()) }));
    expect(r).toEqual({
      status: "error",
      errors: { name: "required", email: "invalid" },
      values: { name: "", email: "mal", projectTypes: ["webapp"], message: "Hola" },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sin startedAt (usuario sin JS) → no es demasiado rápido y envía", async () => {
    const f = form();
    f.delete("startedAt");
    await expect(contactAction(IDLE, f)).resolves.toEqual({ status: "success" });
    expect(sendEmail).toHaveBeenCalledOnce();
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
