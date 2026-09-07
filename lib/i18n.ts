import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const languages = new Negotiator({ headers: { "accept-language": acceptLanguage } }).languages();
  try {
    const matched = match(languages, locales as unknown as string[], defaultLocale);
    return isLocale(matched) ? matched : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) segments[0] = target;
  else segments.unshift(target);
  return `/${segments.join("/")}`;
}
