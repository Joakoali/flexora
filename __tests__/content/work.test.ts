import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { work } from "@/content/work";

describe("content/work", () => {
  it("tiene los 3 proyectos reales con slug único, cover existente, descripción, tags y siteUrl", () => {
    expect(work.length).toBe(3);
    expect(new Set(work.map((w) => w.slug)).size).toBe(work.length);
    for (const w of work) {
      expect(existsSync(`public${w.cover}`), w.cover).toBe(true);
      expect(w.description.es).not.toBe("");
      expect(w.description.en).not.toBe("");
      expect(w.tags.length).toBeGreaterThan(0);
      expect(w.siteUrl).toMatch(/^https:\/\//);
    }
  });
});
