import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});

import { DistortImage } from "@/components/gl/DistortImage";

describe("DistortImage sin WebGL", () => {
  it("siempre entrega la imagen accesible y no monta canvas", () => {
    render(<DistortImage src="/covers/01.svg" alt="Norte Café" />);
    const img = screen.getByRole("img", { name: "Norte Café" });
    expect(img.getAttribute("src")).toBe("/covers/01.svg");
    expect(document.querySelector("canvas")).toBeNull();
  });
});
