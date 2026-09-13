"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { LangSwitch } from "@/components/ui/LangSwitch";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Logo } from "./Logo";

export type HeaderLabels = {
  nav: Dictionary["nav"];
  theme: Dictionary["theme"];
  lang: Dictionary["lang"];
};

type Props = { locale: Locale; labels: HeaderLabels; whatsappHref: string };

export function Header({ locale, labels, whatsappHref }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
