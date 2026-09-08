import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";
import { WorkCard } from "./WorkCard";

export function Work({ t, locale }: { t: Dictionary["work"]; locale: Locale }) {
  return (
    <section id="work" className="section hairline" aria-labelledby="work-title">
      <Reveal className="container-site">
        <Label as="p">{t.label}</Label>
        <h2 id="work-title" className="h2 work__title">{t.title}</h2>
      </Reveal>
      <Reveal className="container-site work__grid">
        {work.map((item) => (
          <WorkCard key={item.slug} item={item} locale={locale} viewCase={t.viewCase} />
        ))}
      </Reveal>
    </section>
  );
}
