import type { Metadata } from "next";
import { anybody, geistMono, geistSans } from "@/lib/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { locales } from "@/lib/i18n";
import { getDictionary, getLocale } from "./dictionaries";
import "../globals.css";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = await getDictionary();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
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
  const locale = await getLocale();
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
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
