import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrandVisual } from "@/components/site/ServiceVisuals";

describe("BrandVisual", () => {
  it("renderiza el FlexMark (dos paths con gradiente) en vez de la X", () => {
    const { container } = render(<BrandVisual />);
    expect(container.querySelectorAll("svg.flex-mark")).toHaveLength(1);
    expect(container.querySelectorAll("svg.flex-mark path")).toHaveLength(2);
  });

  it("usa las clases de reveal existentes en cada mitad del logo", () => {
    const { container } = render(<BrandVisual />);
    expect(container.querySelector(".svis__chev--a")).not.toBeNull();
    expect(container.querySelector(".svis__chev--b")).not.toBeNull();
  });

  it("muestra el label F · 03 y ya no la X", () => {
    const { container } = render(<BrandVisual />);
    expect(container.textContent).toContain("F · 03");
    expect(container.textContent).not.toContain("X ·");
  });
});
