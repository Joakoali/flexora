import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";

const href = "https://wa.me/34604164897?text=Hola%20Flexora";

describe("WhatsAppFab", () => {
  it("es un link real a WhatsApp en pestaña nueva, con nombre accesible", () => {
    render(<WhatsAppFab href={href} label="Escribinos por WhatsApp" />);
    const link = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("el glifo es decorativo: el nombre lo da el aria-label", () => {
    const { container } = render(<WhatsAppFab href={href} label="Escribinos por WhatsApp" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
  });
});
