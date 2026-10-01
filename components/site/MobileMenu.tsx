import type { CSSProperties } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";

type Props = {
  id: string;
  nav: Dictionary["nav"];
  whatsappHref: string;
  onNavigate: () => void;
};

/**
 * Panel a pantalla completa del menú mobile. Se monta sólo mientras está abierto
 * (así no duplica los links del nav de escritorio en el DOM). Vive dentro del
 * <header>, detrás de su fila (z-index negativo en su stacking context), de modo
 * que el logo, el idioma, el tema y el botón siguen visibles y usables encima.
 */
export function MobileMenu({ id, nav, whatsappHref, onNavigate }: Props) {
  const links = [
    { href: "#services", label: nav.services },
    { href: "#work", label: nav.work },
    { href: "#contact", label: nav.contact },
  ];
  return (
    <div id={id} className="mobile-menu">
      <nav aria-label={nav.primary}>
        <ol className="mobile-menu__list">
          {links.map((link, i) => (
            <li key={link.href} style={{ "--i": i } as CSSProperties}>
              <a href={link.href} className="mobile-menu__link" onClick={onNavigate}>
                <span className="mobile-menu__index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mobile-menu__foot" style={{ "--i": links.length } as CSSProperties}>
        <Button href={whatsappHref} external className="mobile-menu__cta" onClick={onNavigate}>
          {nav.cta}
        </Button>
      </div>
    </div>
  );
}
