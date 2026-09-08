import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { FlexField } from "@/components/gl/FlexField";
import { Reveal } from "./Reveal";

export function Closing({ t, whatsappHref }: { t: Dictionary["closing"]; whatsappHref: string }) {
  return (
    <section id="contact" className="closing" aria-labelledby="closing-title">
      <FlexField variant="closing" />
      <Reveal className="container-site closing__content">
        <h2 id="closing-title" className="display closing__title">{t.title}</h2>
        <p className="closing__desc measure">{t.description}</p>
        <div className="closing__actions">
          <Button href={whatsappHref} external>{t.primary}</Button>
          <p className="closing__email">
            {t.emailLabel} <TextLink href={`mailto:${t.email}`}>{t.email}</TextLink>
          </p>
        </div>
      </Reveal>
    </section>
  );
}
