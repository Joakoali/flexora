"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion } from "motion/react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { useHeroScrollProgress } from "./HeroScrollProvider";

export type HeaderLabels = {
  nav: Dictionary["nav"];
  theme: Dictionary["theme"];
  lang: Dictionary["lang"];
};

type Props = { locale: Locale; labels: HeaderLabels; whatsappHref: string };

// Umbral de llegada del wordmark: coincide con el final del crossfade
// FLEXORA -> logo del header (--hero-p 0.85 -> 1 en globals.css). Tolerancia
// por redondeo de subpíxel del scroll progress de Motion.
const HERO_LANDED_P = 0.995;

export function Header({ locale, labels, whatsappHref }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const trackHeroRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const hero = document.getElementById("hero");
    heroRef.current = hero;
    // Sin hero (página sin sección hero) o con reduce-motion (FLEXORA no viaja,
    // así que no hay riesgo de solape): comportamiento instantáneo de siempre.
    trackHeroRef.current = !!hero && !reduced;
    if (trackHeroRef.current) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Menú abierto: bloquea el scroll de la página, deja el resto del documento
  // inerte (ni Tab ni cursor virtual de lectores de pantalla), cierra con Esc
  // (devolviendo el foco al botón), mantiene el Tab dentro del header y se cierra
  // solo si el viewport pasa al layout de escritorio.
  useEffect(() => {
    if (!menuOpen) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    // Sólo se libera lo que se marcó acá: un inert previo del mismo elemento se respeta.
    const inerted = Array.from(headerRef.current?.parentElement?.children ?? []).filter(
      (el) => (el.tagName === "MAIN" || el.tagName === "FOOTER") && !el.hasAttribute("inert"),
    );
    inerted.forEach((el) => el.setAttribute("inert", ""));
    headerRef.current?.querySelector<HTMLElement>(".mobile-menu a")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !headerRef.current) return;
      const items = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 900px)");
    const onBreakpoint = () => {
      if (!desktop.matches) return;
      // En escritorio el botón del menú está oculto (display: none) y no puede
      // recibir foco: si el foco estaba en el panel o en el botón, pasa al primer
      // link del nav de escritorio en vez de caer en <body> al desmontarse el panel.
      // El navegador puede haber ocultado ya el panel (y soltado el foco en <body>)
      // antes de este handler; con el menú abierto el foco vive siempre dentro del
      // header, así que <body> significa "se perdió" y se trata igual.
      const active = document.activeElement;
      const lost = !active || active === document.body;
      const inMenu =
        !!active &&
        (active === menuButtonRef.current ||
          !!headerRef.current?.querySelector(".mobile-menu")?.contains(active));
      if (lost || inMenu) headerRef.current?.querySelector<HTMLElement>(".site-header__nav a")?.focus();
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      html.style.overflow = prevOverflow;
      inerted.forEach((el) => el.removeAttribute("inert"));
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen]);

  const { scrollYProgress } = useHeroScrollProgress();
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (trackHeroRef.current) setScrolled(p >= HERO_LANDED_P);
  });

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-scrolled={scrolled ? "true" : "false"}
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <div className="container-site site-header__inner">
        <a href={`/${locale}`} className="site-header__logo" aria-label={labels.nav.home}>
          <Logo title="Flexora" />
        </a>
        <nav className="site-header__nav" aria-label={labels.nav.primary}>
          <a href="#services" className="text-link">{labels.nav.services}</a>
          <a href="#work" className="text-link">{labels.nav.work}</a>
          <a href="#contact" className="text-link">{labels.nav.contact}</a>
        </nav>
        <div className="site-header__tools">
          <LangSwitch locale={locale} labels={labels.lang} />
          <ThemeSwitch labels={labels.theme} />
          <Button href={whatsappHref} external className="site-header__cta">
            {labels.nav.cta}
          </Button>
          <button
            ref={menuButtonRef}
            type="button"
            className="site-header__menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? labels.nav.closeMenu : labels.nav.menu}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="site-header__menu-bar" />
            <span className="site-header__menu-bar" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <MobileMenu id="mobile-menu" nav={labels.nav} whatsappHref={whatsappHref} onNavigate={closeMenu} />
      )}
    </header>
  );
}
