"use client";

import { useEffect, useRef, useState } from "react";
import { canUseWebGL, clampDpr, cssVarToRgb, isCoarsePointer, prefersReducedMotion } from "@/lib/gl";
import { FLEX_FIELD_FRAGMENT, FLEX_FIELD_VERTEX } from "./flex-field.shaders";

type Mode = "pending" | "gl" | "fallback";
type Props = { variant: "hero" | "closing"; className?: string };

export function FlexField({ variant, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  // 1. Decidir modo tras montar (SSR siempre "pending" → sin canvas en HTML).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(!prefersReducedMotion() && canUseWebGL() ? "gl" : "fallback");
  }, []);

  // 2. Inicializar OGL solo cuando el canvas exista y esté en viewport.
  useEffect(() => {
    if (mode !== "gl") return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    let disposed = false;
    let raf = 0;
    let visible = false;
    let started = false;
    let cleanupGl: (() => void) | undefined;

    const start = async () => {
      if (started || disposed) return;
      started = true;
      try {
        const { Renderer, Program, Mesh, Triangle } = await import("ogl");
        if (disposed) return;
        const coarse = isCoarsePointer();
        const renderer = new Renderer({ canvas, dpr: clampDpr(window.devicePixelRatio || 1, coarse), alpha: false, antialias: false });
        const gl = renderer.gl;
        const geometry = new Triangle(gl);
        const program = new Program(gl, {
          vertex: FLEX_FIELD_VERTEX,
          fragment: FLEX_FIELD_FRAGMENT,
          uniforms: {
            uTime: { value: 0 },
            uRes: { value: [1, 1] },
            uPointer: { value: [0.5, 0.5] },
            uPointerForce: { value: 0 },
            uAccent: { value: cssVarToRgb("--accent") },
            uBg: { value: cssVarToRgb("--bg") },
            uIntensity: { value: document.documentElement.dataset.theme === "light" ? 0.55 : 1 },
          },
        });
        const mesh = new Mesh(gl, { geometry, program });

        const resize = () => {
          const { width, height } = root.getBoundingClientRect();
          renderer.setSize(Math.max(1, width), Math.max(1, height));
          program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(root);

        // Puntero objetivo y puntero suavizado (spring crítico por exp decay).
        const target = { x: 0.5, y: 0.5, force: 0 };
        const current = { x: 0.5, y: 0.5, force: 0 };
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          target.x = (e.clientX - r.left) / r.width;
          target.y = 1 - (e.clientY - r.top) / r.height;
          target.force = 1;
        };
        const onLeave = () => {
          target.force = 0;
        };
        if (!coarse) {
          window.addEventListener("pointermove", onMove, { passive: true });
          root.addEventListener("pointerleave", onLeave);
        }

        // Tema: releer colores cuando cambia data-theme.
        const mo = new MutationObserver(() => {
          program.uniforms.uAccent.value = cssVarToRgb("--accent");
          program.uniforms.uBg.value = cssVarToRgb("--bg");
          program.uniforms.uIntensity.value = document.documentElement.dataset.theme === "light" ? 0.55 : 1;
        });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        let last = performance.now();
        const loop = (now: number) => {
          raf = requestAnimationFrame(loop);
          if (!visible || document.hidden) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const k = 1 - Math.exp(-dt * 6); // ~ SPRING_FOLLOW sin overshoot
          current.x += (target.x - current.x) * k;
          current.y += (target.y - current.y) * k;
          current.force += (target.force - current.force) * k;
          if (coarse) {
            // Sin puntero: deriva lenta autónoma.
            const t = now / 1000;
            current.x = 0.5 + Math.sin(t * 0.21) * 0.25;
            current.y = 0.5 + Math.cos(t * 0.17) * 0.2;
            current.force = 0.6;
          }
          program.uniforms.uTime.value = now / 1000;
          program.uniforms.uPointer.value = [current.x, current.y];
          program.uniforms.uPointerForce.value = current.force;
          renderer.render({ scene: mesh });
        };
        raf = requestAnimationFrame(loop);

        cleanupGl = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          mo.disconnect();
          window.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (err) {
        console.warn("[FlexField] WebGL falló, usando fallback", err);
        if (!disposed) setMode("fallback");
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) void start();
      },
      { rootMargin: "20% 0px" },
    );
    io.observe(root);

    return () => {
      disposed = true;
      io.disconnect();
      cleanupGl?.();
    };
  }, [mode]);

  return (
    <div
      ref={rootRef}
      className={`flex-field ${className}`.trim()}
      data-testid="flex-field"
      data-variant={variant}
      data-mode={mode}
      aria-hidden="true"
    >
      {mode === "gl" ? <canvas ref={canvasRef} className="flex-field__canvas" /> : <div className="flex-field__fallback" />}
    </div>
  );
}
