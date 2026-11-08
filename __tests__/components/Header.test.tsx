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

    it("abre el panel con los 3 links y el CTA y bloquea el scroll; el botón conserva su nombre y sólo cambia aria-expanded", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      const panel = document.getElementById("mobile-menu")!;
      expect(panel).toBeTruthy();
      expect(panel.querySelectorAll("nav a")).toHaveLength(3);
      expect(panel.querySelector(".mobile-menu__cta")?.getAttribute("href")).toBe("https://wa.me/1?text=hola");
      // Patrón disclosure (APG): etiqueta constante, el estado lo comunica aria-expanded.
      const btn = screen.getByRole("button", { name: es.nav.menu });
      expect(btn.getAttribute("aria-expanded")).toBe("true");
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(screen.getByRole("banner").getAttribute("data-menu-open")).toBe("true");
      fireEvent.click(btn);
      const closed = screen.getByRole("button", { name: es.nav.menu });
      expect(closed).toBe(btn);
      expect(closed.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById("mobile-menu")).toBeNull();
    });

    it("Esc cierra, libera el scroll y devuelve el foco al botón", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(document.getElementById("mobile-menu")).toBeNull();
      expect(document.documentElement.style.overflow).toBe("");
      expect(document.activeElement).toBe(screen.getByRole("button", { name: es.nav.menu }));
    });

    it("con el menú abierto deja <main> y el footer inertes, y los libera al cerrar", () => {
      render(
        <>
          <HeroScrollProvider>
            <Header locale="es" labels={labels} whatsappHref="#" />
          </HeroScrollProvider>
          <main id="main" />
          <footer />
        </>,
      );
      const main = document.getElementById("main")!;
      const footer = document.querySelector("footer")!;
      expect(main.hasAttribute("inert")).toBe(false);
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      expect(main.hasAttribute("inert")).toBe(true);
      expect(footer.hasAttribute("inert")).toBe(true);
      expect(screen.getByRole("banner").hasAttribute("inert")).toBe(false);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(main.hasAttribute("inert")).toBe(false);
      expect(footer.hasAttribute("inert")).toBe(false);
    });

    it("también deja inerte el botón flotante de WhatsApp", () => {
      render(
        <>
          <HeroScrollProvider>
            <Header locale="es" labels={labels} whatsappHref="#" />
          </HeroScrollProvider>
          <main id="main" />
          <a className="wa-fab" href="#">WhatsApp</a>
        </>,
      );
      const fab = document.querySelector(".wa-fab")!;
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      expect(fab.hasAttribute("inert")).toBe(true);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(fab.hasAttribute("inert")).toBe(false);
    });

    it("no libera un inert que ya tenía <main> antes de abrir el menú", () => {
      render(
        <>
          <HeroScrollProvider>
            <Header locale="es" labels={labels} whatsappHref="#" />
          </HeroScrollProvider>
          <main id="main" inert />
        </>,
      );
      fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(document.getElementById("main")!.hasAttribute("inert")).toBe(true);
    });

    it("si el viewport pasa a escritorio con el foco en el panel, el foco va al nav de escritorio", () => {
      const original = window.matchMedia;
      let desktop = false;
      const listeners = new Set<() => void>();
      window.matchMedia = ((query: string) => ({
        get matches() { return query === "(min-width: 900px)" ? desktop : false; },
        media: query,
        addEventListener: (_: string, l: () => void) => listeners.add(l),
        removeEventListener: (_: string, l: () => void) => listeners.delete(l),
      })) as unknown as typeof window.matchMedia;
      try {
        setup();
        fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
        const panelLink = document.getElementById("mobile-menu")!.querySelector<HTMLAnchorElement>("nav a")!;
        expect(document.activeElement).toBe(panelLink);
        act(() => {
          desktop = true;
          listeners.forEach((l) => l());
        });
        expect(document.getElementById("mobile-menu")).toBeNull();
        const navLink = document.querySelector<HTMLAnchorElement>(".site-header__nav a")!;
        expect(document.activeElement).toBe(navLink);
      } finally {
        window.matchMedia = original;
      }
    });

    it("si el navegador ya soltó el foco en <body> al ocultar el panel, igual va al nav de escritorio", () => {
      const original = window.matchMedia;
      let desktop = false;
      const listeners = new Set<() => void>();
      window.matchMedia = ((query: string) => ({
        get matches() { return query === "(min-width: 900px)" ? desktop : false; },
        media: query,
        addEventListener: (_: string, l: () => void) => listeners.add(l),
        removeEventListener: (_: string, l: () => void) => listeners.delete(l),
      })) as unknown as typeof window.matchMedia;
      try {
        setup();
        fireEvent.click(screen.getByRole("button", { name: es.nav.menu }));
        (document.activeElement as HTMLElement).blur();
        expect(document.activeElement).toBe(document.body);
        act(() => {
          desktop = true;
          listeners.forEach((l) => l());
        });
        expect(document.activeElement).toBe(document.querySelector(".site-header__nav a"));
      } finally {
        window.matchMedia = original;
      }
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
