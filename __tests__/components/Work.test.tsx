import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Work } from "@/components/site/Work";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Work", () => {
  it("renderiza los 3 proyectos reales, cada uno revelable por separado", () => {
    const { container } = render(<Work t={es.work} locale="es" />);
    expect(screen.getByText("GG Propiedades")).toBeTruthy();
    expect(screen.getByText("Adocmat")).toBeTruthy();
    expect(screen.getByText("Control Gastos")).toBeTruthy();
    const cards = container.querySelectorAll("article.work-card[data-reveal]");
    expect(cards).toHaveLength(3);
  });
});
