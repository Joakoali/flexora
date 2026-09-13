import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/es" }));

import { Header } from "@/components/site/Header";
import { HeroScrollProvider } from "@/components/site/HeroScrollProvider";
import es from "@/app/[lang]/dictionaries/es.json";

const labels = { nav: es.nav, theme: es.theme, lang: es.lang };

describe("Header", () => {
  it("tiene nav con anclas a las secciones y CTA a WhatsApp", () => {
    render(
      <HeroScrollProvider>
        <Header locale="es" labels={labels} whatsappHref="https://wa.me/1?text=hola" />
      </HeroScrollProvider>,
    );
    expect(screen.getByRole("link", { name: "Servicios" }).getAttribute("href")).toBe("#services");
    expect(screen.getByRole("link", { name: "Trabajos" }).getAttribute("href")).toBe("#work");
    expect(screen.getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("#contact");
    expect(screen.getByRole("link", { name: "Hablemos" }).getAttribute("href")).toBe("https://wa.me/1?text=hola");
  });

  it("marca data-scrolled al pasar 8px", () => {
    render(
      <HeroScrollProvider>
        <Header locale="es" labels={labels} whatsappHref="#" />
      </HeroScrollProvider>,
    );
    const header = screen.getByRole("banner");
    expect(header.getAttribute("data-scrolled")).toBe("false");
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header.getAttribute("data-scrolled")).toBe("true");
  });
});
