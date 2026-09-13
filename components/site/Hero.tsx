import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { FlexField } from "@/components/gl/FlexField";
import { FlexWordmark } from "./FlexWordmark";
import { HeroProgress } from "./HeroProgress";

export function Hero({ t, whatsappHref }: { t: Dictionary["hero"]; whatsappHref: string }) {
  return (
    <section id="hero" className="hero" aria-label="Flexora">
      <div className="hero__sticky">
        <FlexField variant="hero" />
        <div className="hero__content container-site">
          <FlexWordmark text="FLEXORA" />
          <div className="hero__copy">
            <p className="hero__tagline h2">{t.tagline}</p>
            <p className="hero__subcopy">{t.subcopy}</p>
            <div className="hero__actions">
              <Button href={whatsappHref} external>{t.primary}</Button>
              <Button href="#work" variant="secondary">{t.secondary}</Button>
            </div>
          </div>
        </div>
      </div>
      <HeroProgress />
    </section>
  );
}
