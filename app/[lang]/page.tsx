import { getDictionary, getLocale } from "./dictionaries";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Services } from "@/components/site/Services";
import { Work } from "@/components/site/Work";
import { whatsappHref } from "@/lib/whatsapp";

export default async function HomePage() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const wa = whatsappHref(dict.hero.whatsappMessage);
  return (
    <main id="main">
      <Hero t={dict.hero} whatsappHref={wa} />
      <Marquee items={dict.marquee.items} label={dict.nav.services} />
      <Services t={dict.services} />
      <Work t={dict.work} locale={locale} />
    </main>
  );
}
