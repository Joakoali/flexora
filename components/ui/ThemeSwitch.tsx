"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";
import { SPRING_BASE } from "@/lib/motion";

type Props = { labels: { toLight: string; toDark: string } };

export function ThemeSwitch({ labels }: Props) {
  // El script inline ya aplicó el tema; leemos el DOM tras montar para no desincronizar SSR.
  const [state, setState] = useState({ theme: "dark" as Theme, mounted: false });
  const iconRef = useRef<SVGSVGElement>(null);
  const turns = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ theme: readTheme(), mounted: true });
  }, []);

  function toggle() {
    const next: Theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setState(prev => ({ ...prev, theme: next }));
    if (!reduced && iconRef.current) {
      turns.current += 1;
      animate(iconRef.current, { rotate: turns.current * 180 }, SPRING_BASE);
    }
  }

  const label = state.theme === "dark" ? labels.toLight : labels.toDark;

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-switch
      disabled={!state.mounted}
    >
      <svg ref={iconRef} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M14 1a13 13 0 0 0 0 26Z" fill="var(--accent)" />
        <path d="M14 1a13 13 0 0 1 0 26Z" fill="var(--switch-half)" />
        <circle cx="14" cy="14" r="13" fill="none" stroke="var(--border)" />
      </svg>
    </button>
  );
}
