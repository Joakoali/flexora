import { describe, expect, it } from "vitest";
import { whatsappHref } from "@/lib/whatsapp";

describe("whatsappHref", () => {
  it("arma el link wa.me con el texto codificado", () => {
    expect(whatsappHref("Hola Flexora, quiero hablar", "54 9 11 1234-5678")).toBe(
      "https://wa.me/5491112345678?text=Hola%20Flexora%2C%20quiero%20hablar",
    );
  });
  it("usa el número por defecto si no hay env", () => {
    expect(whatsappHref("hi")).toMatch(/^https:\/\/wa\.me\/\d+\?text=hi$/);
  });
  it("cae al número por defecto si la env var está definida pero vacía", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "";
    try {
      expect(whatsappHref("hi")).toMatch(/^https:\/\/wa\.me\/\d+\?text=hi$/);
    } finally {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = prev;
    }
  });
});
