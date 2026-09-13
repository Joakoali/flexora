import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/gl", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gl")>("@/lib/gl");
  return { ...actual, canUseWebGL: () => false };
});

import { FlexField } from "@/components/gl/FlexField";

describe("FlexField sin WebGL", () => {
  it("renderiza el fallback estático y no un canvas", async () => {
    render(<FlexField variant="hero" />);
    const root = await screen.findByTestId("flex-field");
    expect(root.getAttribute("data-mode")).toBe("fallback");
    expect(root.getAttribute("data-variant")).toBe("hero");
    expect(root.querySelector("canvas")).toBeNull();
    expect(root.querySelector(".flex-field__fallback")).not.toBeNull();
  });
});
