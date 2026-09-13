# PR #1 Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the 5 issues found by `/code-review [high]` on PR #1 (`feature/home`) before merge.

**Architecture:** Five independent tasks, each touching its own file(s), each with its own commit. No shared state between tasks except Task 4 (HeroScrollProvider), which is the only multi-file change.

**Tech Stack:** Next.js App Router, React, TypeScript, `motion/react` (Motion for React), Vitest + `@testing-library/react` (jsdom environment), plain CSS (BEM-style, no Tailwind).

**Spec:** `docs/superpowers/specs/2026-09-13-pr1-review-fixes-design.md`

## Global Constraints

- Test runner is Vitest: run a single file with `npx vitest run <path>`.
- CSS follows BEM-style scoped classes with CSS variables (e.g. `--fg-muted`), not Tailwind utility classes. New rules go in `app/globals.css` under the relevant `/* ---------- Section ---------- */` comment block.
- `.label` (mono, uppercase, tracked) is reserved for short labels/metadata, never full sentences.
- `.DS_Store` is already covered by the repo-root `.gitignore` (line 24) — do not add another `.gitignore` entry for it.
- Each task ends with its own `git commit` — do not batch unrelated tasks into one commit.

---

### Task 1: `lib/whatsapp.ts` — regression test for the empty-env-var fallback

The fallback chain was already changed from `??` to `||` earlier in this session (uncommitted). This task adds the regression test that proves the bug is fixed and commits the fix together with its test.

**Files:**
- Modify: `lib/whatsapp.ts` (already changed, verify it matches below)
- Test: `__tests__/lib/whatsapp.test.ts`

**Interfaces:**
- Consumes: `whatsappHref(text: string, number?: string): string` (existing signature, unchanged)
- Produces: nothing new consumed by later tasks

- [ ] **Step 1: Verify the current state of `lib/whatsapp.ts`**

Read the file and confirm line 4 reads exactly:

```ts
const raw = number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_NUMBER;
```

If it still reads `number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_NUMBER`, make this exact edit before continuing.

- [ ] **Step 2: Add the regression test**

Add this test to `__tests__/lib/whatsapp.test.ts`, inside the existing `describe("whatsappHref", ...)` block, after the existing two `it(...)` calls:

```ts
  it("cae al número por defecto si la env var está definida pero vacía", () => {
    const prev = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "";
    try {
      expect(whatsappHref("hi")).toMatch(/^https:\/\/wa\.me\/\d+\?text=hi$/);
    } finally {
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = prev;
    }
  });
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run __tests__/lib/whatsapp.test.ts`
Expected: all 3 tests in the file PASS (the fallback fix already exists, so this confirms it rather than catching a regression live — that's expected here, not a bug in the process).

- [ ] **Step 4: Commit**

```bash
git add lib/whatsapp.ts __tests__/lib/whatsapp.test.ts
git commit -m "fix: whatsappHref no ignora un env var vacío en el fallback"
```

---

### Task 2: `WorkCard.tsx` — reemplazar `.label` por `.work-card__desc`

**Files:**
- Modify: `app/globals.css` (add rule under `/* ---------- Work ---------- */`)
- Modify: `components/site/WorkCard.tsx:30`
- Test: `__tests__/components/WorkCard.test.tsx`

**Interfaces:**
- Consumes: `WorkItem.description[locale]` (existing, from `@/content/work`, unchanged)
- Produces: CSS class `.work-card__desc` — no other task depends on this name

- [ ] **Step 1: Write the failing test**

Add this test to `__tests__/components/WorkCard.test.tsx`, inside the existing `describe("WorkCard", ...)` block:

```ts
  it("la descripción no usa la clase .label (reservada a rótulos cortos)", () => {
    render(<WorkCard item={item} locale="es" viewCase="Ver sitio" />);
    const desc = screen.getByText(item.description.es);
    expect(desc.className).not.toContain("label");
    expect(desc.className).toContain("work-card__desc");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx`
Expected: FAIL — `desc.className` is `"label"`, so `not.toContain("label")` fails.

- [ ] **Step 3: Add the CSS rule**

In `app/globals.css`, find the `/* ---------- Work ---------- */` comment block (added by the Work-section real-projects change) and add:

```css
.work-card__desc {
  color: var(--fg-muted);
}
```

- [ ] **Step 4: Update `WorkCard.tsx`**

In `components/site/WorkCard.tsx`, line 30, change:

```tsx
        <p className="label">{item.description[locale]}</p>
```

to:

```tsx
        <p className="work-card__desc">{item.description[locale]}</p>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/components/WorkCard.test.tsx`
Expected: all tests in the file PASS.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css components/site/WorkCard.tsx __tests__/components/WorkCard.test.tsx
git commit -m "fix: WorkCard ya no usa .label (mono/uppercase) para oraciones completas"
```

---

### Task 3: trackear `content/clients.ts` y su test

Not a code change — `content/clients.ts` and its test already exist on disk (untracked by git) and `app/[lang]/page.tsx` already imports from `content/clients.ts`. This task only fixes git tracking so the import can't silently go missing from a future commit.

**Files:**
- Track (no content change): `content/clients.ts`
- Track (no content change): `__tests__/content/clients.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Confirm both files are untracked**

Run: `git status --porcelain content/clients.ts __tests__/content/clients.test.ts`
Expected output (both lines start with `??`):
```
?? content/clients.ts
?? __tests__/content/clients.test.ts
```

- [ ] **Step 2: Run the existing test to confirm it currently passes**

Run: `npx vitest run __tests__/content/clients.test.ts`
Expected: PASS (the file works today, it's just not tracked by git).

- [ ] **Step 3: Stage and commit**

```bash
git add content/clients.ts __tests__/content/clients.test.ts
git commit -m "fix: trackear content/clients.ts, del que ya depende page.tsx"
```

- [ ] **Step 4: Verify**

Run: `git status --porcelain content/clients.ts __tests__/content/clients.test.ts`
Expected: no output (both files are now clean/tracked, nothing pending).

---

### Task 4: unificar `useScroll` de `Header.tsx` y `HeroProgress.tsx` en `HeroScrollProvider`

**Files:**
- Create: `components/site/HeroScrollProvider.tsx`
- Modify: `app/[lang]/layout.tsx`
- Modify: `components/site/Header.tsx`
- Modify: `components/site/HeroProgress.tsx`
- Modify (keep passing, no new test): `__tests__/components/Header.test.tsx`

**Interfaces:**
- Produces: `HeroScrollProvider({ heroId?: string, children: ReactNode })` (component) and `useHeroScrollProgress(): { scrollYProgress: MotionValue<number> }` (hook), both exported from `components/site/HeroScrollProvider.tsx`
- Consumes (in `Header.tsx` and `HeroProgress.tsx`): `useHeroScrollProgress` from `./HeroScrollProvider`

- [ ] **Step 1: Create `HeroScrollProvider.tsx`**

Create `components/site/HeroScrollProvider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";

type HeroScrollContextValue = { scrollYProgress: MotionValue<number> };

const HeroScrollContext = createContext<HeroScrollContextValue | null>(null);

export function HeroScrollProvider({
  heroId = "hero",
  children,
}: {
  heroId?: string;
  children: ReactNode;
}) {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    heroRef.current = document.getElementById(heroId);
  }, [heroId]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });

  return <HeroScrollContext.Provider value={{ scrollYProgress }}>{children}</HeroScrollContext.Provider>;
}

export function useHeroScrollProgress() {
  const ctx = useContext(HeroScrollContext);
  if (!ctx) throw new Error("useHeroScrollProgress must be used within HeroScrollProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap `Header` + `{children}` in `app/[lang]/layout.tsx`**

In `app/[lang]/layout.tsx`, add the import:

```tsx
import { HeroScrollProvider } from "@/components/site/HeroScrollProvider";
```

Change the `<body>` contents from:

```tsx
      <body className="min-h-dvh flex flex-col">
        <Header
          locale={locale}
          labels={{ nav: dict.nav, theme: dict.theme, lang: dict.lang }}
          whatsappHref={whatsappHref(dict.hero.whatsappMessage)}
        />
        {children}
        <Footer t={dict.footer} locale={locale} />
      </body>
```

to:

```tsx
      <body className="min-h-dvh flex flex-col">
        <HeroScrollProvider>
          <Header
            locale={locale}
            labels={{ nav: dict.nav, theme: dict.theme, lang: dict.lang }}
            whatsappHref={whatsappHref(dict.hero.whatsappMessage)}
          />
          {children}
        </HeroScrollProvider>
        <Footer t={dict.footer} locale={locale} />
      </body>
```

(`Footer` stays outside the provider — it doesn't consume hero scroll progress.)

- [ ] **Step 3: Update `Header.tsx` to consume the shared context**

In `components/site/Header.tsx`:

Change the import line:
```tsx
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
```
to:
```tsx
import { useMotionValueEvent, useReducedMotion } from "motion/react";
```

Add this import:
```tsx
import { useHeroScrollProgress } from "./HeroScrollProvider";
```

Change:
```tsx
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });
```
to:
```tsx
  const { scrollYProgress } = useHeroScrollProgress();
```

Leave everything else in the file unchanged (the `heroRef`/`trackHeroRef` DOM-query effect and the `useMotionValueEvent` call stay exactly as they are — `heroRef` is still needed there to detect whether a `#hero` element exists on the page, independent of the shared scroll context).

- [ ] **Step 4: Update `HeroProgress.tsx` to consume the shared context**

In `components/site/HeroProgress.tsx`:

Change the import line:
```tsx
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
```
to:
```tsx
import { useMotionValueEvent, useReducedMotion } from "motion/react";
```

Add this import:
```tsx
import { useHeroScrollProgress } from "./HeroScrollProvider";
```

Remove the now-unused `heroRef` declaration and its assignment:
```tsx
  const heroRef = useRef<HTMLElement | null>(null);
```
and inside the `useEffect`:
```tsx
    heroRef.current = document.getElementById(heroId);
```
(the rest of that `useEffect` — the `measure()` function, `ResizeObserver`, `document.fonts?.ready.then(measure)` — stays unchanged; `heroId` is still a prop even though it's no longer used for the scroll target here, since `measure()` doesn't use it directly either — leave the prop and its default as-is for API stability).

Change:
```tsx
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });
```
to:
```tsx
  const { scrollYProgress } = useHeroScrollProgress();
```

After this change, `useRef` may still be used elsewhere in the file — check: if `useRef` is no longer referenced anywhere in `HeroProgress.tsx`, remove it from the `import { useEffect, useRef } from "react";` line (it becomes `import { useEffect } from "react";`).

- [ ] **Step 5: Update `Header.test.tsx` to wrap renders in the provider**

In `__tests__/components/Header.test.tsx`, add the import:
```tsx
import { HeroScrollProvider } from "@/components/site/HeroScrollProvider";
```

Change both `render(<Header ... />)` calls to wrap `Header` in `HeroScrollProvider`, e.g.:
```tsx
render(
  <HeroScrollProvider>
    <Header locale="es" labels={labels} whatsappHref="https://wa.me/1?text=hola" />
  </HeroScrollProvider>,
);
```
(apply the same wrapping to the second `render(<Header locale="es" labels={labels} whatsappHref="#" />)` call in the file.)

- [ ] **Step 6: Run the affected tests**

Run: `npx vitest run __tests__/components/Header.test.tsx`
Expected: both tests PASS.

- [ ] **Step 7: Run the full test suite to catch any other regression**

Run: `npx vitest run`
Expected: all tests PASS (no other file renders `Header` or `HeroProgress` per the codebase search done during planning, but this confirms it).

- [ ] **Step 8: Commit**

```bash
git add components/site/HeroScrollProvider.tsx app/\[lang\]/layout.tsx components/site/Header.tsx components/site/HeroProgress.tsx __tests__/components/Header.test.tsx
git commit -m "refactor: Header y HeroProgress comparten un único useScroll vía HeroScrollProvider"
```

---

### Task 5: limpiar `public/ideas/`

**Files:**
- Delete: `public/ideas/.DS_Store`
- Delete: `public/ideas/WhatsApp Image 2026-09-08 at 18.10.58.jpeg`
- Delete: `public/ideas/Extracción de logo en vector.zip`
- Move: `public/ideas/assets/` → `design/brand-assets/`

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Delete the 3 personal/working files**

```bash
rm "public/ideas/.DS_Store" "public/ideas/WhatsApp Image 2026-09-08 at 18.10.58.jpeg" "public/ideas/Extracción de logo en vector.zip"
```

- [ ] **Step 2: Move the brand assets out of `public/`**

```bash
mkdir -p design/brand-assets
mv public/ideas/assets/* design/brand-assets/
```

- [ ] **Step 3: Remove the now-empty `public/ideas/` directory**

```bash
rmdir public/ideas/assets public/ideas
```

- [ ] **Step 4: Verify nothing untracked remains under `public/ideas`**

Run: `git status --porcelain public/`
Expected: no output referencing `public/ideas` (the directory no longer exists; `public/` may still show other pre-existing untracked/modified entries unrelated to this task — only confirm `ideas` is gone).

- [ ] **Step 5: Confirm the moved assets are visible under their new path**

Run: `ls design/brand-assets/`
Expected: the same files that were in `public/ideas/assets/` (svg files + `png/` subfolder + `LEEME.txt`), now here.

No commit needed for the deleted files — they were untracked, so `rm` leaves no git diff. The moved `design/brand-assets/` files are new and untracked (git doesn't track a "move" across an untracked path); stage and commit them as new files:

```bash
git add design/brand-assets/
git commit -m "chore: mover assets de marca fuera de public/ideas a design/brand-assets/"
```

---

## Self-Review Notes

- **Spec coverage:** all 5 spec sections map 1:1 to Tasks 1–5, including the mid-planning addition of `public/ideas/assets/` (now Task 5, steps 2–3 and the closing commit).
- **Placeholder scan:** no TBDs; every step has literal code/commands.
- **Type consistency:** `useHeroScrollProgress()` returns `{ scrollYProgress: MotionValue<number> }` in Task 4 Step 1, and both consumers (Steps 3–4) destructure exactly that shape.
