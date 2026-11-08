/**
 * Tokens de movimiento. Fuente única: ningún componente inventa curvas ni duraciones.
 * Los mismos valores viven como variables CSS en app/globals.css (`:root`); __tests__/design/tokens.test.ts
 * comprueba que cada espejo coincida con la constante.
 */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";

/**
 * Curva de los loops ambientales largos (scroll del showcase, `alternate` de ~16 s): la del keyword
 * CSS `ease-in-out`, escrita explícita. No usar EASE_IN_OUT acá: está pensada para movimientos de UI
 * de ~500 ms; en un recorrido de 13 s deja la imagen casi quieta varios segundos y la barre con un pico
 * de velocidad ~3x mayor, que se lee como un tirón y no como una deriva.
 */
export const EASE_LOOP = "cubic-bezier(0.42, 0, 0.58, 1)";

export const DURATION = { fast: 120, base: 200, slow: 500 } as const;

/**
 * Entrada escalonada de las ventanas del showcase del hero (ms) y su loop de scroll interno.
 * `loopMs` es la duración de una pasada (el `alternate` hace ida y vuelta); `loopPhaseMs` desfasa cada
 * ventana con un delay negativo (`-i * loopPhaseMs`) para que no scrolleen sincronizadas.
 */
export const SHOWCASE = {
  durationMs: 900,
  delayMs: 350,
  staggerMs: 140,
  loopMs: 16_000,
  loopPhaseMs: 4_000,
} as const;

/** Spring para cambios de estado discretos (switch de tema, marquee al soltar). */
export const SPRING_BASE = { type: "spring", duration: 0.4, bounce: 0.2 } as const;

/** Spring para valores que siguen al puntero (wordmark, campo). Sin bounce. */
export const SPRING_FOLLOW = { stiffness: 120, damping: 24, mass: 1 } as const;

/**
 * Gesto "subir y aparecer" (fade + desplazamiento vertical) y su escalón entre hermanos. Lo comparten
 * Reveal, la entrada del copy del hero y el botón flotante de WhatsApp.
 */
export const REVEAL = { offsetPx: 12, staggerMs: 60 } as const;

/** Entrada del panel del menú mobile: delay base antes del primer ítem (el escalón es REVEAL.staggerMs). */
export const MENU = { delayMs: 80 } as const;

/** Entrada del botón flotante de WhatsApp (ms): llega después del hero, sin competir con su copy. */
export const FAB = { delayMs: 600 } as const;
