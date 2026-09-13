# Brand visual: reemplazar la X por el FlexMark — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El visual de la disciplina "Branding" (03) en la sección de servicios muestra el `FlexMark` real (la F con gradiente) en vez de la X de dos chevrones que dibujaba a mano.

**Architecture:** `FlexMark` gana dos props opcionales (`classNameTop`, `classNameBottom`) para poder engancharle la transición CSS de reveal ya existente a cada uno de sus dos `<path>`, y un tamaño intrínseco fijo (`width`/`height` iguales al viewBox) para poder incrustarlo sin distorsión dentro de otro SVG. `BrandVisual` deja de dibujar paths a mano y en su lugar renderiza `<FlexMark>` centrado y escalado dentro de su frame de 320×200, reutilizando las clases `svis__chev--a`/`--b` que ya tienen la transición de reveal en `app/globals.css`.

**Tech Stack:** React 19 (Server/Client Components), TypeScript, Vitest + Testing Library, CSS plano (sin Tailwind).

**Spec:** `docs/superpowers/specs/2026-09-13-brand-visual-flexmark-design.md`

## Global Constraints

- No se agrega ninguna regla CSS nueva — se reutilizan `.svis__chev`, `.svis__chev--a`, `.svis__chev--b` (`app/globals.css:680-686`) tal cual existen.
- Los usos existentes de `FlexMark` (Header vía `Logo.tsx`, Hero vía `FlexWordmark.tsx`) no deben cambiar de aspecto visual: las props nuevas son opcionales y sin valor deben producir el mismo DOM que hoy (salvo por los atributos `width`/`height`, que no afectan su render porque esos consumidores ya fijan el tamaño por CSS con `height: <valor>; width: auto;`).
- El label del visual pasa de `X · 01` a `F · 03` (corrige también el índice: la disciplina de Branding es la 03, no la 01).

---

### Task 1: `FlexMark` acepta clases por path y tamaño intrínseco fijo

**Files:**
- Modify: `components/site/FlexMark.tsx`
- Test: `__tests__/components/FlexMark.test.tsx` (nuevo)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `FlexMark(props: { className?: string; classNameTop?: string; classNameBottom?: string })` — sigue exportado como named export `FlexMark` desde `components/site/FlexMark.tsx`. El `<svg>` raíz sigue teniendo `viewBox="0 0 81 110"` y clase `flex-mark`; gana atributos fijos `width="81" height="110"`. El primer `<path>` (la punta superior) recibe `classNameTop`; el segundo `<path>` (el cuerpo inferior) recibe `classNameBottom`.

- [ ] **Step 1: Escribir el test que falla**

Crear `__tests__/components/FlexMark.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FlexMark } from "@/components/site/FlexMark";

describe("FlexMark", () => {
  it("por defecto renderiza dos paths sin clases extra", () => {
    const { container } = render(<FlexMark />);
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute("class")).toBe("");
    expect(paths[1].getAttribute("class")).toBe("");
  });

  it("aplica classNameTop al primer path y classNameBottom al segundo", () => {
    const { container } = render(<FlexMark classNameTop="top" classNameBottom="bottom" />);
    const paths = container.querySelectorAll("path");
    expect(paths[0].getAttribute("class")).toBe("top");
    expect(paths[1].getAttribute("class")).toBe("bottom");
  });

  it("tiene tamaño intrínseco fijo 81x110 además del viewBox", () => {
    const { container } = render(<FlexMark />);
    const svg = container.querySelector("svg.flex-mark");
    expect(svg?.getAttribute("width")).toBe("81");
    expect(svg?.getAttribute("height")).toBe("110");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 81 110");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run __tests__/components/FlexMark.test.tsx`
Expected: FAIL — `classNameTop`/`classNameBottom` no existen como props, y no hay atributos `width`/`height` en el SVG.

- [ ] **Step 3: Implementar**

Reemplazar el contenido completo de `components/site/FlexMark.tsx`:

```tsx
"use client";

import { useId } from "react";

type Props = {
  className?: string;
  classNameTop?: string;
  classNameBottom?: string;
};

export function FlexMark({ className = "", classNameTop = "", classNameBottom = "" }: Props) {
  const gradientId = useId();
  return (
    <svg
      className={`flex-mark ${className}`.trim()}
      viewBox="0 0 81 110"
      width="81"
      height="110"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4878FF" />
          <stop offset=".55" stopColor="#6C4FFA" />
          <stop offset="1" stopColor="#A848EC" />
        </linearGradient>
      </defs>
      <path className={classNameTop} fill={`url(#${gradientId})`} d="M81 0 L66 26 C34 38 6 48 0 56 L0 50 C2 40 8 31 13 26 Z" />
      <path className={classNameBottom} fill={`url(#${gradientId})`} d="M59 40 L42 66 L15 77 C15 88 10 100 1 110 L0 78 C2 68 14 52 51 42 Z" />
    </svg>
  );
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run __tests__/components/FlexMark.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Correr los tests existentes que usan FlexMark para confirmar que no rompimos Header/Hero**

Run: `npx vitest run __tests__/components/FlexWordmark.test.tsx`
Expected: PASS (sin cambios de comportamiento — las props nuevas son opcionales).

- [ ] **Step 6: Commit**

```bash
git add components/site/FlexMark.tsx __tests__/components/FlexMark.test.tsx
git commit -m "feat: FlexMark acepta clases por path y expone tamaño intrínseco"
```

---

### Task 2: `BrandVisual` dibuja el FlexMark en vez de la X

**Files:**
- Modify: `components/site/ServiceVisuals.tsx`
- Test: `__tests__/components/ServiceVisuals.test.tsx` (nuevo)

**Interfaces:**
- Consumes: `FlexMark` de `components/site/FlexMark.tsx` (Task 1) — `<FlexMark classNameTop={...} classNameBottom={...} />`.
- Produces: `BrandVisual()` sigue siendo un named export sin props desde `components/site/ServiceVisuals.tsx`, usado por `Services.tsx` sin cambios en su firma.

- [ ] **Step 1: Escribir el test que falla**

Crear `__tests__/components/ServiceVisuals.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrandVisual } from "@/components/site/ServiceVisuals";

describe("BrandVisual", () => {
  it("renderiza el FlexMark (dos paths con gradiente) en vez de la X", () => {
    const { container } = render(<BrandVisual />);
    expect(container.querySelectorAll("svg.flex-mark")).toHaveLength(1);
    expect(container.querySelectorAll("svg.flex-mark path")).toHaveLength(2);
  });

  it("usa las clases de reveal existentes en cada mitad del logo", () => {
    const { container } = render(<BrandVisual />);
    expect(container.querySelector(".svis__chev--a")).not.toBeNull();
    expect(container.querySelector(".svis__chev--b")).not.toBeNull();
  });

  it("muestra el label F · 03 y ya no la X", () => {
    const { container } = render(<BrandVisual />);
    expect(container.textContent).toContain("F · 03");
    expect(container.textContent).not.toContain("X ·");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run __tests__/components/ServiceVisuals.test.tsx`
Expected: FAIL — hoy `BrandVisual` no renderiza `svg.flex-mark` y el label dice `X · 01`.

- [ ] **Step 3: Implementar**

En `components/site/ServiceVisuals.tsx`, agregar el import y reemplazar `BrandVisual`:

```tsx
import { FlexMark } from "./FlexMark";
```

```tsx
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
```

(El import se agrega junto al resto de imports del archivo; el archivo no tiene imports hoy, así que va como primera línea.)

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run __tests__/components/ServiceVisuals.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Correr toda la suite para confirmar que no se rompió nada más**

Run: `npx vitest run`
Expected: todos los tests en PASS, incluyendo `__tests__/components/Services.test.tsx` (que renderiza `Services`, que a su vez renderiza `BrandVisual` para el ítem 03).

- [ ] **Step 6: Revisión visual manual**

Run: `npm run dev`, abrir la sección de servicios en el navegador, confirmar que la card 03/Branding muestra la F con gradiente animándose al hacer scroll-reveal (cada mitad entra deslizando desde su lado, igual que antes), y que el label dice `F · 03`. Confirmar también que el Header y el Hero (que usan el mismo `FlexMark`) se ven exactamente igual que antes del cambio.

- [ ] **Step 7: Commit**

```bash
git add components/site/ServiceVisuals.tsx __tests__/components/ServiceVisuals.test.tsx
git commit -m "feat: BrandVisual muestra el FlexMark en vez de la X"
```
