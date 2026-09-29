import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});
vi.mock("@/app/[lang]/actions/contact", () => ({ contactAction: vi.fn() }));

import { Closing } from "@/components/site/Closing";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Closing", () => {
  it("tiene id contact, CTA a WhatsApp y mail alternativo", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    expect(document.getElementById("contact")).not.toBeNull();
    expect(screen.getByRole("link", { name: es.closing.primary }).getAttribute("href")).toBe("https://wa.me/1?text=x");
    expect(screen.getByRole("link", { name: es.closing.email }).getAttribute("href")).toBe(`mailto:${es.closing.email}`);
  });

  it("incluye el formulario de contacto dentro de #contact", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    const form = screen.getByRole("form", { name: es.closing.form.formLabel });
    expect(document.getElementById("contact")!.contains(form)).toBe(true);
  });
});
