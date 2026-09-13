"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { SPRING_FOLLOW } from "@/lib/motion";
import { FlexMark } from "./FlexMark";

const WDTH_MIN = 110;
const WDTH_MAX = 150;
const WDTH_REST = 140;

export function FlexWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
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
    el.style.fontVariationSettings = `"wdth" ${v}`;
    const rounded = Math.round(v);
    if (rounded !== display) setDisplay(rounded);
  });

  return (
    <div className="hero__wordmark">
      <FlexMark className="hero__wordmark-mark" />
      <h1
        ref={ref}
        className="hero__wordmark-text"
        data-wdth={display}
        style={{ fontVariationSettings: `"wdth" ${WDTH_REST}` }}
      >
        {text}
      </h1>
    </div>
  );
}
