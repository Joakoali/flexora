"use client";

import { useRef } from "react";
import { animate } from "motion/react";
import { SPRING_BASE } from "@/lib/motion";

const MAX_STRETCH = 0.15;

export function Marquee({ items, label }: { items: string[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; width: number } | null>(null);

  const onDown = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, width: el.getBoundingClientRect().width };
    el.style.transformOrigin = e.clientX < window.innerWidth / 2 ? "right center" : "left center";
    el.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el || !drag.current) return;
    const dx = (e.clientX - drag.current.startX) / drag.current.width;
    const s = 1 + Math.max(-MAX_STRETCH, Math.min(MAX_STRETCH, dx));
    el.style.transform = `scaleX(${s})`;
  };
  const onUp = () => {
    const el = trackRef.current;
    if (!el || !drag.current) return;
    drag.current = null;
    animate(el, { scaleX: 1 }, SPRING_BASE);
  };

  const row = (hidden: boolean) => (
    <ul className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item} className="marquee__item display">
          {item}
          <span className="marquee__dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="marquee hairline" aria-label={label}>
      <div
        ref={trackRef}
        className="marquee__track"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="marquee__scroller">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}
