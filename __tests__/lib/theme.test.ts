import { beforeEach, describe, expect, it } from "vitest";
import { THEME_INIT_SCRIPT, THEME_KEY, applyTheme, resolveTheme } from "@/lib/theme";

describe("resolveTheme", () => {
  it("la elección guardada gana sobre el sistema", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });
  it("sin elección guardada sigue al sistema", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
  });
  it("ignora valores inválidos guardados", () => {
    expect(resolveTheme("banana", true)).toBe("light");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  function run(prefersLight: boolean) {
    window.matchMedia = ((q: string) => ({ matches: prefersLight && q.includes("light") })) as never;
    new Function(THEME_INIT_SCRIPT)();
  }

  it("aplica el tema guardado antes del render", () => {
    localStorage.setItem(THEME_KEY, "light");
    run(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("sin guardado usa el sistema", () => {
    run(true);
    expect(document.documentElement.dataset.theme).toBe("light");
    run(false);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("setea el atributo y persiste", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("theme-changing")).toBe(true);
  });
});
