import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Process } from "@/components/site/Process";
import es from "@/app/[lang]/dictionaries/es.json";

describe("Process", () => {
  it("antepone al h2 un rótulo decorativo con el nombre de la sección", () => {
    const { container } = render(<Process t={es.process} />);
    const tag = container.querySelector("p.section-tag");
    expect(tag?.textContent).toBe(es.process.tag);
    expect(tag?.getAttribute("aria-hidden")).toBe("true");
    expect(tag?.nextElementSibling?.tagName).toBe("H2");
  });
});
