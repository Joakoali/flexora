import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RESEND_TIMEOUT_MS, sendEmail, type EmailMessage } from "@/lib/resend";

const msg: EmailMessage = {
  from: "Flexora <onboarding@resend.dev>",
  to: "hola@example.com",
  replyTo: "ana@example.com",
  subject: "Nuevo contacto: Ana",
  text: "cuerpo",
};

describe("sendEmail", () => {
  const fetchMock = vi.fn();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "re_secret_123");
    vi.stubEnv("CONTACT_DRY_RUN", "");
  });

  afterEach(() => {
    fetchMock.mockReset();
    errorSpy.mockClear();
    infoSpy.mockClear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("hace POST a Resend con auth, reply_to y to como array", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer re_secret_123", "Content-Type": "application/json" });
    expect(JSON.parse(init.body)).toEqual({
      from: msg.from,
      to: [msg.to],
      reply_to: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("respuesta no-2xx → { ok: false } y loguea status sin la API key", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"invalid"}', { status: 422 }));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: false });
    const logged = errorSpy.mock.calls.flat().join(" ");
    expect(logged).toContain("422");
    expect(logged).not.toContain("re_secret_123");
  });

  it("fetch lanza (red caída o timeout) → { ok: false } sin propagar", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    await expect(sendEmail(msg)).resolves.toEqual({ ok: false });
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("re_secret_123");
  });

  it("usa un timeout de 10 s", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    await sendEmail(msg);
    expect(RESEND_TIMEOUT_MS).toBe(10_000);
    expect(timeoutSpy).toHaveBeenCalledWith(10_000);
    timeoutSpy.mockRestore();
  });

  it("CONTACT_DRY_RUN=1 → no llama a fetch y devuelve ok", async () => {
    vi.stubEnv("CONTACT_DRY_RUN", "1");
    await expect(sendEmail(msg)).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
