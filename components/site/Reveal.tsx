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
      setTimeout(() => setVisible(true), 0);
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

  const props = {
    ref,
    "data-reveal": "",
    ...(visible ? { "data-visible": "" } : {}),
    ...rest,
  };

  return createElement(as ?? "div", props, children);
}
