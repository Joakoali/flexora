import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales, matchLocale, switchLocalePath } from "@/lib/i18n";

describe("locales", () => {
  it("soporta es y en, con es por defecto", () => {
    expect(locales).toEqual(["es", "en"]);
    expect(defaultLocale).toBe("es");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

describe("matchLocale", () => {
  it("elige inglés cuando el navegador lo prefiere", () => {
    expect(matchLocale("en-US,en;q=0.9,es;q=0.5")).toBe("en");
  });
  it("mapea variantes regionales de español a es", () => {
    expect(matchLocale("es-AR,es;q=0.9")).toBe("es");
  });
  it("cae al default sin header o con idiomas no soportados", () => {
    expect(matchLocale(null)).toBe("es");
    expect(matchLocale("fr-FR,de;q=0.8")).toBe("es");
  });
});

describe("switchLocalePath", () => {
  it("reemplaza el segmento de idioma y conserva el resto", () => {
    expect(switchLocalePath("/es", "en")).toBe("/en");
    expect(switchLocalePath("/es/trabajos/x", "en")).toBe("/en/trabajos/x");
    expect(switchLocalePath("/", "en")).toBe("/en");
  });
});
