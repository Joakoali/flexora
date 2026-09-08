"use client";

import { createElement, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementType } from "react";

type Props<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

export function Reveal<T extends ElementType = "div">({ as, children, ...rest }: Props<T>) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return createElement(
    as ?? "div",
    // eslint-disable-next-line react-hooks/refs
    { ref, "data-reveal": "", ...(visible ? { "data-visible": "" } : {}), ...rest },
    children,
  );
}
