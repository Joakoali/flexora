import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Marquee } from "@/components/site/Marquee";

describe("Marquee", () => {
  it("duplica los items y oculta la copia a lectores de pantalla", () => {
    render(<Marquee items={["Uno", "Dos"]} label="Servicios" />);
    const all = screen.getAllByText(/Uno|Dos/);
    expect(all).toHaveLength(4);
    const hidden = all.filter((el) => el.closest("[aria-hidden='true']"));
    expect(hidden).toHaveLength(2);
  });
});
