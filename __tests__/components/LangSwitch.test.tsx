import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/trabajos/uno" }));

import { LangSwitch } from "@/components/ui/LangSwitch";

const labels = { label: "Idioma", es: "Español", en: "English", ca: "Català" };

describe("LangSwitch", () => {
  it("linkea al otro idioma conservando la ruta y marca el actual", () => {
    render(<LangSwitch locale="es" labels={labels} />);
    const en = screen.getByRole("link", { name: "English" });
    expect(en.getAttribute("href")).toBe("/en/trabajos/uno");
    expect(en.getAttribute("hreflang")).toBe("en");
    const es = screen.getByText("ES");
    expect(es.getAttribute("aria-current")).toBe("true");
  });

  it("ofrece catalán con la etiqueta CAT y hreflang ca", () => {
    render(<LangSwitch locale="es" labels={labels} />);
    const ca = screen.getByRole("link", { name: "Català" });
    expect(ca.textContent).toBe("CAT");
    expect(ca.getAttribute("href")).toBe("/ca/trabajos/uno");
    expect(ca.getAttribute("hreflang")).toBe("ca");
  });

  it("marca CAT como actual cuando el idioma es catalán", () => {
    render(<LangSwitch locale="ca" labels={labels} />);
    expect(screen.getByText("CAT").getAttribute("aria-current")).toBe("true");
  });
});
