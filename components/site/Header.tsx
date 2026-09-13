"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion } from "motion/react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Logo } from "./Logo";
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

  const { scrollYProgress } = useHeroScrollProgress();
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (trackHeroRef.current) setScrolled(p >= HERO_LANDED_P);
  });

  return (
    <header className="site-header" data-scrolled={scrolled ? "true" : "false"}>
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
        </div>
      </div>
    </header>
  );
}
