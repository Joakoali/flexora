import type { Locale } from "@/lib/i18n";

export type WorkItem = {
  slug: string;
  client: string;
  cover: string;
  coverAlt: Record<Locale, string>;
  description: Record<Locale, string>;
  tags: string[];
  siteUrl: string;
};

export const work: WorkItem[] = [
  {
    slug: "gg-propiedades",
    client: "GG Propiedades",
    cover: "/work/gg-propiedades.webp",
    coverAlt: {
      es: "Captura de ggpropiedades.com",
      en: "Screenshot of ggpropiedades.com",
    },
    description: {
      es: "Plataforma inmobiliaria con buscador avanzado y gestión de propiedades.",
      en: "Real estate platform with advanced search and property management.",
    },
    tags: ["Next.js", "React", "TypeScript", "Tailwind", "Prisma", "Supabase", "NextAuth", "Cloudflare"],
    siteUrl: "https://ggpropiedades.com",
  },
  {
    slug: "adocmat",
    client: "Adocmat",
    cover: "/work/adocmat.webp",
    coverAlt: {
      es: "Captura de Adocmat",
      en: "Screenshot of Adocmat",
    },
    description: {
      es: "Landing institucional con panel de administración y formulario de contacto.",
      en: "Institutional landing page with an admin panel and contact form.",
    },
    tags: ["React", "TypeScript", "Vite", "Supabase", "Tailwind", "EmailJS"],
    siteUrl: "https://adocmat.com",
  },
  {
    slug: "control-gastos",
    client: "Control Gastos",
    cover: "/work/control-gastos.webp",
    coverAlt: {
      es: "Captura de Control Gastos",
      en: "Screenshot of Control Gastos",
    },
    description: {
      es: "App de control de gastos con gráficos y categorías.",
      en: "Expense tracking app with charts and categories.",
    },
    tags: ["React", "TypeScript", "Vite", "Tailwind", "Firebase"],
    siteUrl: "https://control-gastos-nine-zeta.vercel.app",
  },
];
