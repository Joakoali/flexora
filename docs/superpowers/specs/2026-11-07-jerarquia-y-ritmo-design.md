# Jerarquía tipográfica y ritmo vertical alineados al hero

## Contexto

Medido en desktop (1440px) sobre el build de producción:

| Elemento | Tamaño |
|---|---|
| H1 del hero (`.hero__tagline`) | 56px |
| Títulos de sección (`.h2` en Servicios, Trabajos, Proceso) | 72px |
| "HABLEMOS" (`.display.closing__title`) | 160px, mayúsculas |
| Textos del marquee (`.marquee__item.display`) | 86px |

La jerarquía está invertida: el hero no es lo más grande de la página. Además
Servicios, Trabajos y Proceso tienen 144px de padding vertical, el marquee 40px,
y la grilla de Trabajos escalona las tarjetas pares con `translateY`, lo que
deja un vacío arriba a la derecha y una tarjeta suelta abajo.

`app/globals.css` es la fuente de los tokens (el spec original del home fija
`--text-display`, `--text-h2`, `--text-h3`, `--text-body`, `--text-label`).

## Objetivo

Que el hero sea la referencia de la jerarquía y que el resto de la página
siga su escala y su ritmo, sin que ninguna sección se vea desproporcionada.
No se agregan secciones, copy ni comportamiento nuevo.

## Decisiones (aprobadas)

1. **El hero manda.** El H1 del hero no cambia; todo lo demás queda por debajo.
2. **Cierre como título de sección.** "Hablemos" deja de ser display gigante y
   usa el mismo estilo que los demás títulos de sección.
3. **Trabajos en tres columnas alineadas**, sin escalonado.

## Diseño

### A. Escala tipográfica (valores en desktop 1440px)

| Token / clase | Hoy | Nuevo |
|---|---|---|
| H1 hero (`.hero__tagline`) | `min(clamp(2rem, 4vw, 3.5rem), 8.5vh)` = 56px | Sin cambios |
| `--text-h2` | `clamp(2rem, 5vw, 4.5rem)` (72px) | `clamp(1.625rem, 3.4vw, 3rem)` (≈48px; 26px mínimo) |
| `.closing__title` | `display` 160px | Clase `h2`, sin `text-transform: uppercase` ni `font-size` propio |
| `.marquee__item` | `clamp(2rem, 6vw, 5.5rem)` (86px) | `clamp(1.5rem, 4vw, 3.5rem)` (≈56px) |
| `--text-h3`, `--text-body`, `--text-label` | — | Sin cambios |

Jerarquía resultante: hero 56 > secciones 48 > h3 28 > cuerpo 16.

En mobile (390px) el H1 del hero mide ≈30px y los títulos de sección pasan a
26px, así que la relación se mantiene (hero > sección).

`--text-display` se conserva como token, pero deja de usarse en el cierre.
El marquee mantiene `font-family`/peso `.display` y define su propio `font-size`.

### B. Ritmo vertical

- Nuevo token `--section-y: clamp(4rem, 8vw, 7rem)` (≈112px desktop, 64px mobile).
- Lo usan `.section` (Servicios, Trabajos, Proceso) y `.closing__content`, en
  lugar de `clamp(4rem, 10vw, 9rem)` y `clamp(4rem, 10vw, 8rem)`.
- `.closing` pierde `min-height: 80vh`: con un título más chico dejaría aire de más.
  Conserva `overflow: hidden` y el campo WebGL de fondo.
- Sin cambios: espacio título → contenido (`clamp(2.5rem, 5vw, 4rem)`), padding del
  marquee y del footer, y todo el hero (incluida su escena sticky).

### C. Grilla de Trabajos

- `.work__grid`: 3 columnas iguales desde 1100px (`repeat(3, minmax(0, 1fr))`);
  por debajo, 1 columna. Se elimina el `:nth-child(even)` con `translateY`.
- `.work-card` pasa a columna flex y `.work-card__meta` ocupa el alto restante; el
  link "Ver sitio" queda al pie (`margin-top: auto`) para que las tarjetas queden
  parejas aunque cambie la cantidad de tags.
- Se mantiene la ventana de captura de 13rem y su auto-scroll.

## Fuera de alcance

- Layout y escena del hero, incluido el espacio vacío bajo su contenido.
- Copy, diccionarios, idiomas, formulario.
- Header, footer, Servicios y Proceso más allá de los tokens compartidos.

## Verificación

- `npm run test`, `npm run lint` y `tsc --noEmit` pasan.
- Test nuevo en `__tests__/design/tokens.test.ts`: `--text-h2` tiene el valor nuevo,
  existe `--section-y` y lo usan `.section` y `.closing__content`.
- Capturas de página completa (build de producción) en `es`, `en` y `ca`, tema
  claro y oscuro, a 1440px y 390px, más 1100px y 1099px para el cambio de grilla.
- Medición con Playwright de los tamaños computados: hero > títulos de sección >
  h3, y títulos de sección con el mismo `font-size` en Servicios, Trabajos,
  Proceso y Cierre.
- Chequear que "Hablemos" (y su equivalente en `en`/`ca`) no desborde en 390px y
  que el campo WebGL del cierre siga viéndose.
- Los e2e (`a11y`, `home`, `theme`) no deben empeorar; se corren si el navegador
  de Playwright está disponible.

## Plan de partes

Cada una se implementa y se verifica por separado:

1. Tokens y escala tipográfica (A).
2. Ritmo vertical (B).
3. Grilla de Trabajos (C).
