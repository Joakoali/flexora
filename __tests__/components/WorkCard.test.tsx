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
});
