/**
 * Tokens de movimiento. Fuente única: ningún componente inventa curvas ni duraciones.
 * Los mismos valores viven como variables CSS en app/globals.css.
 */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

export const DURATION = { fast: 120, base: 200, slow: 500 } as const;

/** Spring para cambios de estado discretos (switch de tema, marquee al soltar). */
export const SPRING_BASE = { type: "spring", duration: 0.4, bounce: 0.2 } as const;

/** Spring para valores que siguen al puntero (wordmark, campo). Sin bounce. */
export const SPRING_FOLLOW = { stiffness: 120, damping: 24, mass: 1 } as const;

export const REVEAL = { offsetPx: 12, staggerMs: 60 } as const;
