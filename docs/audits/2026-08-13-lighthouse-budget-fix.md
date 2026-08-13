# Lighthouse budget failure on /galeria — diagnosis and fix

**Branch** `scope/v0.3.0` · **Commit at start** `19b756c` · **Date** 2026-08-13

## Method

Reproduced locally with the repo's own emulation (mobile, 412 × 823, DPR 1.75)
against a production build, `/galeria` only, 5 runs per measurement — the CI
failure was a median of 3 and the score is noisy enough that 3 runs on a
developer machine cannot separate a fix from variance.

Every number below is from a Lighthouse run, not from reading the code. The
local machine is noisier than the runner: the same build scored 0.87 to 1.00
across five runs, so **the minimum of five is quoted alongside the median** —
the median says whether it improved, the minimum says whether it will hold.

Legend: ✅ verified · ⚠️ works, with a caveat · ❌ failing

---

## 1. Verdict

> **One hard failure, and it was not caused by the SEO work on this branch.**
>
> `categories:performance` on `/galeria` came in at a median of **0.87** against
> a floor of 0.9. Everything else in the CI output was a `warn` and did not gate.
>
> The cause was the **Google Fonts stylesheet**, a render-blocking request
> measured at **865 ms** against 308 ms for the site's own CSS. Nothing paints
> until it resolves, and on `/galeria` the LCP element is the first gallery
> photograph — which cannot begin downloading until then either.
> `lighthouserc.cjs` had already recorded it as "known and accepted", with
> self-hosting named as the fix.
>
> Two further findings surfaced while fixing it: the gallery tiles were
> downloading **1.8× the pixels they draw** on a phone, and the first attempt at
> the font fix made LCP *worse*.

---

## 2. What was actually slow

| Finding | Evidence |
| --- | --- |
| ❌ Google Fonts stylesheet render-blocking | 865 ms, vs 308 ms for the app's own CSS. Two `preconnect` hints existed to soften it; they cannot remove it. |
| ❌ Gallery tiles oversized | At 412 px / DPR 1.75 a tile is `calc(50vw - 37px)` = 169 CSS px = **295 device px**. Variants existed at 200 and 400, so the browser took the 400 — 1.84× the pixels drawn. This was also the `uses-responsive-images: 0` warning. |
| ⚠️ TBT was 0 in every run | JavaScript was never the bottleneck, so the `unused-javascript` warning — including the ~20 KiB `@bprogress/remix` added to `root.js` — was not worth acting on for this failure. Recorded because it is the obvious suspect and was ruled out by measurement, not by argument. |

---

## 3. Fixes, in the order they were made

### 3.1 Self-host the webfonts

`scripts/fetch-fonts.mjs` (new) downloads the faces into `public/fonts` and
generates `app/fonts.css`, imported by `root.jsx` so Vite bundles it into the
same stylesheet as Tailwind — one same-origin CSS request, no third-party
connection on the critical path.

Only the `latin` and `latin-ext` subsets are kept. Google serves 32 faces across
cyrillic, greek, vietnamese, math and symbol ranges; this site is Polish, English
and German. The `unicode-range` descriptors are preserved, so `latin-ext` is
still fetched only by pages that contain `ą ć ę ł ń ó ś ź ż`.

Consequences beyond the score: the `fonts.googleapis.com` and
`fonts.gstatic.com` exceptions are **gone from the CSP** in `server.js`, and two
`preconnect` hints are gone from every page.

### 3.2 Do *not* preload the fonts — measured, not assumed

The obvious companion change is `<link rel="preload">` on the two Roboto 400
subsets. It was implemented, measured, and reverted:

| | FCP | LCP | median perf |
| --- | --- | --- | --- |
| With font preload | improved | **3309–3777 ms** | 0.89 |
| Without | slightly later | **2188 ms** | 0.96 |

On a throttled mobile connection, 70 KiB of fonts fetched at highest priority
competes with the LCP element — which on `/galeria` is a photograph, not text.
`font-display: swap` already paints text in the fallback immediately, so the
preload bought an earlier font swap at the cost of the metric the budget
measures. The reasoning is recorded in `root.jsx` so it is not "fixed" again.

### 3.3 Add a 300 px image variant

`WIDTHS` in `scripts/generate-gallery-images.mjs` gains `300`, the smallest
candidate that covers the 295 device px a phone tile actually draws.

| | LCP image | 6 tiles | `uses-responsive-images` |
| --- | --- | --- | --- |
| Before | 21.4 KiB (400 px) | ~128 KiB | **0** |
| After | 12.9 KiB (300 px) | 99 KiB | **1** ✅ |

`IMAGE_WIDTHS` in `app/lib/images.js` had to move with it — and the existing
sync test caught the mismatch before anything else did, which is the guard
working exactly as intended.

### 3.4 Stop shipping the same font three times

Naming the local font files after their weight — the obvious approach, and what
§3.1 did first — is wrong for a **variable** font. Google serves *one* file per
subset for Roboto 400, 700 and 900; the three URLs are identical. Saving them as
`roboto-400-latin.woff2`, `roboto-700-latin.woff2` and `roboto-900-latin.woff2`
wrote the same bytes three times and made the browser **download 72 KiB twice**
on a single page view.

Found by noticing that `roboto-400-latin` and `roboto-700-latin` were both
exactly 43 KiB, then confirming with `md5` and against Google's own CSS, which
points all three weights at one URL.

The generator now groups by source URL: one file per unique URL, several
`@font-face` rules pointing at it — the shape Google emits.

| | fonts on `/galeria` | total page |
| --- | --- | --- |
| Duplicated | 164 KiB | 390 KiB |
| Deduplicated | **91 KiB** | **318 KiB** |

---

## 4. Result

`/galeria`, 5 runs, production build, same emulation as CI:

| Build | median | min | LCP range |
| --- | --- | --- | --- |
| Before (as CI ran it) | 0.94 local / **0.87 CI** ❌ | 0.85 | 2418–2793 ms |
| Fonts self-hosted | 0.91 | 0.87 | 1161–3781 ms |
| \+ 300 px variant | 0.96 | 0.88 | 1363–3235 ms |
| \+ fonts deduplicated | **0.98** ✅ | **0.92** | 1520–2783 ms |

The number that matters is the **minimum: 0.92**. The worst of five runs on a
noisy machine now clears the 0.9 floor, where before the *median* did not.

---

## 5. What this leaves

| Item | State |
| --- | --- |
| `uses-responsive-images` | ✅ Now 1. Was the audit that named the original 9.57 MiB finding; it is finally clean rather than warned. |
| `render-blocking-resources` | ⚠️ Still warns: the app's own stylesheet blocks, which is what a stylesheet does. The third-party half is gone. |
| `uses-long-cache-ttl` | ⚠️ Improved for fonts (`/fonts` now `immutable, 1y` alongside `/assets`). Gallery images stay at 1 h — their URLs are stable across content changes, so a long TTL would serve a stale photograph. |
| `unused-javascript` | ⚠️ Unchanged, and deliberately so. TBT is 0; this is not costing anything measurable. |
| `total-byte-weight` | ✅ 318 KiB against a 500 KB ceiling. |

**New guard:** `test/fonts.spec.js`. The duplicate-font bug was invisible — the
page rendered perfectly and only the byte count was wrong — so it is now a test:
no two font files may share a hash, every `@font-face` must resolve to a file on
disk, every rule needs `font-display: swap` and a `unicode-range`, and the total
has a ceiling.

**Unrelated, found while running this:** `@lhci/utils` was missing from the local
`node_modules`, so `lhci autorun` failed with `MODULE_NOT_FOUND` while
`lhci collect` worked. Repaired with `pnpm install --frozen-lockfile`; the
lockfile already listed it, so this was a broken local install and not a
dependency change. CI installs cleanly and was never affected.
