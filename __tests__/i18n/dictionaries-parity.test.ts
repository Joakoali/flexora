import { describe, expect, it } from "vitest";
import es from "@/app/[lang]/dictionaries/es.json";
import en from "@/app/[lang]/dictionaries/en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    // Los arrays comparan por longitud y por la forma de su primer elemento.
    const first = value[0];
    return [`${prefix}[len=${value.length}]`, ...keyPaths(first, `${prefix}[]`)];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe("diccionarios", () => {
  it("es y en tienen exactamente las mismas claves y tamaños de lista", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(es).sort());
  });

  it("ningún string está vacío", () => {
    const check = (v: unknown, path: string) => {
      if (typeof v === "string") expect(v.trim(), path).not.toBe("");
      else if (Array.isArray(v)) v.forEach((x, i) => check(x, `${path}[${i}]`));
      else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => check(x, `${path}.${k}`));
    };
    check(es, "es");
    check(en, "en");
  });
});
