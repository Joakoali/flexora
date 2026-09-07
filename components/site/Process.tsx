import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Label } from "@/components/ui/Label";
import { Reveal } from "./Reveal";

export function Process({ t }: { t: Dictionary["process"] }) {
  return (
    <section id="process" className="section hairline" aria-labelledby="process-title">
      <Reveal className="container-site process">
        <Label as="p">{t.label}</Label>
        <h2 id="process-title" className="h2 process__title">{t.title}</h2>
        <ol className="process__steps">
          {t.steps.map((step, i) => (
            <li key={step.title} className="process__step">
              <span className="label">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="h3">{step.title}</h3>
              <p className="process__desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
