"use client";

import { useEffect } from "react";
import { useMotionValueEvent, useReducedMotion } from "motion/react";
import { useHeroScrollProgress } from "./HeroScrollProvider";

/**
 * Mide dónde tiene que "aterrizar" el wordmark (el logo del header) y publica
 * --wm-scale/--wm-x/--wm-y en <html>. Si el navegador no soporta scroll-driven
 * animations, publica también --hero-p desde el scroll con Motion.
 */
export function HeroProgress({ heroId = "hero" }: { heroId?: string }) {
  const reduced = useReducedMotion();
  const supportsTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()");

  useEffect(() => {
    const html = document.documentElement;

    const measure = () => {
      const wm = document.querySelector<HTMLElement>(".hero__wordmark");
      const sticky = document.querySelector<HTMLElement>(".hero__sticky");
      const logo = document.getElementById("site-logo");
      if (!wm || !sticky || !logo) return;
      // Primero las lecturas del logo, antes de tocar ningún estilo: así la única
      // lectura que fuerza layout es la del wordmark, más abajo.
      const b = logo.getBoundingClientRect();
      const logoMarkH = logo.querySelector<HTMLElement>(".logo__mark")?.getBoundingClientRect().height;
      if (!logoMarkH) return;
      // El wordmark cambia de ancho con --hero-p (su wdth converge a 150, el del
      // logo), así que se mide ya aterrizado (p=1) y con el transform neutralizado.
      // Una sola medición alcanza: con justify-self/align-self: start su left y su
      // top son los mismos en reposo (p=0) que aterrizado; sólo cambia el tamaño.
      const prev = wm.style.transform;
      const prevP = wm.style.getPropertyValue("--hero-p");
      wm.style.transform = "none";
      wm.style.setProperty("--hero-p", "1");
      const landed = wm.getBoundingClientRect();
      const wmMarkH = wm.querySelector<HTMLElement>(".hero__wordmark-mark")?.getBoundingClientRect().height;
      const stickyTop = sticky.getBoundingClientRect().top;
      if (prevP) wm.style.setProperty("--hero-p", prevP);
      else wm.style.removeProperty("--hero-p");
      wm.style.transform = prev;
      if (!wmMarkH) return;
      // La caja del logo trae aire a la derecha (el SVG del texto), así que la
      // escala sale de la altura del símbolo, que es la medida de marca, y la
      // posición se ancla al borde izquierdo en vez de al centro de la caja.
      const scale = logoMarkH / wmMarkH;
      const ax = landed.left + landed.width / 2;
      // El viaje ocurre con el hero pegado arriba, así que la referencia vertical
      // es la posición del wordmark dentro de .hero__sticky, no el scroll actual:
      // así medir a mitad de scroll (o pasado el hero, cuando el sticky ya se
      // despegó) da el mismo resultado que medir arriba de todo.
      const ay = landed.top + landed.height / 2 - stickyTop;
      const bx = b.left + (landed.width * scale) / 2;
      const by = b.top + b.height / 2; // el header es fixed: coordenadas de viewport
      html.style.setProperty("--wm-scale", scale.toFixed(4));
      html.style.setProperty("--wm-x", `${(bx - ax).toFixed(1)}px`);
      html.style.setProperty("--wm-y", `${(by - ay).toFixed(1)}px`);
    };

    measure();
    // Sólo el ancho cambia el resultado (el alto del body se mueve con cualquier
    // contenido, p. ej. al enviar el formulario): se ignora si el ancho es el
    // mismo, y la primera notificación del observer, que repetiría el measure().
    let lastWidth: number | null = null;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? document.body.clientWidth;
      const first = lastWidth === null;
      const changed = width !== lastWidth;
      lastWidth = width;
      if (!first && changed) measure();
    });
    ro.observe(document.body);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [heroId]);

  const { scrollYProgress } = useHeroScrollProgress();
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!supportsTimeline && !reduced) document.documentElement.style.setProperty("--hero-p", p.toFixed(4));
  });

  return null;
}
