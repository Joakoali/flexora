"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";

type HeroScrollContextValue = { scrollYProgress: MotionValue<number> };

const HeroScrollContext = createContext<HeroScrollContextValue | null>(null);

export function HeroScrollProvider({
  heroId = "hero",
  children,
}: {
  heroId?: string;
  children: ReactNode;
}) {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    heroRef.current = document.getElementById(heroId);
  }, [heroId]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });

  return <HeroScrollContext.Provider value={{ scrollYProgress }}>{children}</HeroScrollContext.Provider>;
}

export function useHeroScrollProgress() {
  const ctx = useContext(HeroScrollContext);
  if (!ctx) throw new Error("useHeroScrollProgress must be used within HeroScrollProvider");
  return ctx;
}
