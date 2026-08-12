# First-visit splash loader — design

Date: 2026-08-11 · Branch: `scope/v0.1.0` · Base commit: `e4a5e64`

A full-screen splash showing the Neatual mark and wordmark, once per browser
session, dismissing itself after 1.4s.

## Decisions

| Decision | Choice | Why the alternative lost |
| --- | --- | --- |
| Trigger | First visit per session | Every-load replays on refresh and on each hard navigation across a 3-page site. Homepage-only leaves the brand moment off the two pages people link to. |
| Content | Mark above wordmark, fade + 8px drift | A draw-on stroke animation needs ~600ms on screen before it reads, which is time spent on decoration. Mark-only loses the wordmark that the header already shows on home. |
| Dismissal | Fixed 1.4s, pure CSS | Waiting on hydration puts JavaScript in the dismissal path, so a script error strands a visitor under an opaque sheet. Waiting on fonts additionally couples the splash to the Google Fonts request that `lighthouserc.cjs` already flags as render-blocking. |

## Mechanism

Three pieces. Only the first involves JavaScript, and it is not load-bearing.

1. **Inline blocking script in `<head>`** (`app/root.jsx`). Reads
   `sessionStorage['neatual:splash']`; if present, sets `data-splash="seen"` on
   `<html>`, otherwise writes the key. Runs before body paint, so a
   returning-in-session visitor never sees a frame of splash.

   A data attribute, not a class: React owns `<html className>`, and appending
   to it risks a re-render resetting it. React never declares `data-splash`, so
   it is left alone — and there is no hydration mismatch.

   Wrapped in `try/catch` because Safari in Lockdown/private mode throws on
   `sessionStorage` access rather than returning `null`. If it throws, the
   splash simply shows again; nothing breaks.

2. **Server-rendered overlay** (`app/components/SplashScreen.jsx`), first child
   of `<body>`. Real markup rather than an effect-mounted node — a JS-injected
   overlay appears *after* the page it is meant to cover, which reads as a flash
   of content followed by a grey sheet.

3. **Pure-CSS exit** (`app/tailwind.css`). One keyframe timeline with
   `animation-fill-mode: both`, ending in `visibility: hidden` so the layer
   stops being rendered rather than lingering as a transparent full-screen div
   over every page for the rest of the session.

### Timeline (1400ms)

| Time | Event |
| --- | --- |
| 0–400ms | Mark fades in, drifts up 8px |
| 120–520ms | Wordmark, same motion, offset |
| 520–1050ms | Hold |
| 1050–1400ms | Overlay fades out |
| 1400ms | `visibility: hidden` |

### Full-screen

`position: fixed; inset: 0` at `z-50`. The `z-50` is the load-bearing part:
`Header` and `Footer` are both `fixed z-10`, so anything at or below that leaves
the two bars sitting on top of the splash.

The overlay background is the same `#EDEDED` as `html`, which makes mobile
fixed-element viewport quirks moot — where `inset: 0` resolves to the large
viewport and the URL bar uncovers a strip, the strip is already that colour.

## Accessibility

- `aria-hidden="true"` — decorative. The real page is already in the
  accessibility tree behind it, so screen-reader users are never gated on the
  animation.
- No focusable children. `aria-hidden` on a container holding something tabbable
  is both an axe violation (`aria-hidden-focus`) and a real trap. Asserted in
  `SplashScreen.spec.jsx`.
- `pointer-events: none` from frame one, so a visitor who knows where they are
  going clicks through to the nav rather than losing 1.4s of taps.
- The skip link stays at `z-index: 999`, above the splash, so tabbing during the
  animation still shows a visible focus target.
- `prefers-reduced-motion: reduce` drops the transform and keeps an opacity-only
  fade. The request is for less motion, not for a different site.

## No-JS, crawlers, SPA navigation

The head script never runs without JS, the attribute is never set, and the CSS
still self-dismisses. Content is server-rendered throughout and merely covered.

On Remix client-side navigation the splash stays mounted but its animation has
already completed and CSS animations do not restart, so it never replays.

## Measurement

The reason this needed measuring rather than reasoning: Lighthouse starts each
run with empty `sessionStorage`, so the splash is in the measured path on all
3 URLs × 3 runs. Chrome's LCP ignores zero-opacity elements but does **not** do
occlusion detection, and it was not obvious in advance which way that cut.

`pnpm test:performance` on this build, median of 3:

| URL | Perf | A11y | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 0.98 | 1 | 1 | 1816ms | 0 |
| `/galeria` | 0.98 | 1 | 1 | 1961ms | 0 |
| `/kontakt` | 0.98 | 1 | 1 | 1809ms | ~0.0002 |

Unchanged from the pre-splash baseline documented in `lighthouserc.cjs`
(1.8–2.2s LCP, 98 perf). **The LCP element on `/` is the hero
`<p class="text-16 text-content mb-6">`, not the splash** — the content behind
the overlay registers its paint at the normal time, so the splash costs nothing
against the 3.5s budget.

This is what makes the 1.4s duration affordable. If it is ever lengthened
further, re-run the gate rather than assuming the result carries over.

## Files

| File | Change |
| --- | --- |
| `app/components/SplashScreen.jsx` | New — the overlay markup |
| `app/components/SplashScreen.spec.jsx` | New — 4 tests |
| `app/root.jsx` | Inline head script, mount as first child of `<body>` |
| `app/tailwind.css` | `.splash` rules and three keyframe sets |

## Not doing

- No spinner or progress indicator. There is nothing to report progress on — the
  page is server-rendered and already present behind the overlay.
- No per-route variants. One splash, one timeline.
- No "skip" control. It is 1.4s and already click-through.
