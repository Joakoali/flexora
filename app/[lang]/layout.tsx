import type { Metadata } from "next";
import { anybody, geistMono, geistSans } from "@/lib/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { locales } from "@/lib/i18n";
import { Header } from "@/components/site/Header";
import { HeroScrollProvider } from "@/components/site/HeroScrollProvider";
import { Footer } from "@/components/site/Footer";
import { whatsappHref } from "@/lib/whatsapp";
import { getDictionary, getLocale } from "./dictionaries";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const FALLBACK_SITE_URL = "http://localhost:3000";

function safeSiteUrl(value: string | undefined): URL {
  try {
    return new URL(value ?? FALLBACK_SITE_URL);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    metadataBase: safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { es: "/es", en: "/en" },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: locale === "es" ? "es_AR" : "en_US",
      type: "website",
      images: [`/og-${locale}.png`],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${anybody.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <HeroScrollProvider>
          <Header
            locale={locale}
            labels={{ nav: dict.nav, theme: dict.theme, lang: dict.lang }}
            whatsappHref={whatsappHref(dict.hero.whatsappMessage)}
          />
          {children}
        </HeroScrollProvider>
        <Footer t={dict.footer} locale={locale} />
      </body>
    </html>
  );
}
