import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE_IN_OUT,
  EASE_LOOP,
  EASE_OUT,
  FAB,
  MENU,
  REVEAL,
  SHOWCASE,
  SPRING_BASE,
  SPRING_FOLLOW,
} from "@/lib/motion";

describe("motion tokens", () => {
  it("usa las curvas del spec", () => {
    expect(EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(EASE_IN_OUT).toBe("cubic-bezier(0.77, 0, 0.175, 1)");
  });

  it("la curva de los loops ambientales es la del keyword ease-in-out de CSS", () => {
    expect(EASE_LOOP).toBe("cubic-bezier(0.42, 0, 0.58, 1)");
  });

  it("usa las duraciones del spec en ms", () => {
    expect(DURATION).toEqual({ fast: 120, base: 200, slow: 500 });
  });

  it("define el spring base y el de seguimiento", () => {
    expect(SPRING_BASE).toEqual({ type: "spring", duration: 0.4, bounce: 0.2 });
    expect(SPRING_FOLLOW).toEqual({ stiffness: 120, damping: 24, mass: 1 });
  });

  it("define la entrada del showcase del hero y su loop de scroll", () => {
    expect(SHOWCASE).toEqual({
      durationMs: 900,
      delayMs: 350,
      staggerMs: 140,
      loopMs: 16_000,
      loopPhaseMs: 4_000,
    });
  });

  it("define los delays de entrada del menú mobile y del botón flotante", () => {
    expect(MENU).toEqual({ delayMs: 80 });
    expect(FAB).toEqual({ delayMs: 600 });
  });

  it("define los parámetros de reveal", () => {
    expect(REVEAL).toEqual({ offsetPx: 12, staggerMs: 60 });
  });
});
