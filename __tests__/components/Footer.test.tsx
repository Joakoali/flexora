import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Footer } from "@/components/site/Footer";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Footer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cierra con el copyright y los derechos reservados, sin «Hecho en Argentina»", () => {
    // Fecha fija: si el test y el componente leyeran el reloj por separado, en el cambio de año podrían
    // no coincidir.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2031, 5, 15));
    const { container } = render(<Footer t={es.footer} locale="es" />);
    const legal = container.querySelector(".site-footer__legal")!;
    expect(legal.textContent).toBe(`© 2031 Flexora. ${es.footer.rights}`);
    expect(container.textContent).not.toMatch(/argentina/i);
  });
});
