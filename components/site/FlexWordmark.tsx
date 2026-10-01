"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { SPRING_FOLLOW } from "@/lib/motion";
import { FlexMark } from "./FlexMark";

const WDTH_MIN = 110;
const WDTH_MAX = 150;
const WDTH_REST = 140;
// Largo del tramo que el logo del header pinta de acento ("FLEX" en FLEXORA).
const FLEX_LEN = 4;

export function FlexWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useMotionValue(WDTH_REST);
  const wdth = useSpring(raw, SPRING_FOLLOW);
  const [display, setDisplay] = useState(WDTH_REST);

  useEffect(() => {
    if (reduced || window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: PointerEvent) => {
      const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
      raw.set(WDTH_MIN + (WDTH_MAX - WDTH_MIN) * x);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [raw, reduced]);

  useMotionValueEvent(wdth, "change", (v) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--wdth", String(v));
    const rounded = Math.round(v);
    if (rounded !== display) setDisplay(rounded);
  });

  return (
    <div className="hero__wordmark">
      <FlexMark className="hero__wordmark-mark" />
      <div
        ref={ref}
        className="hero__wordmark-text"
        data-wdth={display}
        style={{ "--wdth": WDTH_REST } as CSSProperties}
      >
        {/* "FLEX" viaja de blanco a violeta con --hero-p: al aterrizar es idéntico al logo del header. */}
        <span className="hero__wordmark-flex">{text.slice(0, FLEX_LEN)}</span>
        {text.slice(FLEX_LEN)}
      </div>
    </div>
  );
}
