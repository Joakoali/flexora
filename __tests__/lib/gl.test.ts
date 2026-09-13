import { describe, expect, it } from "vitest";
import { clampDpr, cssVarToRgb, canUseWebGL } from "@/lib/gl";

describe("clampDpr", () => {
  it("limita a 1.5 en puntero fino y a 1 en táctil", () => {
    expect(clampDpr(3, false)).toBe(1.5);
    expect(clampDpr(1.25, false)).toBe(1.25);
    expect(clampDpr(3, true)).toBe(1);
  });
});

describe("cssVarToRgb", () => {
  it("parsea hex y rgb() a componentes 0..1", () => {
    document.documentElement.style.setProperty("--test-a", "#7a3bff");
    document.documentElement.style.setProperty("--test-b", "rgb(255, 0, 0)");
    const a = cssVarToRgb("--test-a");
    expect(a.map((v) => Math.round(v * 255))).toEqual([122, 59, 255]);
    expect(cssVarToRgb("--test-b")).toEqual([1, 0, 0]);
  });
  it("devuelve negro si la variable no existe", () => {
    expect(cssVarToRgb("--nope")).toEqual([0, 0, 0]);
  });
});

describe("canUseWebGL", () => {
  it("es false en jsdom (sin contexto)", () => {
    expect(canUseWebGL()).toBe(false);
  });
});
