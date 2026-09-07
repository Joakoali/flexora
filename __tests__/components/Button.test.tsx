import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("con href renderiza un link con clase primaria", () => {
    render(<Button href="https://wa.me/1">Hablemos</Button>);
    const a = screen.getByRole("link", { name: "Hablemos" });
    expect(a.getAttribute("href")).toBe("https://wa.me/1");
    expect(a.className).toContain("btn-primary");
  });
  it("sin href renderiza un button secundario", () => {
    render(<Button variant="secondary">Ver</Button>);
    const b = screen.getByRole("button", { name: "Ver" });
    expect(b.getAttribute("type")).toBe("button");
    expect(b.className).toContain("btn-secondary");
  });
  it("los links externos abren en pestaña nueva con rel seguro", () => {
    render(<Button href="https://wa.me/1" external>Ir</Button>);
    const a = screen.getByRole("link");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
