"use client";

import { usePathname } from "next/navigation";
import { localeShortLabel, locales, switchLocalePath, type Locale } from "@/lib/i18n";

type Props = { locale: Locale; labels: { label: string } & Record<Locale, string> };

export function LangSwitch({ locale, labels }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label={labels.label} className="lang-switch">
      {locales.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" className="lang-switch__item">
            {localeShortLabel[l]}
          </span>
        ) : (
          <a
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-label={labels[l]}
            className="lang-switch__item text-link"
          >
            {localeShortLabel[l]}
          </a>
        ),
      )}
    </nav>
  );
}
