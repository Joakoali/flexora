import type { Locale } from "@/lib/i18n";

export type WorkItem = {
  slug: string;
  client: string;
  cover: string;
  coverAlt: Record<Locale, string>;
  services: Record<Locale, string>;
  result: Record<Locale, string>;
};

export const work: WorkItem[] = [
  {
    slug: "norte-cafe",
    client: "Norte Café",
    cover: "/covers/01.svg",
    coverAlt: { es: "Home del e-commerce de Norte Café", en: "Norte Café e-commerce home" },
    services: { es: "E-commerce + campañas", en: "E-commerce + campaigns" },
    result: { es: "+140% ventas online en 3 meses", en: "+140% online sales in 3 months" },
  },
  {
    slug: "clinica-vera",
    client: "Clínica Vera",
    cover: "/covers/02.svg",
    coverAlt: { es: "Sitio institucional de Clínica Vera", en: "Clínica Vera corporate site" },
    services: { es: "Sitio + identidad", en: "Site + identity" },
    result: { es: "3x turnos reservados online", en: "3x appointments booked online" },
  },
  {
    slug: "andar-outdoor",
    client: "Andar Outdoor",
    cover: "/covers/03.svg",
    coverAlt: { es: "Landing de lanzamiento de Andar Outdoor", en: "Andar Outdoor launch landing" },
    services: { es: "Landing + ads", en: "Landing + ads" },
    result: { es: "ROAS 4.2 en el lanzamiento", en: "4.2 ROAS at launch" },
  },
  {
    slug: "studio-lumen",
    client: "Studio Lumen",
    cover: "/covers/04.svg",
    coverAlt: { es: "Sistema de marca de Studio Lumen", en: "Studio Lumen brand system" },
    services: { es: "Branding completo", en: "Full branding" },
    result: { es: "Marca lista en 5 semanas", en: "Brand shipped in 5 weeks" },
  },
];
