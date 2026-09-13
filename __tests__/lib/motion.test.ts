import { describe, expect, it } from "vitest";
import {
  DURATION,
  EASE_IN_OUT,
  EASE_OUT,
  REVEAL,
  SPRING_BASE,
  SPRING_FOLLOW,
} from "@/lib/motion";

describe("motion tokens", () => {
  it("usa las curvas del spec", () => {
    expect(EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(EASE_IN_OUT).toBe("cubic-bezier(0.77, 0, 0.175, 1)");
  });

  it("usa las duraciones del spec en ms", () => {
    expect(DURATION).toEqual({ fast: 120, base: 200, slow: 500 });
  });

  it("define el spring base y el de seguimiento", () => {
    expect(SPRING_BASE).toEqual({ type: "spring", duration: 0.4, bounce: 0.2 });
    expect(SPRING_FOLLOW).toEqual({ stiffness: 120, damping: 24, mass: 1 });
  });

  it("define los parámetros de reveal", () => {
    expect(REVEAL).toEqual({ offsetPx: 12, staggerMs: 60 });
  });
});
