import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/site/Hero";
import { HeroScrollProvider } from "@/components/site/HeroScrollProvider";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Hero", () => {
  beforeAll(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
  });

  it("renderiza promesa, CTA a WhatsApp, disciplinas y proyectos reales", () => {
    render(<HeroScrollProvider><Hero t={es.hero} whatsappHref="https://wa.me/1?text=hola" /></HeroScrollProvider>);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe(es.hero.tagline);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(es.hero.subcopy).tagName).toBe("P");
    expect(screen.getByRole("link", { name: es.hero.primary }).getAttribute("href")).toBe("https://wa.me/1?text=hola");
    expect(screen.getByRole("link", { name: es.hero.secondary }).getAttribute("href")).toBe("#work");
    expect(screen.getByText(es.hero.primaryNote)).toBeTruthy();
    const chips = screen.getByRole("list", { name: es.hero.disciplinesLabel });
    expect(chips.querySelectorAll("li")).toHaveLength(es.hero.disciplines.length);
    const projects = screen.getByRole("link", { name: /GG Propiedades, Adocmat, Control Gastos/ });
    expect(projects.getAttribute("href")).toBe("#work");
  });

  it("conserva el campo WebGL y el wordmark", () => {
    const { container } = render(<HeroScrollProvider><Hero t={es.hero} whatsappHref="#" /></HeroScrollProvider>);
    expect(container.querySelector('[data-variant="hero"]')).toBeTruthy();
    expect(container.querySelector(".hero__wordmark")).toBeTruthy();
  });
});
