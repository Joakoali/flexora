import { describe, expect, it } from "vitest";
import es from "@/app/[lang]/dictionaries/es.json";

// Formas de voseo que no deben aparecer en el español del sitio (tú peninsular).
// Lista explícita y no una regla por terminación (-ás, -és): esa daría falsos
// positivos con «además», «después», «también». Se amplía cuando aparezca una forma nueva.
const VOSEO = [
  "contanos",
  "escribinos",
  "dejanos",
  "probá",
  "ingresá",
  "revisá",
  "empezá",
  "necesitás",
  "querés",
  "tenés",
  "podés",
  "hablás",
  "sabés",
  "vos",
  "sos",
  "mirá",
  "fijate",
  "acá",
];

// \b de JS no entiende las tildes, por eso los límites de palabra son lookarounds sobre \p{L}.
const VOSEO_RE = new RegExp(`(?<!\\p{L})(${VOSEO.join("|")})(?!\\p{L})`, "iu");

function strings(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  }
  return [];
}

describe("es.json: registro", () => {
  it("no usa voseo (el español del sitio es tú peninsular)", () => {
    const found = strings(es, "es")
      .map(([path, text]) => ({ path, match: text.match(VOSEO_RE)?.[0] }))
      .filter((r) => r.match)
      .map((r) => `${r.path}: «${r.match}»`);
    expect(found).toEqual([]);
  });

  it("el detector reconoce voseo y no da falsos positivos", () => {
    expect(VOSEO_RE.test("Contanos tu proyecto")).toBe(true);
    expect(VOSEO_RE.test("¿Qué necesitás?")).toBe(true);
    expect(VOSEO_RE.test("Cuéntanos tu proyecto")).toBe(false);
    expect(VOSEO_RE.test("Además, después y también")).toBe(false);
  });
});
