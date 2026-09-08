import { getDictionary } from "./dictionaries";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { whatsappHref } from "@/lib/whatsapp";

export default async function HomePage() {
  const dict = await getDictionary();
  const wa = whatsappHref(dict.hero.whatsappMessage);
  return (
    <main id="main">
      <Hero t={dict.hero} whatsappHref={wa} />
      <Marquee items={dict.marquee.items} label={dict.nav.services} />
    </main>
  );
}
