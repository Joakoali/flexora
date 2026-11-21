import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Services } from "@/components/site/Services";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Services", () => {
  it("renderiza tres bloques con rótulo, título y entregables", () => {
    render(<Services t={es.services} />);
    expect(screen.getByRole("region", { name: es.services.title })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.getByText("01 / Desarrollo")).toBeTruthy();
    expect(screen.getByText("E-commerce")).toBeTruthy();
  });

  it("antepone al h2 un rótulo decorativo con el nombre de la sección", () => {
    const { container } = render(<Services t={es.services} />);
    const tag = container.querySelector("p.section-tag");
    expect(tag?.textContent).toBe(es.services.tag);
    expect(tag?.getAttribute("aria-hidden")).toBe("true");
    expect(tag?.nextElementSibling?.tagName).toBe("H2");
  });
});
