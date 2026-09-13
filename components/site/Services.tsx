import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";
import { AdsVisual, BrandVisual, DevVisual } from "./ServiceVisuals";

const VISUALS = [DevVisual, AdsVisual, BrandVisual];

export function Services({ t }: { t: Dictionary["services"] }) {
  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <Reveal className="container-site">
        <h2 id="services-title" className="h2 services__title">{t.title}</h2>
      </Reveal>
      <div className="services__list">
        {t.items.map((item, i) => {
          const Visual = VISUALS[i] ?? DevVisual;
          return (
            <Reveal as="article" key={item.index} className="service hairline">
              <div className="container-site service__grid">
                <Label as="p">{item.index} / {item.label}</Label>
                <div className="service__body">
                  <h3 className="h3">{item.title}</h3>
                  <p className="service__desc">{item.description}</p>
                  <ul className="service__deliverables">
                    {item.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="service__visual">
                  <Visual />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
