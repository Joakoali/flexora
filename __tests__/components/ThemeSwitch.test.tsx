import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react");
  return { ...actual, useReducedMotion: () => true };
});

const labels = { toLight: "Cambiar a tema claro", toDark: "Cambiar a tema oscuro" };

describe("ThemeSwitch", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("anuncia el tema al que cambia", () => {
    render(<ThemeSwitch labels={labels} />);
    expect(screen.getByRole("button", { name: labels.toLight })).toBeTruthy();
  });

  it("al tocar cambia data-theme y persiste", () => {
    render(<ThemeSwitch labels={labels} />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("flexora-theme")).toBe("light");
    expect(screen.getByRole("button", { name: labels.toDark })).toBeTruthy();
  });

  it("sincroniza con el tema real del DOM al montar", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeSwitch labels={labels} />);
    expect(screen.getByRole("button", { name: labels.toDark })).toBeTruthy();
  });
});
