import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
  // useSpring instantáneo para testear el mapeo sin esperar frames.
  return { ...actual, useSpring: (v: unknown) => v, useReducedMotion: () => false };
});

import { FlexWordmark } from "@/components/site/FlexWordmark";

describe("FlexWordmark", () => {
  it("renderiza el h1 con el texto y anchura inicial 140", () => {
    render(<FlexWordmark text="FLEXORA" />);
    const h1 = screen.getByRole("heading", { level: 1, name: "FLEXORA" });
    expect(h1.getAttribute("data-wdth")).toBe("140");
  });

  it("mapea la posición horizontal del puntero a wdth 110..150", () => {
    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    render(<FlexWordmark text="FLEXORA" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    act(() => { fireEvent.pointerMove(window, { clientX: 0 }); });
    expect(h1.getAttribute("data-wdth")).toBe("110");
    act(() => { fireEvent.pointerMove(window, { clientX: 1000 }); });
    expect(h1.getAttribute("data-wdth")).toBe("150");
  });
});
