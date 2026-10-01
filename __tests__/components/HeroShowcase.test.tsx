import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HeroShowcase } from "@/components/site/HeroShowcase";
import { work } from "@/content/work";

describe("HeroShowcase", () => {
  it("es decorativo: aria-hidden, sin alt ni links ni foco", () => {
    const { container } = render(<HeroShowcase items={work} />);
    const root = container.querySelector(".hero-showcase")!;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
    root.querySelectorAll("img").forEach((img) => expect(img.getAttribute("alt")).toBe(""));
  });

  it("muestra las capturas de los 3 proyectos reales con su dominio", () => {
    const { container } = render(<HeroShowcase items={work} />);
    expect(container.querySelectorAll(".hero-showcase__win")).toHaveLength(3);
    const text = container.textContent ?? "";
    expect(text).toContain("ggpropiedades.com");
    expect(text).toContain("adocmat.com");
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });
});
