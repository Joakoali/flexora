import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Footer } from "@/components/site/Footer";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Footer", () => {
  it("cierra con el copyright y los derechos reservados, sin «Hecho en Argentina»", () => {
    const { container } = render(<Footer t={es.footer} locale="es" />);
    const legal = container.querySelector(".site-footer__legal")!;
    expect(legal.textContent).toBe(`© ${new Date().getFullYear()} Flexora. ${es.footer.rights}`);
    expect(container.textContent).not.toMatch(/argentina/i);
  });
});
