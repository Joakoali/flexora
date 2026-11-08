# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Vamos a trabajar siempre con /superpowers:brainstorming y usando driven agent, o sea siempre vamos a ir por partes, no quiero hacer un desarrollo integral de una de nada, podemos cranear algo largo pero siempre vamos a enfocarnos de a un componente y dividimos eso en problemas mas pequeños a resolver.
No asumas nada, pregunta si hay algo que no queda claro, mas que nada porque tiene que ser todo impecable.
Casi siempre la idea es escribir specs usando superpowers y luego derivar a agentes frescos. Obvio depende del alcance del trabajo que se esta planteando.

## Commands

```bash
npm run dev          # http://localhost:3000 (redirects to /es, /en or /ca via proxy.ts)
npm run build
npm run start
npm run lint          # eslint
npm run test          # vitest run (unit + component tests in __tests__/)
npm run test:watch    # vitest watch mode
npm run e2e            # playwright (builds + starts the app first, see playwright.config.ts)
npm run typegen       # next typegen
```

Single test file: `npx vitest run __tests__/lib/theme.test.ts`. Single Playwright spec: `npx playwright test e2e/theme.spec.ts`.

Copy `.env.example` to `.env.local` before running dev/build. Variables the code reads:

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `lib/whatsapp.ts` | Digits only, international format. Empty falls back to a default number. |
| `NEXT_PUBLIC_SITE_URL` | `app/[lang]/layout.tsx` (`metadataBase`) | Invalid/missing falls back to `http://localhost:3000`. |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | contact action, `lib/resend.ts` | Server-only. If any is missing the form fails closed with `send_failed` (WhatsApp link) and logs to the server console. With `onboarding@resend.dev` as sender, Resend only delivers to the account owner's inbox. |
| `CONTACT_DRY_RUN` | `lib/resend.ts` | `1` = respond success without calling Resend (e2e only, never in production); it also waives the `RESEND_API_KEY` requirement. Ignored (and logged) when `VERCEL_ENV` is `production`. |
| `VERCEL_ENV` | `lib/resend.ts` | Set by Vercel, not by hand. Read only to ignore `CONTACT_DRY_RUN` in production. |
| `BASE_URL` | `scripts/capture-og.mjs`, `scripts/capture-field.mjs` | Optional, defaults to `http://localhost:3000`. |

## Architecture

Single-page trilingual (es/en/ca) marketing site (Next.js 16 App Router). Read `AGENTS.md` before touching routing/config — this Next.js version has renamed and changed conventions from what training data expects (e.g. `proxy.ts`, not `middleware.ts`).

**i18n**: three locales, `es` (default), `en` and `ca`; all routes live under `app/[lang]/`. `proxy.ts` (root) redirects any path without a locale prefix (e.g. `/`) to `/es`, `/en` or `/ca`: it resolves `Accept-Language` with `matchLocale` in `lib/i18n.ts` (Negotiator + `@formatjs/intl-localematcher`; regional variants such as `ca-ES` map to `ca`, a missing header or unsupported languages fall back to `es`). `lib/i18n.ts` also holds the locale list, `localeShortLabel` (URLs/hreflang use the ISO code, but the visible switcher label for `ca` is `CAT`) and the path-switching helper. Copy lives entirely in `app/[lang]/dictionaries/{es,en,ca}.json`, loaded via `app/[lang]/dictionaries.ts`. `__tests__/i18n/dictionaries-parity.test.ts` enforces that all three dictionaries have identical key paths and no empty strings — keep them in sync when editing any of them.

**Page composition**: `app/[lang]/page.tsx` assembles page sections from `components/site/` in order (Hero, Marquee, Services, Work, Process, Closing). `content/clients.ts` and `content/work.ts` hold structured content data kept separate from components. Around it, `app/[lang]/layout.tsx` renders `Header` (which mounts `MobileMenu`, the hamburger panel below 900 px, only while open), `Footer` and `WhatsAppFab` (floating WhatsApp button); `Hero` includes `HeroShowcase`.

**Contact form** (inside `Closing`, `#contact`): `components/site/ContactForm.tsx` (client, `useActionState`) calls the server action `app/[lang]/actions/contact.ts`, which runs honeypot (`website` filled → fake success, nothing sent) → field validation → time-gate (`startedAt` < 2 s → error `too_fast`, typed values kept) → send. Pure logic lives in `lib/contact.ts` (`validateContact`, `isHoneypotFilled`, `isTooFast`, `buildEmail`; message line breaks are normalized to `\n` before the 2000-char limit) and the Resend REST call in `lib/resend.ts`. It must keep working without JS: don't wrap `contactAction` in a plain function — `submitContact` (try/catch wrapper) is only swapped in after hydration via `useSyncExternalStore`, because a plain wrapper loses `$$FORM_ACTION` and React stops emitting the hidden fields of the server action. Spec: `docs/superpowers/specs/2026-09-29-contact-form-design.md`.

**No-JS / scroll**: `Reveal` content starts at `opacity: 0` and only JS sets `data-visible`; `@media (scripting: none)` in `app/globals.css` shows it in its final place (does not cover a failed hydration with JS enabled). `html` declares `scroll-padding-top/bottom` so focused elements are not hidden behind the fixed header or the WhatsApp button (WCAG 2.4.11); `section[id]` cancels the top part with a negative `scroll-margin-top` so nav anchors still land flush.

**Component layers**:
- `components/site/` — page sections and layout chrome (Header, Footer, Hero, etc.), most locale/content-aware.
- `components/ui/` — generic presentational primitives (Button, Label, LangSwitch, ThemeSwitch, TextLink).
- `components/gl/` — WebGL background (`FlexField` + `flex-field.shaders.ts`, via `ogl`), gated by `lib/gl.ts` capability checks (`canUseWebGL`, `prefersReducedMotion`, `isCoarsePointer`, `clampDpr`).

**Shared scroll state**: `HeroScrollProvider` (in `components/site/`) wraps the app in `layout.tsx` and exposes a single `useScroll` so `Header` and `HeroProgress` don't each attach their own scroll listener.

**Motion tokens**: `lib/motion.ts` is the single source of truth for easing curves, durations, and springs — the same values are mirrored as CSS variables in `:root` of `app/globals.css`. Exports: `EASE_OUT`, `EASE_IN_OUT`, `EASE_LOOP` (the CSS `ease-in-out` keyword written explicitly, for long ambient loops), `DURATION`, `SHOWCASE`, `SPRING_BASE`, `SPRING_FOLLOW`, `REVEAL` (the shared "fade + rise" gesture), `MENU`, `FAB`. Don't invent new durations/curves in a component; add/reuse a token instead. `__tests__/design/tokens.test.ts` enforces it: a TS↔CSS parity test (every constant must be mirrored in `:root` with the exact value derived from it) and a guard that fails on literal durations/delays/easings (`300ms`, `ease`, `linear`, `cubic-bezier()`, `steps()`) in any `animation*`/`transition*` declaration of `globals.css`. The guard is a regex over the CSS, with an allowlist: `MOTION_EXCEPTIONS` (permanent, legitimate literals) and `MOTION_DEBT` (pre-existing debt; an entry that no longer matches must be deleted). For zero duration use `transition: none`. The hero copy (`.hero__copy > *`) enters with the CSS-only `rise-in` animation and `animation-fill-mode: backwards` on purpose — see the comment in `globals.css` and `docs/superpowers/specs/2026-11-08-pr4-review-fixes.md`.

**Theme**: dark/light stored under `dataset.theme` on `<html>`, persisted to `localStorage` (`lib/theme.ts`). `THEME_INIT_SCRIPT` is injected inline in `<head>` (in `app/[lang]/layout.tsx`) to set the theme before first paint — it deliberately duplicates `resolveTheme`'s logic without imports, so keep both in sync if the resolution logic changes.

**WhatsApp CTA**: `lib/whatsapp.ts` builds `wa.me` links from `NEXT_PUBLIC_WHATSAPP_NUMBER`, used across Hero/Closing/Header CTAs.

## Testing

- `__tests__/` mirrors source by domain (`actions/`, `components/`, `content/`, `design/`, `i18n/`, `lib/`) and runs on Vitest + Testing Library + jsdom (`vitest.config.mts`, `vitest.setup.ts`).
- `e2e/` (Playwright, two projects: `desktop` = Desktop Chrome and `mobile` = Pixel 7) covers real-browser flows: `home.spec.ts`, `theme.spec.ts`, `degradation.spec.ts` (no-WebGL/reduced-motion fallbacks and the no-JS cases: hero and `Reveal` sections), `contact.spec.ts` (contact form in es/en/ca, including without JS, a rejected action, the live region and focus not hidden by the header/FAB), `a11y.spec.ts` (via `@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag22aa` — the last one includes `target-size` — on `/es`, `/en` and `/ca`; it scans once on load). `e2e/helpers.ts` exports `effectiveOpacity` (an element's opacity times its ancestors'): use it instead of `toBeVisible()`, which ignores opacity. Some tests are skipped on one of the two projects by design (e.g. the header CTA lives in the menu panel on mobile).
- The Playwright config builds and starts the app itself (`npm run build && npm run start`) with `CONTACT_DRY_RUN=1`, `CONTACT_TO_EMAIL=e2e@example.com` and `CONTACT_FROM_EMAIL=Flexora <onboarding@resend.dev>`, so the contact e2e never sends mail (`lib/resend.ts`: dry run returns `{ ok: true }` before calling `fetch`). Those env vars apply only to a server Playwright spawns itself, so don't run the e2e with another server already listening on :3000: a `dev`/`start` with real Resend credentials in `.env.local` would have `contact.spec.ts` send real mail.
- `scripts/capture-*.mjs` are standalone Playwright scripts (not part of the test suites) for generating artifacts: `capture-og.mjs` renders `public/og-{es,en,ca}.png` (1200×630 of each locale's hero), `capture-field.mjs` and `capture-review.mjs` capture screenshots of the WebGL field / full page per theme for design review.

## Docs & design artifacts

- `docs/superpowers/specs/` and `docs/superpowers/plans/` hold the spec-driven-development artifacts (per the workflow above) for each piece of work — check these before starting related work. `specs/2026-11-08-pr4-review-fixes.md` records the PR #4 review round: technical decisions not to undo without knowing why, and known follow-ups.
- `design/` holds visual design canvases (`*.dc.html`, Claude Design artifacts), `design/brand-assets/` (logo/lockup SVGs and PNGs) and `design/references/` (moodboard images). Everything under `public/` is served: keep reference or personal files in `design/`, not in `public/`.
