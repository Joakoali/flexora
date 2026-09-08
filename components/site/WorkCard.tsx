import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { DistortImage } from "@/components/gl/DistortImage";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  return (
    <article className="work-card">
      <a href={`/${locale}/trabajos/${item.slug}`} className="work-card__cover" aria-label={`${viewCase}: ${item.client}`}>
        <DistortImage src={item.cover} alt={item.coverAlt[locale]} />
      </a>
      <div className="work-card__meta">
        <h3 className="h3">{item.client}</h3>
        <p className="label">{item.services[locale]}</p>
        <p className="work-card__result">{item.result[locale]}</p>
        <TextLink href={`/${locale}/trabajos/${item.slug}`}>{viewCase}</TextLink>
      </div>
    </article>
  );
}
