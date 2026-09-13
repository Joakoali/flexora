import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Reveal } from "@/components/site/Reveal";

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void;
let callbacks: Cb[] = [];
const disconnect = vi.fn();

beforeEach(() => {
  callbacks = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: Cb) {
        callbacks.push(cb);
      }
      observe = vi.fn();
      disconnect = disconnect;
      unobserve = vi.fn();
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Reveal", () => {
  it("marca data-visible al entrar en viewport y deja de observar", () => {
    render(
      <Reveal as="section" className="x" data-testid="r">
        <p>uno</p>
      </Reveal>,
    );
    const el = screen.getByTestId("r");
    expect(el.tagName).toBe("SECTION");
    expect(el.hasAttribute("data-reveal")).toBe(true);
    expect(el.hasAttribute("data-visible")).toBe(false);
    act(() => callbacks[0]([{ isIntersecting: true }]));
    expect(el.hasAttribute("data-visible")).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });
});
