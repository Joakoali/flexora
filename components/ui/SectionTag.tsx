import { Label } from "./Label";

// Rótulo mono sobre el h2 de cada sección: punto de acento, nombre y una hairline
// que llena el ancho. Es decorativo (la sección ya se nombra por su h2), por eso aria-hidden.
export function SectionTag({ children }: { children: string }) {
  return (
    <Label as="p" className="section-tag" aria-hidden>
      {children}
    </Label>
  );
}
