import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { DistortImage } from "@/components/gl/DistortImage";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  return (
    <article className="work-card">
      <a
        href={item.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="work-card__cover"
        aria-label={`${viewCase}: ${item.client}`}
      >
        <DistortImage src={item.cover} alt={item.coverAlt[locale]} />
      </a>
      <div className="work-card__meta">
        <h3 className="h3">{item.client}</h3>
        <p className="label">{item.description[locale]}</p>
        <ul className="work-card__tags">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <TextLink href={item.siteUrl} target="_blank" rel="noopener noreferrer">
          {viewCase}
        </TextLink>
      </div>
    </article>
  );
}
