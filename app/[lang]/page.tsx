import { getDictionary, getLocale } from "./dictionaries";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { clients } from "@/content/clients";
import { Services } from "@/components/site/Services";
import { Work } from "@/components/site/Work";
import { Process } from "@/components/site/Process";
import { Closing } from "@/components/site/Closing";
import { whatsappHref } from "@/lib/whatsapp";

export default async function HomePage() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const wa = whatsappHref(dict.hero.whatsappMessage);
  return (
    <main id="main">
      <Hero t={dict.hero} whatsappHref={wa} />
      <Marquee items={clients.map((c) => c.name)} label={dict.clients.label} />
      <Services t={dict.services} />

      <Work t={dict.work} locale={locale} />
      <Process t={dict.process} />
      <Closing t={dict.closing} whatsappHref={wa} />
    </main>
  );
}
