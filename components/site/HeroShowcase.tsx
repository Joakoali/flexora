"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { SPRING_FOLLOW } from "@/lib/motion";

export type ShowcaseItem = { client: string; cover: string; siteUrl: string };

// Cuánto se desplaza cada capa (px) con el puntero: la del fondo casi no se mueve.
const DEPTHS = [18, 10, 5] as const;

function Layer({ depth, px, py, className, children }: {
  depth: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  className: string;
  children: ReactNode;
}) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/**
 * Pieza decorativa a la derecha del hero: ventanas de navegador en cascada con
 * capturas de proyectos reales. Es aria-hidden: la sección Work cubre lo mismo
 * con links. Todo el color sale de tokens, así que sigue al tema.
 */
export function HeroShowcase({ items }: { items: ShowcaseItem[] }) {
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, SPRING_FOLLOW);
  const py = useSpring(rawY, SPRING_FOLLOW);

  useEffect(() => {
    if (reduced || window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    // Por debajo de 1280px el showcase está oculto (display: none): no hay nada
    // que mover, así que el listener sólo vive mientras el viewport es ancho.
    const wide = window.matchMedia("(min-width: 1280px)");
    const sync = () => {
      window.removeEventListener("pointermove", onMove);
      if (wide.matches) window.addEventListener("pointermove", onMove, { passive: true });
    };
    sync();
    wide.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
    };
  }, [rawX, rawY, reduced]);

  return (
    <div className="hero-showcase" aria-hidden="true">
      {items.slice(0, DEPTHS.length).map((item, i) => (
        <Layer
          key={item.client}
          depth={DEPTHS[i]}
          px={px}
          py={py}
          className={`hero-showcase__layer hero-showcase__layer--${i}`}
        >
          <div className="hero-showcase__win" style={{ "--i": i } as CSSProperties}>
            <div className="hero-showcase__bar">
              <span className="work-card__dot work-card__dot--red" />
              <span className="work-card__dot work-card__dot--yellow" />
              <span className="work-card__dot work-card__dot--green" />
              <span className="hero-showcase__url">{new URL(item.siteUrl).hostname}</span>
            </div>
            <div className="hero-showcase__view">
              {/* eslint-disable-next-line @next/next/no-img-element -- captura completa animada por CSS, sin next/image */}
              <img src={item.cover} alt="" loading="lazy" decoding="async" fetchPriority="low" />
            </div>
          </div>
        </Layer>
      ))}
    </div>
  );
}
