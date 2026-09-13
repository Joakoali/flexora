import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FlexMark } from "@/components/site/FlexMark";

describe("FlexMark", () => {
  it("por defecto renderiza dos paths sin clases extra", () => {
    const { container } = render(<FlexMark />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute("class")).toBe("");
    expect(paths[1].getAttribute("class")).toBe("");
  });

  it("aplica classNameTop al primer path y classNameBottom al segundo", () => {
    const { container } = render(<FlexMark classNameTop="top" classNameBottom="bottom" />);
    const paths = container.querySelectorAll("path");
    expect(paths[0].getAttribute("class")).toBe("top");
    expect(paths[1].getAttribute("class")).toBe("bottom");
  });

  it("tiene tamaño intrínseco fijo 81x110 además del viewBox", () => {
    const { container } = render(<FlexMark />);
    const svg = container.querySelector("svg.flex-mark");
    expect(svg?.getAttribute("width")).toBe("81");
    expect(svg?.getAttribute("height")).toBe("110");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 81 110");
  });
});
