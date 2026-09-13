import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkCard } from "@/components/site/WorkCard";
import { work } from "@/content/work";

describe("WorkCard", () => {
  const item = work[0]; // GG Propiedades

  it("todos sus links apuntan al sitio real, en pestaña nueva, no a una ruta interna", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2); // cover + TextLink
    for (const link of links) {
      expect(link.getAttribute("href")).toBe(item.siteUrl);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("muestra la descripción real y los tags de stack, no una métrica inventada", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    expect(screen.getByText(item.description.es)).toBeTruthy();
    for (const tag of item.tags) {
      expect(screen.getByText(tag)).toBeTruthy();
    }
  });

  it("se puede revelar individualmente (data-reveal en su propio elemento raíz)", () => {
    const { container } = render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const article = container.querySelector("article.work-card");
    expect(article?.hasAttribute("data-reveal")).toBe(true);
  });

  it("muestra un frame de navegador con el host del sitio, sin WebGL", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    expect(screen.getByText("ggpropiedades.com")).toBeTruthy();
    expect(document.querySelector(".distort")).toBeNull();
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("la descripción no usa la clase .label (reservada a rótulos cortos)", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const desc = screen.getByText(item.description.es);
    expect(desc.className).not.toContain("label");
    expect(desc.className).toContain("work-card__desc");
  });
});
