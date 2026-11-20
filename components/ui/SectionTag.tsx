// Rótulo mono sobre el h2 de cada sección: punto de acento, nombre y una hairline
// que llena el ancho. Es decorativo (la sección ya se nombra por su h2), por eso aria-hidden.
export function SectionTag({ children }: { children: string }) {
  return (
    <p className="label section-tag" aria-hidden="true">
      {children}
    </p>
  );
}
