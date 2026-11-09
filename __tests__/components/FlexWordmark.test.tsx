import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
  // useSpring instantáneo para testear el mapeo sin esperar frames.
  return { ...actual, useSpring: (v: unknown) => v, useReducedMotion: () => false };
});

import { FlexWordmark } from "@/components/site/FlexWordmark";

const textEl = (c: HTMLElement) => c.querySelector<HTMLElement>(".hero__wordmark-text")!;

describe("FlexWordmark", () => {
  it("renderiza el texto con anchura inicial 140 y sin ser un heading", () => {
    const { container } = render(<FlexWordmark text="FLEXORA" />);
    const h1 = textEl(container);
    expect(h1.textContent).toBe("FLEXORA");
    expect(screen.queryByRole("heading")).toBeNull();
    expect(h1.getAttribute("data-wdth")).toBe("140");
  });

  it("mapea la posición horizontal del puntero a wdth 110..150", () => {
    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    const { container } = render(<FlexWordmark text="FLEXORA" />);
    const h1 = textEl(container);
    act(() => { fireEvent.pointerMove(window, { clientX: 0 }); });
    expect(h1.getAttribute("data-wdth")).toBe("110");
    act(() => { fireEvent.pointerMove(window, { clientX: 1000 }); });
    expect(h1.getAttribute("data-wdth")).toBe("150");
  });

  it("separa FLEX del resto para pintarlo de acento al aterrizar en el header", () => {
    const { container } = render(<FlexWordmark text="FLEXORA" />);
    const h1 = textEl(container);
    expect(h1.querySelector(".hero__wordmark-flex")?.textContent).toBe("FLEX");
    expect(h1.textContent).toBe("FLEXORA");
  });

  it("publica el ancho en la variable --wdth (el CSS la mezcla con --hero-p)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1000, configurable: true });
    const { container } = render(<FlexWordmark text="FLEXORA" />);
    const h1 = textEl(container);
    expect(h1.style.getPropertyValue("--wdth")).toBe("140");
    act(() => { fireEvent.pointerMove(window, { clientX: 1000 }); });
    expect(h1.style.getPropertyValue("--wdth")).toBe("150");
  });
});
