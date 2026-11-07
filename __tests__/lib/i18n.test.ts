import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, localeShortLabel, locales, matchLocale, switchLocalePath } from "@/lib/i18n";

describe("locales", () => {
  it("soporta es, en y ca, con es por defecto", () => {
    expect(locales).toEqual(["es", "en", "ca"]);
    expect(defaultLocale).toBe("es");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ca")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

describe("localeShortLabel", () => {
  it("muestra CAT para catalán y el código en mayúsculas para el resto", () => {
    expect(localeShortLabel.es).toBe("ES");
    expect(localeShortLabel.en).toBe("EN");
    expect(localeShortLabel.ca).toBe("CAT");
  });
});

describe("matchLocale", () => {
  it("elige inglés cuando el navegador lo prefiere", () => {
    expect(matchLocale("en-US,en;q=0.9,es;q=0.5")).toBe("en");
  });
  it("elige catalán para ca y variantes regionales", () => {
    expect(matchLocale("ca-ES,ca;q=0.9,es;q=0.5")).toBe("ca");
    expect(matchLocale("ca")).toBe("ca");
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
    expect(switchLocalePath("/es", "ca")).toBe("/ca");
  });
});
