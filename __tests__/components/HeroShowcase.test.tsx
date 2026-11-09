import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { HeroShowcase } from "@/components/site/HeroShowcase";
import { work } from "@/content/work";

function mockMedia(initial: { wide: boolean }) {
  const original = window.matchMedia;
  const state = { wide: initial.wide };
  const listeners = new Set<() => void>();
  window.matchMedia = ((query: string) => ({
    get matches() { return query === "(min-width: 1280px)" ? state.wide : false; },
    media: query,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return {
    setWide(v: boolean) {
      state.wide = v;
      listeners.forEach((l) => l());
    },
    restore() { window.matchMedia = original; },
  };
}

describe("HeroShowcase", () => {
  afterEach(() => vi.restoreAllMocks());

  it("no escucha pointermove cuando está oculto (< 1280px) y sí al pasar a ancho", () => {
    const media = mockMedia({ wide: false });
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const moves = () => add.mock.calls.filter(([type]) => type === "pointermove").length;
    try {
      const { unmount } = render(<HeroShowcase items={work} />);
      expect(moves()).toBe(0);
      act(() => media.setWide(true));
      expect(moves()).toBe(1);
      act(() => media.setWide(false));
      expect(remove.mock.calls.filter(([type]) => type === "pointermove").length).toBeGreaterThan(0);
      unmount();
    } finally {
      media.restore();
    }
  });

  it("escucha pointermove desde el montaje en pantallas anchas y lo suelta al desmontar", () => {
    const media = mockMedia({ wide: true });
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    try {
      const { unmount } = render(<HeroShowcase items={work} />);
      expect(add.mock.calls.filter(([type]) => type === "pointermove")).toHaveLength(1);
      const before = remove.mock.calls.filter(([type]) => type === "pointermove").length;
      unmount();
      expect(remove.mock.calls.filter(([type]) => type === "pointermove").length).toBeGreaterThan(before);
    } finally {
      media.restore();
    }
  });

  it("es decorativo: aria-hidden, sin alt ni links ni foco", () => {
    const { container } = render(<HeroShowcase items={work} />);
    const root = container.querySelector(".hero-showcase")!;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
    root.querySelectorAll("img").forEach((img) => expect(img.getAttribute("alt")).toBe(""));
  });

  it("muestra las capturas de los 3 proyectos reales con su dominio", () => {
    const { container } = render(<HeroShowcase items={work} />);
    expect(container.querySelectorAll(".hero-showcase__win")).toHaveLength(3);
    const text = container.textContent ?? "";
    expect(text).toContain("ggpropiedades.com");
    expect(text).toContain("adocmat.com");
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });
});
