"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

/**
 * Mide dónde tiene que "aterrizar" el wordmark (el logo del header) y publica
 * --wm-scale/--wm-x/--wm-y en <html>. Si el navegador no soporta scroll-driven
 * animations, publica también --hero-p desde el scroll con Motion.
 */
export function HeroProgress({ heroId = "hero" }: { heroId?: string }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const supportsTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

  useEffect(() => {
    heroRef.current = document.getElementById(heroId);
    const html = document.documentElement;

    const measure = () => {
      const wm = document.querySelector<HTMLElement>(".hero__wordmark");
      const sticky = document.querySelector<HTMLElement>(".hero__sticky");
      const logo = document.getElementById("site-logo");
      if (!wm || !sticky || !logo) return;
      // Medir el wordmark en reposo: neutralizar el transform actual.
      const prev = wm.style.transform;
      wm.style.transform = "none";
      const a = wm.getBoundingClientRect();
      wm.style.transform = prev;
      const b = logo.getBoundingClientRect();
      const scale = b.width / a.width;
      const ax = a.left + a.width / 2;
      // El viaje ocurre con el hero pegado arriba, así que la referencia vertical
      // es la posición del wordmark dentro de .hero__sticky, no el scroll actual:
      // así medir a mitad de scroll (o pasado el hero, cuando el sticky ya se
      // despegó) da el mismo resultado que medir arriba de todo.
      const ay = a.top + a.height / 2 - sticky.getBoundingClientRect().top;
      const bx = b.left + b.width / 2;
      const by = b.top + b.height / 2; // el header es fixed: coordenadas de viewport
      html.style.setProperty("--wm-scale", scale.toFixed(4));
      html.style.setProperty("--wm-x", `${(bx - ax).toFixed(1)}px`);
      html.style.setProperty("--wm-y", `${(by - ay).toFixed(1)}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [heroId]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!supportsTimeline && !reduced) document.documentElement.style.setProperty("--hero-p", p.toFixed(4));
  });

  return null;
}
