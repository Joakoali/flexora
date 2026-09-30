import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { HeroScrollProvider, useHeroScrollProgress } from "@/components/site/HeroScrollProvider";

function Probe({ onValue }: { onValue: (v: number) => void }) {
  const { scrollYProgress } = useHeroScrollProgress();
  onValue(scrollYProgress.get());
  return null;
}

// Deja correr los efectos y el microtask en el que Motion arranca el seguimiento
// del scroll (ahí es donde falla si el target nunca se monta).
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
}

describe("HeroScrollProvider", () => {
  it("funciona en una página sin #hero", async () => {
    let value: number | undefined;
    render(
      <HeroScrollProvider>
        <Probe onValue={(v) => (value = v)} />
      </HeroScrollProvider>,
    );
    await flush();
    expect(value).toBe(0);
  });

  it("expone el progreso cuando hay #hero", async () => {
    let value: number | undefined;
    render(
      <HeroScrollProvider>
        <section id="hero" />
        <Probe onValue={(v) => (value = v)} />
      </HeroScrollProvider>,
    );
    await flush();
    expect(value).toBe(0);
  });
});
