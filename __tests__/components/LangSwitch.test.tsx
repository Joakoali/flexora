import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/es/trabajos/uno" }));

import { LangSwitch } from "@/components/ui/LangSwitch";

const labels = { label: "Idioma", es: "Español", en: "English" };

describe("LangSwitch", () => {
  it("linkea al otro idioma conservando la ruta y marca el actual", () => {
    render(<LangSwitch locale="es" labels={labels} />);
    const en = screen.getByRole("link", { name: "English" });
    expect(en.getAttribute("href")).toBe("/en/trabajos/uno");
    expect(en.getAttribute("hreflang")).toBe("en");
    const es = screen.getByText("ES");
    expect(es.getAttribute("aria-current")).toBe("true");
  });
});
