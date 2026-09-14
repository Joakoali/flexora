# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Vamos a trabajar siempre con /superpowers:brainstorming y usando driven agent, o sea siempre vamos a ir por partes, no quiero hacer un desarrollo integral de una de nada, podemos cranear algo largo pero siempre vamos a enfocarnos de a un componente y dividimos eso en problemas mas pequeños a resolver.
No asumas nada, pregunta si hay algo que no queda claro, mas que nada porque tiene que ser todo impecable.
Casi siempre la idea es escribir specs usando superpowers y luego derivar a agentes frescos. Obvio depende del alcance del trabajo que se esta planteando.

## Commands

```bash
npm run dev          # http://localhost:3000 (redirects to /es or /en via proxy.ts)
npm run build
npm run start
npm run lint          # eslint
npm run test          # vitest run (unit + component tests in __tests__/)
npm run test:watch    # vitest watch mode
npm run e2e            # playwright (builds + starts the app first, see playwright.config.ts)
npm run typegen       # next typegen
```

Single test file: `npx vitest run __tests__/lib/theme.test.ts`. Single Playwright spec: `npx playwright test e2e/theme.spec.ts`.

Copy `.env.example` to `.env.local` before running dev/build — sets `NEXT_PUBLIC_WHATSAPP_NUMBER` and `NEXT_PUBLIC_SITE_URL`.

## Architecture

Single-page bilingual marketing site (Next.js 16 App Router). Read `AGENTS.md` before touching routing/config — this Next.js version has renamed and changed conventions from what training data expects (e.g. `proxy.ts`, not `middleware.ts`).

**i18n**: all routes live under `app/[lang]/`. `proxy.ts` (root) redirects `/` to `/es` or `/en` based on `Accept-Language`, using `lib/i18n.ts` (locale list, matcher, path-switching helper). Copy lives entirely in `app/[lang]/dictionaries/{es,en}.json`, loaded via `app/[lang]/dictionaries.ts`. `__tests__/i18n/dictionaries-parity.test.ts` enforces that both dictionaries have identical key paths and no empty strings — keep them in sync when editing either file.

**Page composition**: `app/[lang]/page.tsx` assembles page sections from `components/site/` in order (Hero, Marquee, Services, Work, Process, Closing). `content/clients.ts` and `content/work.ts` hold structured content data kept separate from components.

**Component layers**:
- `components/site/` — page sections and layout chrome (Header, Footer, Hero, etc.), most locale/content-aware.
- `components/ui/` — generic presentational primitives (Button, Label, LangSwitch, ThemeSwitch, TextLink).
- `components/gl/` — WebGL background (`FlexField` + `flex-field.shaders.ts`, via `ogl`), gated by `lib/gl.ts` capability checks (`canUseWebGL`, `prefersReducedMotion`, `isCoarsePointer`, `clampDpr`).

**Shared scroll state**: `HeroScrollProvider` (in `components/site/`) wraps the app in `layout.tsx` and exposes a single `useScroll` so `Header` and `HeroProgress` don't each attach their own scroll listener.

**Motion tokens**: `lib/motion.ts` is the single source of truth for easing curves, durations, and springs — the same values are mirrored as CSS variables in `app/globals.css`. Don't invent new durations/curves in a component; add/reuse a token instead.

**Theme**: dark/light stored under `dataset.theme` on `<html>`, persisted to `localStorage` (`lib/theme.ts`). `THEME_INIT_SCRIPT` is injected inline in `<head>` (in `app/[lang]/layout.tsx`) to set the theme before first paint — it deliberately duplicates `resolveTheme`'s logic without imports, so keep both in sync if the resolution logic changes.

**WhatsApp CTA**: `lib/whatsapp.ts` builds `wa.me` links from `NEXT_PUBLIC_WHATSAPP_NUMBER`, used across Hero/Closing/Header CTAs.

## Testing

- `__tests__/` mirrors source by domain (`components/`, `content/`, `design/`, `i18n/`, `lib/`) and runs on Vitest + Testing Library + jsdom (`vitest.config.mts`, `vitest.setup.ts`).
- `e2e/` (Playwright) covers real-browser flows: `home.spec.ts`, `theme.spec.ts`, `degradation.spec.ts` (no-WebGL/reduced-motion fallbacks), `a11y.spec.ts` (via `@axe-core/playwright`). The Playwright config builds and starts the app itself before running.
- `scripts/capture-*.mjs` are standalone Playwright scripts (not part of the test suites) for generating artifacts: `capture-og.mjs` renders `public/og-{es,en}.png`, `capture-field.mjs` and `capture-review.mjs` capture screenshots of the WebGL field / full page per theme for design review.

## Docs & design artifacts

- `docs/superpowers/specs/` and `docs/superpowers/plans/` hold the spec-driven-development artifacts (per the workflow above) for each piece of work — check these before starting related work.
- `design/` holds visual design canvases (`*.dc.html`, Claude Design artifacts) and `design/brand-assets/` (logo/lockup SVGs and PNGs).
