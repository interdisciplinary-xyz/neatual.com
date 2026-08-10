---
name: neatual-copy
description: Use when writing, rewriting or translating any user-facing copy on neatual.com — homepage text, page headings, meta titles and descriptions, navigation labels, CTA labels, product/collection names, alt text or screen-reader labels. Also use when the user says "update the homepage copy", "rewrite the Polish", "translate to German", "new meta description", or is repositioning what the company says it does. Covers all three locales (pl/en/de) and the two places copy lives.
allowed-tools: Read, Grep, Glob, Bash
---

# Neatual copy

Neatual is a Polish company. It **hangs wallpaper** — murals, patterned and
textured wall coverings, installed on site for homes and commercial interiors.

> ⚠️ It used to make uniforms, and much of the site still says so. Anything
> mentioning *szwalnia*, *uniformy*, *uniforms*, *Uniformen*, EKOTRADE or the
> Warsaw University of Technology ensemble is leftover from before the pivot.
> Treat it as wrong, not as reference.

## Copy lives in two places and they must agree

| Where | Role |
| --- | --- |
| Sanity (`kyyf7nu9` / `production`) | What the site actually renders |
| `app/lib/locales.js`, `app/lib/inlineCopy.js` | Bundled fallback when Sanity is unreachable |

`app/lib/content.server.js` falls back silently. If the two disagree, the page
renders different words depending on which answered and **nothing fails** — the
site just serves the wrong text some of the time.

**Always finish a copy change by running `pnpm content:check`.** It compares
every field across all three locales and exits non-zero on drift.

## The three locales

`pl` is the source of truth and the `x-default` for hreflang. `en` and `de` are
real translations, not glosses — the German page is read by German speakers, so
a literal rendering of Polish sentence structure reads as machine output.

Every translatable field is `{ pl, en, de }`. A field translated in one locale
and not the others is worse than an untranslated field, because the fallback
chain hides it: `localized()` silently returns Polish.

## Rules that are not style preferences

1. **Never invent specifications.** Materials, dimensions, prices, delivery
   times, certifications and client names must come from the user. The current
   product copy says only what the photographs support — "sized to the wall",
   "photographed at completed installations" — precisely because nothing more is
   known. Made-up specs are a legal and trust problem, not a wording problem.
2. **Alt text describes the photograph**, not the product line. It is read aloud
   and indexed. If the image shows a lotus mural in a shower, that is what it
   says.
3. **Labels with values are templates.** `{name}` and `{n}` placeholders are
   expanded by `fillTemplate()`. Keep the placeholders; translate around them.
4. **Meta titles and descriptions are content**, stored per page per locale.
   Aim ~55 characters for a title and ~150 for a description. They are not
   derived from headings — changing a heading does not change them.
5. **Do not touch error copy in `locales.js`.** The ErrorBoundary renders after
   the loader has failed, so it cannot read CMS data. It is the one thing that
   must stay hardcoded.

## Voice

Plain, concrete, unhurried. A wallpaper fitter describing their own work, not a
brand deck. Short sentences. Specific nouns over adjectives — "lotus mural in a
shower enclosure" beats "stunning bespoke feature wall". No exclamation marks,
no "transform your space", no invented superlatives.

Polish copy should avoid the stiff formal register of translated corporate
English. Address the reader directly where the existing copy does.

## Where to change what

| Content | Field |
| --- | --- |
| Homepage headline | `page-home` → `heading` |
| Homepage teaser (collapsed) | `page-home` → `shortDescription` |
| Homepage body paragraphs | `page-home` → `body` (Portable Text) |
| Browser tab / OG title | `page-*` → `metaTitle` |
| Search snippet | `page-*` → `metaDescription` |
| Nav label | `page-*` → `navLabel` |
| Screen-reader `<h1>` | `page-*` → `srHeading` |
| Phone, email, address | `siteSettings` |
| Collection names, alt | `product-*` |

Fallback equivalents live in `app/lib/locales.js` (page + settings copy) and
`app/lib/inlineCopy.js` (`PRODUCTS`, `PRODUCT_SHARED`, `PAGE_META`,
`HOME_SR_HEADING`, `A11Y_LABELS`).

## Workflow

```bash
pnpm content:pull        # current copy → content.json
# edit content.json
pnpm content:push        # back to Sanity (needs SANITY_WRITE_TOKEN)
# mirror the same words into locales.js / inlineCopy.js
pnpm content:check       # must print ✓ before you are done
pnpm build && pnpm lint
```

If the code is the source of truth for a change, edit `locales.js` /
`inlineCopy.js` and run `pnpm seed:sanity:import` instead — it rewrites Sanity
from the bundled copy. That direction **overwrites Studio edits**, so use it
only when you know nothing was edited there.
