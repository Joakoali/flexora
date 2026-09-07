import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Footer({ t, locale }: { t: Dictionary["footer"]; locale: Locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer hairline">
      <div className="container-site site-footer__inner">
        <a href={`/${locale}`} className="site-footer__logo">
          <Logo id="footer-logo" title="Flexora" />
        </a>
        <p className="label">
          © {year} Flexora. {t.rights} {t.madeIn}
        </p>
      </div>
    </footer>
  );
}
