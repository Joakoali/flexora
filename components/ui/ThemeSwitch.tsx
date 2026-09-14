"use client";

import { useRef, useSyncExternalStore } from "react";
import { animate, useReducedMotion } from "motion/react";
import { applyTheme, readTheme, subscribeToTheme, type Theme } from "@/lib/theme";
import { SPRING_BASE } from "@/lib/motion";

type Props = { labels: { toLight: string; toDark: string } };

const getServerTheme = (): Theme => "dark";
const noopSubscribe = () => () => {};
const getMountedOnClient = () => true;
const getMountedOnServer = () => false;

export function ThemeSwitch({ labels }: Props) {
  // El script inline ya aplicó el tema antes del primer paint; leemos el DOM
  // vía useSyncExternalStore para que el cliente se sincronice sin esperar a
  // un efecto (que pintaría un frame con el tema equivocado).
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, getServerTheme);
  const mounted = useSyncExternalStore(noopSubscribe, getMountedOnClient, getMountedOnServer);
  const iconRef = useRef<SVGSVGElement>(null);
  const turns = useRef(0);
  const reduced = useReducedMotion();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    if (!reduced && iconRef.current) {
      turns.current += 1;
      animate(iconRef.current, { rotate: turns.current * 180 }, SPRING_BASE);
    }
  }

  const label = theme === "dark" ? labels.toLight : labels.toDark;

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-theme-switch
      disabled={!mounted}
    >
      <svg ref={iconRef} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M14 1a13 13 0 0 0 0 26Z" fill="var(--accent)" />
        <path d="M14 1a13 13 0 0 1 0 26Z" fill="var(--switch-half)" />
        <circle cx="14" cy="14" r="13" fill="none" stroke="var(--border)" />
      </svg>
    </button>
  );
}
