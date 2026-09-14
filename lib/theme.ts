export type Theme = "dark" | "light";
export const THEME_KEY = "flexora-theme";
const THEME_CHANGE_EVENT = "flexora:theme-change";

export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersLight ? "light" : "dark";
}

/**
 * Se inyecta inline en <html> y corre antes del primer paint (guía de Next
 * "preventing flash before hydration"). Debe replicar resolveTheme sin imports.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_KEY}");var l=window.matchMedia("(prefers-color-scheme: light)").matches;var t=(s==="light"||s==="dark")?s:(l?"light":"dark");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

let changingTimer: ReturnType<typeof setTimeout> | undefined;

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.add("theme-changing");
  html.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sin storage (modo privado): el tema dura la sesión.
  }
  clearTimeout(changingTimer);
  changingTimer = setTimeout(() => html.classList.remove("theme-changing"), 250);
  document.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function readTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  return current === "light" ? "light" : "dark";
}

/** Notifica a los suscriptores (p. ej. useSyncExternalStore) cuando applyTheme muta el DOM. */
export function subscribeToTheme(onChange: () => void): () => void {
  document.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => document.removeEventListener(THEME_CHANGE_EVENT, onChange);
}
