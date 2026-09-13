import { describe, expect, it } from "vitest";
import { clients } from "@/content/clients";

describe("content/clients", () => {
  it("tiene slugs únicos y name no vacío", () => {
    expect(new Set(clients.map((c) => c.slug)).size).toBe(clients.length);
    for (const c of clients) {
      expect(c.name.trim()).not.toBe("");
    }
  });
});
