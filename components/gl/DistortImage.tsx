"use client";

import { useEffect, useRef, useState } from "react";
import type { Renderer } from "ogl";
import { canUseWebGL, clampDpr, isCoarsePointer, prefersReducedMotion } from "@/lib/gl";
import { DISTORT_FRAGMENT, DISTORT_VERTEX } from "./distort-image.shaders";

type Props = { src: string; alt: string; className?: string };

export function DistortImage({ src, alt, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  // 1. Decidir modo tras montar (SSR siempre "no mejorado" → sin canvas en HTML).
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnhanced(fine && !isCoarsePointer() && !prefersReducedMotion() && canUseWebGL());
  }, []);

  // 2. Inicializar OGL solo cuando corresponda mejorar con WebGL.
  useEffect(() => {
    if (!enhanced) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!root || !canvas || !img) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;
    let onLoad: (() => void) | undefined;

    const init = async () => {
      // Cada disposable se registra apenas se crea, para poder liberarlo
      // en el catch si un paso posterior (típicamente el compile/link del
      // Program) lanza una excepción.
      let renderer: Renderer | undefined;
      let ro: ResizeObserver | undefined;
      let onEnter: (() => void) | undefined;
      let onLeave: (() => void) | undefined;
      let onMove: ((e: PointerEvent) => void) | undefined;
      try {
        const { Renderer, Program, Mesh, Triangle, Texture } = await import("ogl");
        if (disposed) return;
        renderer = new Renderer({ canvas, dpr: clampDpr(window.devicePixelRatio || 1, false), alpha: true });
        const rendererInstance = renderer;
        const gl = rendererInstance.gl;
        const texture = new Texture(gl, {
          image: img,
          generateMipmaps: false,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
          flipY: true,
        });
        const program = new Program(gl, {
          vertex: DISTORT_VERTEX,
          fragment: DISTORT_FRAGMENT,
          uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uHover: { value: 0 },
            uPointer: { value: [0.5, 0.5] },
            uScale: { value: [1, 1] },
          },
        });
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

        const resize = () => {
          const r = root.getBoundingClientRect();
          rendererInstance.setSize(Math.max(1, r.width), Math.max(1, r.height));
          const imgAspect = img.naturalWidth / img.naturalHeight || 1.6;
          const boxAspect = r.width / r.height;
          // cover-fit: recortar el eje sobrante
          program.uniforms.uScale.value = boxAspect > imgAspect ? [1, imgAspect / boxAspect] : [boxAspect / imgAspect, 1];
        };
        resize();
        ro = new ResizeObserver(resize);
        ro.observe(root);

        const target = { hover: 0, x: 0.5, y: 0.5 };
        const cur = { hover: 0, x: 0.5, y: 0.5 };
        onEnter = () => {
          target.hover = 1;
        };
        onLeave = () => {
          target.hover = 0;
        };
        onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width;
          target.y = 1 - (e.clientY - r.top) / r.height;
        };
        root.addEventListener("pointerenter", onEnter);
        root.addEventListener("pointerleave", onLeave);
        root.addEventListener("pointermove", onMove, { passive: true });

        let last = performance.now();
        let idleFrames = 0;
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const k = 1 - Math.exp(-dt * 8);
          cur.hover += (target.hover - cur.hover) * k;
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          // Dormir cuando no hay hover ni movimiento residual.
          if (cur.hover < 0.002 && target.hover === 0) {
            idleFrames++;
            if (idleFrames > 10) {
              canvas.style.opacity = "0";
              return;
            }
          } else {
            idleFrames = 0;
            canvas.style.opacity = "1";
          }
          program.uniforms.uTime.value = now / 1000;
          program.uniforms.uHover.value = cur.hover;
          program.uniforms.uPointer.value = [cur.x, cur.y];
          rendererInstance.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro?.disconnect();
          root.removeEventListener("pointerenter", onEnter as EventListener);
          root.removeEventListener("pointerleave", onLeave as EventListener);
          root.removeEventListener("pointermove", onMove as EventListener);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (err) {
        console.warn("[DistortImage] WebGL falló, se mantiene la imagen", err);
        cancelAnimationFrame(raf);
        ro?.disconnect();
        if (onEnter) root.removeEventListener("pointerenter", onEnter);
        if (onLeave) root.removeEventListener("pointerleave", onLeave);
        if (onMove) root.removeEventListener("pointermove", onMove as EventListener);
        renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
        if (!disposed) setEnhanced(false);
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      void init();
    } else {
      onLoad = () => void init();
      img.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      disposed = true;
      if (onLoad) img.removeEventListener("load", onLoad);
      cleanup?.();
    };
  }, [enhanced]);

  return (
    <div ref={rootRef} className={`distort ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element -- textura WebGL: necesitamos el <img> real */}
      <img ref={imgRef} src={src} alt={alt} className="distort__img" loading="lazy" decoding="async" />
      {enhanced ? <canvas ref={canvasRef} className="distort__canvas" aria-hidden="true" /> : null}
    </div>
  );
}
