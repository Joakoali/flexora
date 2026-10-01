import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

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

  describe("menú mobile", () => {
    const setup = () =>
      render(
        <HeroScrollProvider>
          <Header locale="es" labels={labels} whatsappHref="https://wa.me/1?text=hola" />
        </HeroScrollProvider>,
      );

    it("arranca cerrado, sin panel ni links duplicados", () => {
      setup();
      const btn = screen.getByRole("button", { name: es.nav.menu });
      expect(btn.getAttribute("aria-expanded")).toBe("false");
      expect(btn.getAttribute("aria-controls")).toBe("mobile-menu");
      expect(document.getElementById("mobile-menu")).toBeNull();
      expect(screen.getAllByRole("link", { name: "Servicios" })).toHaveLength(1);
    });

    it("abre el panel con los 3 links y el CTA, bloquea el scroll y cambia el nombre del botón", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      const panel = document.getElementById("mobile-menu")!;
      expect(panel).toBeTruthy();
      expect(panel.querySelectorAll("nav a")).toHaveLength(3);
      expect(panel.querySelector(".mobile-menu__cta")?.getAttribute("href")).toBe("https://wa.me/1?text=hola");
      const close = screen.getByRole("button", { name: es.nav.closeMenu });
      expect(close.getAttribute("aria-expanded")).toBe("true");
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(screen.getByRole("banner").getAttribute("data-menu-open")).toBe("true");
    });

    it("Esc cierra, libera el scroll y devuelve el foco al botón", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(document.getElementById("mobile-menu")).toBeNull();
      expect(document.documentElement.style.overflow).toBe("");
      expect(document.activeElement).toBe(screen.getByRole("button", { name: es.nav.menu }));
    });

    it("tocar un link cierra el panel", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      const link = document.getElementById("mobile-menu")!.querySelector<HTMLAnchorElement>("nav a")!;
      fireEvent.click(link);
      expect(document.getElementById("mobile-menu")).toBeNull();
    });
  });
});
