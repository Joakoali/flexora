# Flexora — Sistema visual y home

Fecha: 2026-09-07
Estado: aprobado en brainstorming, pendiente de plan de implementación

## 1. Contexto

Flexora es un emprendimiento de marketing y desarrollo web. Este repo es su sitio. Esta etapa entrega dos cosas: el **sistema visual** (tokens, tipografía, componentes base, lenguaje de movimiento) y la **home completa** aplicándolo. Las páginas de casos, servicios y contacto vienen después, sobre este sistema.

### Hechos confirmados con el cliente

- **Servicios:** desarrollo web, marketing digital y ads, branding e identidad.
- **Público:** mezcla de pymes, startups y marcas. Sin foco todavía. Tono claro, directo, sin jerga.
- **Conversión:** escribir por WhatsApp. Toda la home empuja a esa acción.
- **Idiomas:** español (voseo) e inglés (neutro), desde el día uno.
- **Marca:** hay una idea de logo (ver `public/Flexora idea 1.jpeg`): wordmark en sans geométrica ancha, "FLE" y la X en violeta, "ORA" en blanco, sobre negro. Anclas confirmadas: fondo oscuro, violeta como único acento, tipografía ancha geométrica. La X como símbolo no es ancla: puede usarse, no debe dominar.
- **Ambición:** cinematográfica. WebGL liviano, scroll que transforma, micro-interacciones en todo. Debe verse bien en un celular de gama media.
- **Portfolio:** hay varios proyectos reales con imágenes.
- **Equipo:** no aparece en la home.
- **Copy:** lo escribe un colega. El código lleva textos placeholder realistas, todos en los diccionarios de idioma, ninguno hardcodeado en componentes.

### El problema de diseño

Negro + violeta es la paleta más saturada del mercado (Linear, Resend, cada SaaS de IA). Con esa paleta anclada, el color no puede ser lo que hace memorable al sitio. Lo memorable tiene que ser un concepto que nadie pueda copiar, demostrado en el primer viewport.

## 2. Concepto: "Flex"

El nombre ya lo dice: Flexora se adapta. **Todo el sitio cede y vuelve.** Un solo motivo, orquestado, repetido en cada capa:

- El wordmark del hero cambia de anchura siguiendo al cursor.
- Un campo de luz violeta en WebGL detrás se deforma como una tela elástica.
- Al scrollear, el wordmark se comprime y viaja hasta el logo del header.
- Las secciones ceden al entrar. Los covers del portfolio se deforman al hover. El marquee se estira al arrastrar.

Test de memoria: alguien que se va tras un viewport describe "la web que se estira". Eso es un concepto, no un mood.

Modo (según impeccable): **Persuade**. El visitante decide y actúa.

## 3. Sistema visual

### 3.1 Color

Tokens semánticos. Ningún componente usa un color literal.

| Token | Oscuro (default) | Claro |
|---|---|---|
| `--bg` | `#09090B` | `#F6F5FA` |
| `--surface` | `#111114` | `#FFFFFF` |
| `--fg` | `#F4F3F8` | `#0E0E12` |
| `--fg-muted` | `#A1A0AC` | `#5D5C6A` |
| `--border` | blanco al 8% | negro al 8% |
| `--accent` | `#7A3BFF` | `#6A2BF2` |
| `--accent-soft` | `#B79CFF` | `#8A5CFF` |

Reglas:

- Un solo acento. `--accent-soft` se usa solo para focus rings y texto violeta pequeño.
- Sin gradientes decorativos, sin glassmorphism, sin bordes degradados, sin tiles de íconos genéricos. El único brillo del sitio es el campo WebGL del hero.
- El fondo oscuro no es `#000` puro para que las superficies puedan apilarse. El claro no es `#FFF` puro por la misma razón.
- El campo WebGL tiene dos calibraciones, no un fondo invertido: luz violeta sobre negro en oscuro, tela violeta sobre papel en claro, con intensidad y mezcla ajustadas para que el claro no quede lavado.
- Contraste: texto normal AA mínimo en ambos temas. `--accent` sobre `--bg` solo en texto grande o como fondo de botón con texto blanco.

### 3.2 Tema

- **Detección:** al cargar se respeta `prefers-color-scheme`. Si el visitante usa el switch, la elección se guarda en `localStorage` y gana sobre el sistema.
- **Sin flash:** un script inline en el `<html>` aplica `data-theme` antes del primer paint, siguiendo la guía de Next "preventing flash before hydration". El `<html>` lleva `suppressHydrationWarning`.
- **Switch:** círculo de 28px en el header, partido en dos mitades verticales. Una mitad siempre violeta. La otra es negra en modo oscuro y blanca en modo claro. Al tocarlo rota 180° con spring (unos 400ms, bounce 0.2) y la mitad cambia de color durante el giro. Los colores de la página transicionan en 200ms. Tiene `aria-label` con el tema al que cambia.

### 3.3 Tipografía

Tres roles, tres familias, cada una con un trabajo que las otras no hacen.

| Rol | Familia | Uso |
|---|---|---|
| Display | **Anybody** (Google, variable, ejes `wght` 100–900 y `wdth` 50–150) | Wordmark del hero, títulos de sección, "Hablemos" del cierre. Anchura 125–150 para hacer eco del logo. El eje `wdth` es el mecanismo flex. |
| Cuerpo | **Geist** (ya en el proyecto) | Párrafos, descripciones, nav, botones. |
| Etiquetas | **Geist Mono** | Rótulos en mayúsculas con tracking amplio (`01 / SERVICIOS`), metadata de proyectos, pasos del proceso. |

- Carga vía `next/font/google`, self-hosted, `display: swap`, solo subset `latin`. Anybody con `axes: ['wdth']`.
- El logo es un SVG en `public/logo.svg` con su propia forma; no depende de ninguna fuente.
- Escala fluida con `clamp()`. Display: 56px en móvil a 160px en desktop. H2: 32px a 72px. Cuerpo: nunca bajo 16px. Roles como tokens (`--text-display`, `--text-h2`, `--text-body`, `--text-label`).
- Sobre fondo oscuro: un poco más de interlineado y tracking en el cuerpo, según typeset.
- Medida de lectura entre 45 y 75 caracteres.

### 3.4 Forma y espacio

- Esquinas 4 a 8px. Nunca píldoras: el logo es cuadrado y el sitio también.
- Separadores de 1px con `--border`.
- Grilla de 12 columnas fluida, ancho máximo 1440px, gutters con `clamp()`.
- Una sola escala de espaciado (base 4px). Más espacio arriba de un título que abajo.

### 3.5 Componentes base (`components/ui/`)

- **Button:** primaria (fondo `--accent`, texto blanco) y secundaria (texto con subrayado). Press: `scale(0.97)`, 120ms.
- **Link:** subrayado que crece desde la izquierda, 200ms.
- **Label:** mono, mayúsculas, tracking.
- **ThemeSwitch** y **LangSwitch.**

## 4. Home

Orden y ritmo del scroll. Las secciones densas alternan con silenciosas para que el hero no sea lo único que se recuerde.

| # | Sección | Contenido | Ritmo |
|---|---|---|---|
| 1 | **Header** | Logo SVG. Nav: Servicios, Trabajos, Contacto. Derecha: switch ES/EN, switch de tema, botón "Hablemos" (WhatsApp). Fijo; el fondo aparece recién al scrollear. | — |
| 2 | **Hero** | Wordmark FLEXORA a ancho completo en Anybody, anchura que sigue al cursor (en móvil respira solo, lento). Campo violeta WebGL detrás. Una frase de tesis. Acciones: "Hablemos" (primaria), "Ver trabajos" (texto). Al scrollear el wordmark se comprime y viaja al logo del header. | Motion alto |
| 3 | **Marquee** | Banda con las tres disciplinas en display, velocidad constante. Se estira al arrastrar y vuelve con spring. | Denso |
| 4 | **Servicios** | Tres bloques a ancho completo: Desarrollo web, Marketing y ads, Branding. Cada uno: rótulo mono (`01 / DESARROLLO`), título, dos líneas, lista de entregables, y un visual propio autorado: fragmento de interfaz para dev, curva de resultados para ads, la X construyéndose para branding. Nada de íconos genéricos. | Estructurado |
| 5 | **Trabajos** | Cuatro proyectos reales con covers grandes (tres si no hay material para el cuarto). Cliente, qué se hizo, un resultado concreto. Hover: el cover se deforma con el mismo shader del hero (no en touch). Cada uno linkea a su caso (ruta futura, por ahora `#`). | Imagen |
| 6 | **Cómo trabajamos** | Cuatro pasos en mono y texto. Sin visual. | Silencio |
| 7 | **Cierre** | "Hablemos" en display gigante, el campo violeta vuelve, botón a WhatsApp, mail como alternativa. | Motion vuelve |
| 8 | **Footer** | Logo, links, redes, idioma, copyright. | — |

Voz: voseo en español, directo y sin jerga. Inglés neutro. Los textos definitivos los escribe el colega editando solo los diccionarios.

## 5. Lenguaje de movimiento

Un solo motivo: las cosas ceden y vuelven. Cada animación responde "¿por qué se mueve?" con feedback, continuidad espacial, evitar un salto brusco, o deleite (solo en momentos raros). Si no puede responder, no se anima.

### 5.1 Tokens (`lib/motion.ts` y variables CSS)

```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
--dur-fast:    120ms   (press)
--dur-base:    200ms   (hover, tema, links)
--dur-slow:    500ms   (reveals)
spring base:   { type: "spring", duration: 0.4, bounce: 0.2 }
```

Ningún componente inventa curvas ni duraciones propias. Nunca `ease-in`, nunca `scale(0)`, nunca `transition: all`.

### 5.2 Firma (hero)

- La anchura del wordmark (`font-variation-settings: "wdth"`) y la deformación del campo siguen al cursor a través de un spring (`useSpring` de Motion), no de forma directa, para que tengan inercia.
- En touch, el wordmark oscila solo entre anchura 125 y 150 en un ciclo lento (unos 6s, ease-in-out). El campo se deforma con un ruido lento en lugar de puntero.
- Al scrollear, el wordmark se comprime y se traslada hasta la posición del logo del header. Animación ligada al scroll: CSS `animation-timeline: scroll()` dentro de `@supports`; fallback con `useScroll` de Motion.
- Scroll nativo. Sin librerías de smooth scroll.

### 5.3 Reveals

Las secciones entran una sola vez: 12px de `translateY` y opacidad de 0 a 1, `--dur-slow`, `--ease-out`, stagger de 60ms entre hijos directos. Implementación con CSS y una clase que agrega un `IntersectionObserver`, no con Motion.

### 5.4 Interacciones

- Botones: `scale(0.97)` al presionar, `--dur-fast`.
- Links: subrayado que crece desde la izquierda, `--dur-base`.
- Covers de trabajos: distorsión de shader suavizada con spring. Solo con `hover: hover`.
- Marquee: lineal, constante. Al arrastrar se estira (scaleX del contenedor) y vuelve con spring base.
- Switch de tema: rotación 180° con spring base; colores de página en `--dur-base`.
- Switch de idioma: sin animación, es navegación.

### 5.5 Reduced motion y performance

- `prefers-reduced-motion: reduce`: wordmark fijo en anchura 140, campo reemplazado por imagen estática, reveals instantáneos, marquee detenido, switch sin giro.
- WebGL: se inicializa recién cuando el hero entra en viewport, se pausa fuera de vista (`IntersectionObserver` y `visibilitychange`), DPR máximo 1.5 en desktop y 1 en móvil.
- Objetivo 60fps en gama media. Si baja de 50, se simplifica el shader; no se agregan trucos.

## 6. Arquitectura técnica

### 6.1 Stack

Next 16 App Router, React 19, Tailwind 4 con tokens en `@theme`, TypeScript. Dependencias nuevas: `motion`, `ogl`, `negotiator`, `@formatjs/intl-localematcher`. Nada más. Sin CMS, sin librería de i18n.

Antes de escribir código se lee `node_modules/next/dist/docs/` para cada API usada, como pide AGENTS.md.

### 6.2 Routing e idioma

- Todo vive bajo `app/[lang]/`. Locales: `es` (default) y `en`.
- `proxy.ts` en la raíz (Next 16 renombró middleware a proxy) redirige rutas sin locale al idioma del navegador usando `negotiator` y `intl-localematcher`. Matcher excluye `_next` y archivos estáticos.
- `app/[lang]/dictionaries.ts` carga `dictionaries/es.json` o `en.json` con `next/root-params`, así ningún componente recibe `lang` por props. Locale inválido devuelve 404.
- `generateStaticParams` en el layout prerenderiza `es` y `en`. La home es estática al 100%.
- Contenido de proyectos en `content/work.ts` (título, cliente, cover, resultado por idioma).

### 6.3 Estructura

```
app/[lang]/layout.tsx        html, fuentes, script de tema, header, footer
app/[lang]/page.tsx          compone las secciones de la home
app/[lang]/dictionaries.ts
app/[lang]/dictionaries/es.json, en.json
proxy.ts
components/ui/               Button, Link, Label, ThemeSwitch, LangSwitch
components/site/             Header, Hero, Marquee, Services, Work, Process, Closing, Footer
components/gl/               FlexField.tsx, flex-field.vert, flex-field.frag
lib/i18n.ts                  locales, matcher
lib/theme.ts                 resolución de tema, script inline
lib/motion.ts                tokens de motion
content/work.ts
public/logo.svg, public/covers/, public/field-fallback-{dark,light}.jpg
```

### 6.4 Server vs client

Todo es Server Component por defecto. Client solo: `FlexField`, el wordmark del hero, `Marquee`, `ThemeSwitch`, `LangSwitch`, y `Header` (estado de scroll). El resto es HTML estático.

### 6.5 Errores y degradación

- WebGL ausente o con error: el hero muestra `field-fallback-*.jpg`. El componente captura el error y nunca rompe la página.
- Cover que no carga: el bloque mantiene su tamaño con fondo `--surface`.
- Clave faltante en un diccionario: falla el build (test de paridad), no la página.

### 6.6 Metadata y SEO

`generateMetadata` por idioma con título, descripción, `alternates.languages` y Open Graph con una imagen por idioma. Analytics no entra en esta etapa.

## 7. Verificación

| Capa | Herramienta | Qué cubre |
|---|---|---|
| Unitaria | Vitest, con TDD | Paridad de claves entre `es.json` y `en.json`. Matcher de `Accept-Language`. Resolución de tema (guardado gana sobre sistema). Tokens de motion con los valores del spec. |
| Componentes | Testing Library | ThemeSwitch cambia `data-theme` y persiste. LangSwitch navega a la ruta correcta. Header entra en estado scrolled. Componentes GL renderizan el fallback en jsdom. |
| End-to-end | Playwright | Por idioma: `/` redirige según navegador, las ocho secciones existen, sin errores de consola, sin scroll horizontal a 390px. Tema persiste tras recarga. Con reduced-motion no hay animaciones corriendo. Con WebGL deshabilitado se ve el fallback. Axe sin violaciones. Teclado llega al botón de WhatsApp. |
| Diseño y performance | Manual, dos rondas máximo | Screenshots a 1440 y 390 en ambos temas revisados contra este spec, siguiendo el flujo de inspección de impeccable. Detector de impeccable sobre los archivos de UI. Skill review-animations sobre el código de motion. Lighthouse móvil: LCP < 2,5s, CLS 0, JS de la home < 150KB comprimido. Prueba en un celular real de gama media mirando fps del hero. |

No se hacen tests de snapshot visual automatizados ni tests del shader.

## 8. Fuera de alcance

- Páginas de casos, servicios, nosotros y contacto.
- Formulario de contacto, analytics, CMS.
- Transiciones entre páginas (se diseñan cuando existan más páginas; candidato: View Transitions API).
- Textos definitivos.

## 9. Referencias de criterio

- `~/.claude/skills/impeccable/` — new-work, typeset, animate, overdrive, craft-floor (este último se carga recién al implementar UI).
- `~/.claude/skills/emil-design-eng/`, `animate`, `review-animations` — reglas de motion.
- `public/Flexora idea 1.jpeg` — idea de logo.
