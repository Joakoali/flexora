import { FlexMark } from "./FlexMark";

/** Un fragmento de interfaz: barra, bloques de layout y un cursor. */
export function DevVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <rect x="0.5" y="0.5" width="319" height="28" rx="8" fill="none" stroke="var(--border)" />
      <circle cx="16" cy="14" r="3" fill="var(--fg-muted)" />
      <circle cx="28" cy="14" r="3" fill="var(--fg-muted)" />
      <rect x="20" y="48" width="130" height="14" rx="2" fill="var(--fg)" />
      <rect x="20" y="70" width="180" height="8" rx="2" fill="var(--fg-muted)" opacity="0.6" />
      <rect x="20" y="84" width="150" height="8" rx="2" fill="var(--fg-muted)" opacity="0.6" />
      <rect x="20" y="108" width="96" height="30" rx="6" fill="var(--accent)" />
      <rect x="220" y="48" width="80" height="120" rx="6" fill="none" stroke="var(--accent)" strokeDasharray="4 4" />
      <path d="M236 128 l10 26 4-10 10-4z" fill="var(--fg)" />
    </svg>
  );
}

/** Una curva de resultados sobre grilla, con el punto final resaltado. */
export function AdsVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="20" x2="300" y1={y} y2={y} stroke="var(--border)" />
      ))}
      <path d="M20 160 C 70 150, 100 140, 130 120 S 200 70, 240 60 S 280 40, 300 30" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 160 C 70 150, 100 140, 130 120 S 200 70, 240 60 S 280 40, 300 30 V 180 H 20 Z" fill="var(--accent)" opacity="0.12" />
      <circle cx="300" cy="30" r="5" fill="var(--accent)" />
      <text x="20" y="188" fontFamily="var(--font-geist-mono)" fontSize="9" fill="var(--fg-muted)" letterSpacing="1">ROAS</text>
      <text x="300" y="20" textAnchor="end" fontFamily="var(--font-geist-mono)" fontSize="11" fill="var(--fg)" fontWeight="600">+3.4x</text>
    </svg>
  );
}

/** El FlexMark armándose: sus dos paths deslizan hacia el centro con el reveal. */
export function BrandVisual() {
  return (
    <svg className="svis" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="0.5" y="0.5" width="319" height="199" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <g transform="translate(111 34) scale(1.2)">
        <FlexMark classNameTop="svis__chev svis__chev--a" classNameBottom="svis__chev svis__chev--b" />
      </g>
      <line x1="20" x2="300" y1="176" y2="176" stroke="var(--border)" />
      <text x="20" y="190" fontFamily="var(--font-geist-mono)" fontSize="9" fill="var(--fg-muted)" letterSpacing="1">F · 03</text>
    </svg>
  );
}
