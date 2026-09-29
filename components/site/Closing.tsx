import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { FlexField } from "@/components/gl/FlexField";
import { Reveal } from "./Reveal";
import { ContactForm } from "./ContactForm";

export function Closing({
  t,
  whatsappHref,
  locale,
}: {
  t: Dictionary["closing"];
  whatsappHref: string;
  locale: Locale;
}) {
  return (
    <section id="contact" className="closing" aria-labelledby="closing-title">
      <FlexField variant="closing" />
      <Reveal className="container-site closing__content">
        <h2 id="closing-title" className="display closing__title">{t.title}</h2>
        <div className="closing__grid">
          <div className="closing__intro">
            <p className="closing__desc measure">{t.description}</p>
            <div className="closing__actions">
              <Button href={whatsappHref} external>{t.primary}</Button>
              <p className="closing__email">
                {t.emailLabel} <TextLink href={`mailto:${t.email}`}>{t.email}</TextLink>
              </p>
            </div>
          </div>
          <ContactForm t={t.form} locale={locale} whatsappHref={whatsappHref} />
        </div>
      </Reveal>
    </section>
  );
}
