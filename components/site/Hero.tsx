import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { FlexField } from "@/components/gl/FlexField";
import { work } from "@/content/work";
import { FlexWordmark } from "./FlexWordmark";
import { HeroProgress } from "./HeroProgress";
import { HeroShowcase } from "./HeroShowcase";

export function Hero({ t, whatsappHref }: { t: Dictionary["hero"]; whatsappHref: string }) {
  const projects = work.map((w) => w.client).join(", ");
  return (
    <section id="hero" className="hero" aria-label="Flexora">
      <div className="hero__sticky">
        <FlexField variant="hero" />
        <div className="hero__content container-site">
          <FlexWordmark text="FLEXORA" />
          <HeroShowcase items={work} />
          <div className="hero__copy">
            <p className="hero__eyebrow label">{t.eyebrow}</p>
            <h1 className="hero__tagline h2">{t.tagline}</h1>
            <p className="hero__subcopy">{t.subcopy}</p>
            <div className="hero__cta">
              <div className="hero__actions">
                <Button href={whatsappHref} external>
                  {t.primary}
                  <svg className="hero__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
                <Button href="#work" variant="secondary">{t.secondary}</Button>
              </div>
              <p className="hero__note">{t.primaryNote}</p>
            </div>
            <div className="hero__proof">
              <ul className="hero__chips" aria-label={t.disciplinesLabel}>
                {t.disciplines.map((d) => (
                  <li key={d} className="hero__chip">{d}</li>
                ))}
              </ul>
              <p className="hero__projects">
                <TextLink href="#work">
                  {t.projectsPrefix} {projects}&nbsp;→
                </TextLink>
              </p>
            </div>
          </div>
        </div>
      </div>
      <HeroProgress />
    </section>
  );
}
