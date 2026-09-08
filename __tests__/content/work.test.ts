import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { work } from "@/content/work";

describe("content/work", () => {
  it("tiene entre 3 y 4 proyectos con slug único y cover existente", () => {
    expect(work.length).toBeGreaterThanOrEqual(3);
    expect(work.length).toBeLessThanOrEqual(4);
    expect(new Set(work.map((w) => w.slug)).size).toBe(work.length);
    for (const w of work) {
      expect(existsSync(`public${w.cover}`), w.cover).toBe(true);
      expect(w.result.es).not.toBe("");
      expect(w.result.en).not.toBe("");
    }
  });
});
