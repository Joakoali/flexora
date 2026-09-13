import type { Locale } from "@/lib/i18n";
import type { WorkItem } from "@/content/work";
import { Reveal } from "./Reveal";
import { TextLink } from "@/components/ui/TextLink";

export function WorkCard({ item, locale, viewCase }: { item: WorkItem; locale: Locale; viewCase: string }) {
  const host = new URL(item.siteUrl).hostname;
  return (
    <Reveal as="article" className="work-card">
      <a
        href={item.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="work-card__cover"
        aria-label={`${viewCase}: ${item.client}`}
      >
        <div className="work-card__frame" aria-hidden="true">
          <span className="work-card__dot work-card__dot--red" />
          <span className="work-card__dot work-card__dot--yellow" />
          <span className="work-card__dot work-card__dot--green" />
          <span className="work-card__frame-url">{host}</span>
        </div>
        <div className="work-card__window">
          {/* eslint-disable-next-line @next/next/no-img-element -- captura completa animada por CSS, sin next/image */}
          <img src={item.cover} alt={item.coverAlt[locale]} loading="lazy" decoding="async" />
        </div>
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
    </Reveal>
  );
}
