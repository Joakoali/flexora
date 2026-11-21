import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Label } from "@/components/ui/Label";

describe("Label", () => {
  it("deja pasar aria-hidden para los rótulos decorativos", () => {
    const { container } = render(<Label as="p" aria-hidden>Servicios</Label>);
    expect(container.querySelector("p.label")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sin aria-hidden, el rótulo queda expuesto a lectores de pantalla", () => {
    const { container } = render(<Label>01 / Desarrollo</Label>);
    expect(container.querySelector("span.label")?.hasAttribute("aria-hidden")).toBe(false);
  });
});
