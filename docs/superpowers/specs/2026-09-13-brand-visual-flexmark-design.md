# Brand visual: reemplazar la X por el FlexMark

## Contexto

La sección "Tres disciplinas, un solo equipo" (`components/site/Services.tsx`)
muestra tres visuales, uno por disciplina, vía `ServiceVisuals.tsx`:
`DevVisual` (01/Desarrollo), `AdsVisual` (02/Marketing) y `BrandVisual`
(03/Branding).

`BrandVisual` dibuja el logo anterior de la marca: una X construida con dos
chevrones (`svis__chev--a` en blanco, `svis__chev--b` en violeta), con un
label `X · 01` en la esquina inferior. Ese logo quedó obsoleto: la marca
actual es el `FlexMark`, una F construida con dos paths y gradiente
(`components/site/FlexMark.tsx`), ya en uso en el Header (`Logo.tsx`) y en el
Hero (`FlexWordmark.tsx`). El visual de Branding sigue mostrando la marca
vieja y además tiene el índice del label mal (`01` en vez de `03`).

## Objetivo

Que el visual de la disciplina de Branding muestre el `FlexMark` real
(la F, con su gradiente), animado de la misma forma en que hoy se anima la
X (cada mitad del logo entra deslizando desde su lado cuando la card hace
reveal), y con el label corregido.

## Fuera de alcance

- No se toca `DevVisual` ni `AdsVisual`.
- No se toca el `FlexMark`, `Logo` ni `FlexWordmark` existentes — se reutiliza
  el componente tal cual.
- No se toca la sección Work / datos reales de clientes (spec separado).

## Diseño

### Componente (`components/site/ServiceVisuals.tsx`)

`BrandVisual` deja de dibujar los dos `<path>` de la X a mano y en su lugar
renderiza el `FlexMark` importado, centrado dentro del mismo frame de
320×200 que ya usan `DevVisual`/`AdsVisual`:

- Se envuelve el `<FlexMark>` en un `<g>` posicionado y escalado para quedar
  centrado y con una altura similar a la que ocupaba la X (viewBox de
  `FlexMark` es `0 0 81 110`; se centra dentro del frame con un `transform`
  fijo, sin recalcular en runtime).
- Los dos `<path>` internos del `FlexMark` reciben las clases
  `svis__chev--a` (el path superior) y `svis__chev--b` (el path inferior),
  reutilizando la transición ya definida en CSS — no se agrega mecánica
  nueva. Para esto, `FlexMark` gana una prop opcional para pasar clases a
  cada path (por defecto sin clases, así no afecta a Header/Hero).
- El label inferior pasa de `X · 01` a `F · 03` (corrigiendo también el
  índice, que correspondía a Branding = 03).
- El comentario del componente se actualiza para reflejar que ahora arma el
  FlexMark, no la X.

### FlexMark (`components/site/FlexMark.tsx`)

Se agregan dos props opcionales, `classNameTop` y `classNameBottom`, que se
aplican respectivamente al primer y segundo `<path>` del logo (además de la
clase `className` existente, que sigue aplicándose al `<svg>` raíz). Sin
valor, el comportamiento es idéntico al actual (Header, Hero no pasan nada).
Esto evita duplicar el SVG del logo en `BrandVisual` y mantiene una sola
fuente de verdad para la forma de la marca.

### CSS (`app/globals.css`)

No se agregan reglas nuevas. Las reglas existentes (líneas ~680-686) ya
targetean `.svis__chev`, `.svis__chev--a`, `.svis__chev--b` por clase, no por
elemento — funcionan igual aplicadas a los paths del FlexMark.

## Testing

- Visual: correr `next dev`, ir a la sección de servicios, verificar que la
  card de Branding muestra la F con gradiente (no la X), que anima al hacer
  scroll-reveal igual que antes, y que el label dice `F · 03`.
- Confirmar que Header y Hero (que también usan `FlexMark`) no cambian
  visualmente (las props nuevas son opcionales).
- No hace falta test automatizado nuevo: es un cambio puramente visual sin
  lógica; se verifica con el flujo normal de revisión visual del proyecto.

## Archivos afectados

- `components/site/FlexMark.tsx` (props opcionales de clase por path)
- `components/site/ServiceVisuals.tsx` (`BrandVisual` reescrito)
