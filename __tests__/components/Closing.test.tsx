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

  // En dos columnas la introducción reparte el alto del formulario entre dos bloques: título y frase
  // arriba, WhatsApp y mail abajo. Si el título vuelve a quedar fuera de la columna, o las acciones se
  // funden con él, el CSS ya no tiene dos bloques que separar y vuelve el hueco debajo de WhatsApp/mail.
  it("agrupa el título con la frase en un bloque, y WhatsApp/mail en otro bloque de la misma columna", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    const title = screen.getByRole("heading", { level: 2, name: es.closing.title });
    const description = screen.getByText(es.closing.description);
    const whatsapp = screen.getByRole("link", { name: es.closing.primary });
    const mail = screen.getByRole("link", { name: es.closing.email });
    const form = screen.getByRole("form", { name: es.closing.form.formLabel });

    const head = title.parentElement!;
    expect(head.contains(description), "título y frase en el mismo bloque").toBe(true);
    expect(head.contains(whatsapp), "WhatsApp fuera del bloque del título").toBe(false);
    expect(head.contains(mail), "mail fuera del bloque del título").toBe(false);

    const column = head.parentElement!;
    expect(column.contains(whatsapp), "WhatsApp en la misma columna que el título").toBe(true);
    expect(column.contains(mail), "mail en la misma columna que el título").toBe(true);
    expect(column.contains(form), "el formulario es la otra columna").toBe(false);
  });

  // El orden visual lo resuelve el CSS; el del documento (lectura y tabulado) no se toca para acomodar el layout.
  it("mantiene el orden de lectura: título, frase, WhatsApp, mail y recién después el formulario", () => {
    render(<Closing t={es.closing} whatsappHref="https://wa.me/1?text=x" locale="es" />);
    const inOrder = [
      screen.getByRole("heading", { level: 2, name: es.closing.title }),
      screen.getByText(es.closing.description),
      screen.getByRole("link", { name: es.closing.primary }),
      screen.getByRole("link", { name: es.closing.email }),
      screen.getByRole("form", { name: es.closing.form.formLabel }),
    ];
    for (let i = 1; i < inOrder.length; i++) {
      const follows = inOrder[i - 1].compareDocumentPosition(inOrder[i]) & Node.DOCUMENT_POSITION_FOLLOWING;
      expect(follows, `el elemento ${i + 1} debe ir después del ${i}`).not.toBe(0);
    }
  });
});
