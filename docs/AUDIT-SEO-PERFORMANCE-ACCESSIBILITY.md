# SEO, Performance & Accessibility Audit

**Project:** neatual.com
**Audited:** 10 August 2026, on `scope/v0.1.0` (`a15d00d`)
**Method:** `pnpm build` → `NODE_ENV=production node ./server.js` on a free port →
rendered HTML from all 9 sitemap URLs plus `/sitemap.xml`, `/robots.txt` and a
deliberate 404; Lighthouse 12.8.2 (mobile, simulated throttling, Chrome 130) on
`/` and `/galeria`; layout geometry measured through the DevTools Protocol at
five viewport widths; computed contrast ratios; `pnpm audit --prod`; `pnpm lint`;
and source review. Every ❌ below was observed in served markup, Lighthouse
output, a measured bounding box, or a response header — not inferred from reading
components.

> **Verdict: fails.** One issue outranks everything else on this page, and it is
> not an optimisation — it is a page that does not work.
>
> **`/galeria` renders nothing below 1114 px.** Measured through CDP at 390, 768
> and 1000 px: `<main>` is **38 px wide** on a 390 px viewport, the four product
> tiles are **4 × 4 px** (their `border-2` and nothing else), and **0 of 9
> `<img>` elements are visible**. All nine images download anyway — **9.57 MiB**
> of them. A phone visiting the gallery sees a logo, a language switcher and a
> footer, after paying for the full image payload. The same holds for
> `/en/gallery` and `/de/galerie`. Cause is in `app/tailwind.css:10-17`:
> `body { display: flex }` makes `<main>` a flex item with no `flex: 1`, so it
> shrink-to-fits its max-content width. On `/` and `/kontakt` the body copy gives
> that a real value; on `/galeria` every visible element is either absolutely
> positioned or gated behind a `desktop:` variant, so there is nothing to measure
> and `<main>` collapses.
>
> **The gallery ships 9.87 MiB and a 44-second LCP.** Sixteen source JPEGs at
> 4000 × 6000 (23 MB in the repo) are served untouched into 400 × 400, 600 × 600
> and 80 × 80 slots. No `srcset`, no WebP/AVIF, no resizing step anywhere.
> Lighthouse puts `uses-responsive-images` alone at **9,554 KiB** of savings.
>
> **The 404 page is Remix's unstyled developer fallback** — `<title>Unhandled
> Thrown Response!</title>`, `lang="en"` on a Polish site, and an inline
> `console.log` addressed to the developer. The status code is correct; the page
> is a dev artifact reaching production.
>
> What is in good shape and should not be re-litigated: canonical and a full
> reciprocal `hreflang` set on all 9 URLs, per-page titles and descriptions in
> three languages, a skip link, labelled `<nav>` landmarks, correct 404 status
> codes, `alt` on every image, contrast that passes AA on every colour actually
> used, and intact default focus rings (nothing anywhere sets `outline-none`).

> **The working tree diverged mid-audit (10 Aug 2026, 13:33).** Every measurement
> below was taken against `a15d00d`. While it was running, `6943874`
> (*fix(seo): list all 9 localized URLs in sitemap.xml*) landed: the sitemap now
> emits 9 `<loc>` entries instead of 3, adds `x-default`, and both surfaces read
> from a new shared `app/lib/seo.js`. **§1.3's sitemap row is superseded by that
> commit** and is kept as measured rather than rewritten — a measurement
> re-labelled to fit a later state is not a measurement.
>
> **Re-measured against `6943874` after the fact**, rebuilt and re-served: the
> sitemap emits **9 `<loc>` entries and 9 `x-default` links**, all 9 URLs return
> 200, and every page still carries its canonical plus 4 `hreflang` links. The
> headline `/galeria` finding was re-measured on the same build and is
> **unchanged**: `<main>` 38 px wide with 0/9 images visible at 390 px and
> 768 px, and `<main>` 1114 px with 112 × 112 px tiles at 1114 px and above. The
> h1 counts are also unchanged (1 on each homepage, 0 on the other six).
> Everything else below
> therefore still describes the current tree; only `root.jsx` line numbers shift
> by a few lines after the extraction.

**Legend:** ✅ verified against served output · ⚠️ works, with a caveat · ❌ failing ·
📄 source-verified only

**Scope.** Three locales — `pl` (default, unprefixed), `en` under `/en`, `de`
under `/de` — 9 indexable URLs, no CMS, no forms, no user input. Product data is
a hardcoded module (`app/lib/products.js`) generating 4 items.

| Route group                            | Rendering  | Transferred (measured) | Count |
| -------------------------------------- | ---------- | ---------------------- | ----- |
| `/`, `/en`, `/de`                       | SSR        | 0.29 MiB               | 3     |
| `/galeria`, `/en/gallery`, `/de/galerie`| SSR        | **9.87 MiB**           | 3     |
| `/kontakt`, `/en/contact`, `/de/kontakte`| SSR       | 0.29 MiB               | 3     |

Transferred = HTML + JS + CSS + images, fetched over the wire. No compression is
applied (§2.4), so these are also the uncompressed sizes.

---

## 1. SEO

### 1.1 Metadata

| Item                        | Status | Finding                                                                                                                                                                                                                                                   |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titles                      | ✅     | All 9 unique, localised, 31–53 chars — comfortably inside the ~60-char budget. `root.jsx:16-54` derives them from `LOCALES` plus a page suffix. No duplicates across locales.                                                                              |
| Descriptions                | ⚠️     | All 9 unique and localised, but the lengths split in two. The six gallery/contact pages sit at **72–83 chars**, roughly half the 140–160 budget, so Google has room to synthesise over them. The three homepages are 151 (`/`), 163 (`/en`) and 121 (`/de`) — only `/en` is at real truncation risk. Nothing is missing; the six short ones are the ones worth rewriting. |
| **`og:locale` format**      | ❌     | Emitted as `pl-PL` / `en-US` / `de-DE`. Open Graph specifies underscore — `pl_PL`. Facebook and LinkedIn ignore the hyphenated form. `locales.js:3,38,74` hold the values; the fix is three characters.                                                     |
| **No `og:image`**           | ❌     | Absent on all 9 URLs. Every share of this site — the entire contact surface for a B2B manufacturer — renders as a bare text card. `twitter:card` is set to `summary`, which also expects an image.                                                          |
| `og:site_name`              | ⚠️     | Absent. Minor next to the missing image, but it is the other half of the same block.                                                                                                                                                                       |
| `og:locale:alternate`       | ⚠️     | Absent, on a site that has three locales and already computes them for `hreflang` (`root.jsx:76-99`).                                                                                                                                                       |
| `og:title` / `og:url` / `og:type` | ✅ | Present and correct on all 9, matching the page title and canonical.                                                                                                                                                                                       |
| `twitter:*`                 | ✅     | `card`, `title` and `description` present on all 9 and consistent with the `og:` values — no split-brain between crawlers.                                                                                                                                  |
| Canonical                   | ✅     | Absolute, per-route, on all 9 URLs, trailing slash normalised (`root.jsx:48-51`). `/` correctly emits `https://neatual.com/`.                                                                                                                              |
| `hreflang`                  | ✅     | Four `<link rel="alternate">` per page — `pl`, `en`, `de`, `x-default` → `pl` — reciprocal across all 9 URLs. Rendered in markup as `hrefLang`; parsed with an HTML parser to confirm it resolves to `hreflang`, which it does. Cosmetic, not a defect.  |
| `robots` meta               | ✅     | Absent (= indexable) on all 9. Nothing is accidentally excluded.                                                                                                                                                                                            |

### 1.2 Headings

| Item                          | Status | Finding                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **6 of 9 pages have no `<h1>`** | ❌   | Measured in served HTML: `/galeria`, `/kontakt` and their six locale variants contain **zero heading elements of any level**. Product names are `<p class="uppercase font-bold">` (`galeria.jsx:97`), the modal heading is a `<p>` (`ModalSingleProduct.jsx:89-93`).           |
| Homepage `h1`                 | ✅     | Exactly one, localised, `sr-only` (`_index.jsx:17-23`). Correct for a design with no visible page title.                                                                                                                                                                        |
| No `h2`–`h6` anywhere         | ❌     | Across all 9 URLs there is not a single subheading. There is no document outline to navigate on any page of the site.                                                                                                                                                            |

### 1.3 Sitemap, robots & status codes

| Item                        | Status | Finding                                                                                                                                                                                                                                          |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Sitemap lists 3 of 9 URLs~~ | ✅ **fixed in `6943874`** | As measured on `a15d00d`: 3 `<loc>` entries (the Polish paths only). `/en`, `/de`, `/en/gallery`, `/de/galerie`, `/en/contact`, `/de/kontakte` appeared solely as `xhtml:link` alternates, which annotate a URL but do not submit it. No `x-default`. **Re-measured on `6943874`: 9 `<loc>` entries, each carrying the full reciprocal `hreflang` set plus `x-default`, all 9 returning 200.** Row kept rather than deleted so a later pass does not re-derive it. |
| `lastmod`                   | ⚠️     | Absent. Optional, and with hardcoded content there is no honest value to emit — worth leaving out rather than emitting `new Date()`.                                                                                                              |
| `robots.txt`                | ✅     | Static file in `public/`, `Allow: /`, declares the sitemap. Correct and minimal.                                                                                                                                                                 |
| 404 status                  | ✅     | `/nie-ma-takiej-strony` returns **404**, not a soft 200.                                                                                                                                                                                         |
| **404 page body**           | ❌     | Remix's built-in developer fallback: `<title>Unhandled Thrown Response!</title>`, `<html lang="en">` on a Polish site, no header, no footer, no link home, and an inline `console.log` that begins *"💿 Hey developer 👋"*. There is no `ErrorBoundary` anywhere in `app/`. |

### 1.4 Content & internationalisation

| Item                                | Status | Finding                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EN/DE gallery ships Polish copy** | ❌     | `app/lib/products.js` is Polish-only and locale-blind. Verified in served markup at `/en/gallery` and `/de/galerie`: product names `Wzór nr 1`…`4`, description `50% bawełna / 50% len<br>Uszyto w Polsce.`, and the primary `alt` `Uniform wzór nr 1 - 50% bawełna, 50% len, uszyto w Polsce`. Only the small thumbnail `alt` is localised (`- photo 1` / `- Foto 1`), which makes the gap look deliberate. Six pages of near-untranslated content carrying `hreflang` that promises translation. |
| **Placeholder price in production** | ❌     | `products.js:3` sets `price: "XX PLN"`. It renders on every gallery page in all three locales, and is plainly visible in the desktop screenshot. This is the only price on the site.                                                                                                                        |
| Duplicate product data              | ⚠️     | All four products share the same name pattern, the same description and the same price. As indexable content, `/galeria` is four repetitions of one string.                                                                                                                                                 |
| Internal linking                    | ⚠️     | Footer `<nav>` links the three pages within a locale; the header switches locale. There are no links out of a locale into another page of a different locale, and no link home from the 404. Adequate for 9 URLs.                                                                                            |

### 1.5 Images & alt text

| Item           | Status | Finding                                                                                                                                                                     |
| -------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alt` coverage | ✅     | **0 images without `alt`** across all 9 URLs. Decorative icons carry `aria-hidden="true"` at their call sites, verified in served markup.                                    |
| Dimensions     | ✅     | Every `<img>` carries `width` and `height`. Lighthouse `unsized-images` passes, and CLS is **0** on both audited pages.                                                      |
| Alt language   | ❌     | Polish on EN and DE pages — see §1.4.                                                                                                                                        |
| `srcset`       | ❌     | Not generated anywhere. See §2.2.                                                                                                                                            |

### 1.6 Structured data

| Item              | Status | Finding                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`    | ⚠️     | One clean block on all 9 URLs (`root.jsx:132-157`) with `name`, `url`, `logo`, `contactPoint` and a full `PostalAddress`. It does not invent ratings — correct. Two gaps: `logo` points at `/favicon.svg`, and Google's logo guidance wants a raster image; and for a manufacturer with a street address, `LocalBusiness` (or `ClothingStore`) with `openingHours` and `geo` is the type that feeds the map pack. |
| Identical on all 9 | ⚠️    | The same Organization graph is emitted on every page, including both non-Polish locales, with no `inLanguage` and no per-page type. `/galeria` is a natural `ImageGallery` / `ItemList` candidate; `/kontakt` a `ContactPage`.                                                                                                                                        |
| `WebSite` / `BreadcrumbList` | ⚠️ | Neither is present. Low value at 9 URLs, but `WebSite` is three lines.                                                                                                                                                                                                                                                                          |

---

## 2. Performance

Lighthouse 12.8.2, **mobile** form factor, simulated throttling, Chrome 130,
**one run per URL** (not three — treat single-run LCP as indicative, and note
that nothing in this repo aggregates or gates these numbers at all, see §5):

| Page       | Perf   | A11y | Best pract. | SEO | FCP   | LCP        | CLS | TBT  | Total bytes    |
| ---------- | ------ | ---- | ----------- | --- | ----- | ---------- | --- | ---- | -------------- |
| `/`        | 85     | 95   | 100         | 100 | 3.0 s | 3.6 s      | 0   | 0 ms | 382 KiB        |
| `/galeria` | **70** | 91   | 96          | 100 | 2.9 s | **44.1 s** | 0   | 0 ms | **10,175 KiB** |

The Performance *score* of 70 badly understates `/galeria`: FCP and Speed Index
are fine because the page paints its (empty) shell quickly, and the 44-second LCP
is diluted by the other metrics. The LCP element is the footer nav item
`KONTAKT` — a 72 × 21 px text node — and **99% of its 44.1 s is render delay**
(43.6 s), i.e. the main thread waiting behind 9.57 MiB of images that are never
shown. That is the whole finding in one number.

### 2.1 Images — the dominant cost

| Item                        | Status | Finding                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source resolution**       | ❌     | 16 JPEGs, **23 MB** in the repo, tracked in git. Sampled dimensions: 4000 × 6000, 3802 × 5703, 3456 × 5184. Individual files run 1.26–2.17 MB. They are served byte-for-byte into `<img width="400" height="400">`, `600 × 600` and `80 × 80` slots.                                                                                                                                                          |
| **No responsive variants**  | ❌     | Lighthouse `uses-responsive-images`: **9,554 KiB** potential savings — the largest single number in this audit. No `srcset`, no `sizes`, no build-time resize step, no image CDN.                                                                                                                                                                                                                                |
| **No modern formats**       | ❌     | Lighthouse `modern-image-formats`: **2,028 KiB** on top. Everything is baseline JPEG.                                                                                                                                                                                                                                                                                                                          |
| **The lazy-loading ternary never fires** | ❌ | `galeria.jsx:74` sets `loading={index < 4 ? "eager" : "lazy"}`. There are exactly **4 products** (`products.js:15-20`), so the condition is true for every tile and nothing is ever lazy. The four 1.3–1.7 MB thumbnails all load eagerly — on a page where they render at 4 × 4 px below 1114 px (§2.5).                                                                                                       |
| Unused download             | ❌     | Below 1114 px all 9 images are fetched and **none is visible**. The 80 × 80 thumbnail strip and the 600 × 600 detail image live inside `hidden desktop:flex` (`galeria.jsx:81`), so their bytes are pure waste on every phone and tablet.                                                                                                                                                                        |

### 2.2 Transport

| Item                    | Status | Finding                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No compression**      | ❌     | Verified with `Accept-Encoding: gzip, br` — the response carries **no `Content-Encoding`**. `server.js` mounts `express.static` and the Remix handler with no `compression` middleware. Lighthouse `uses-text-compression`: **199–201 KiB**. The build reports `components-*.js` at 187.02 kB raw / 60.41 kB gzipped; the wire gets 187 kB. |
| **`Cache-Control: public, max-age=0`** | ❌ | On every static asset, including the content-hashed `/assets/*` bundles that are immutable by construction, and the 23 MB of gallery JPEGs. `express.static("build/client")` at `server.js:14` uses the default `maxAge: 0`. Every navigation re-validates everything.                                                        |
| `X-Powered-By: Express` | ⚠️     | Emitted on every response. One line (`app.disable('x-powered-by')`) removes it.                                                                                                                                                                                                                                              |
| Render-blocking CSS     | ⚠️     | Two blocking stylesheets, est. 150 ms: the app CSS (11.4 kB) and the **Google Fonts** `css2` request. `preconnect` to both font origins is already correctly declared (`root.jsx:96-97`).                                                                                                                                    |

### 2.3 JavaScript

| Item          | Status | Finding                                                                                                                                                                                                                                                            |
| ------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bundle size   | ✅     | 9–10 chunks, **278 KiB uncompressed / ~90 KiB gzipped equivalent** on every route. For a React SSR app that is lean, and it is essentially all React itself (`components-*.js` 187 kB, `index-*.js` 69.5 kB). No heavy third-party dependency is present to remove. |
| TBT           | ✅     | **0 ms** on both pages. There is no main-thread work to speak of.                                                                                                                                                                                                    |
| Empty chunk   | ⚠️     | The build warns `Generated an empty chunk: "sitemap_._xml"` — the sitemap is a server-only resource route, so Vite emits a 0-byte client chunk for it. Harmless, but it is a warning printed on every build that nobody has decided about.                           |
| `revalidate` / caching | ⚠️ | The root loader (`root.jsx:111-114`) returns `url.pathname` and runs on every request. Nothing is cached at the framework level; there is nothing expensive behind it, so this is a note rather than a cost.                                                          |

### 2.4 Layout — measured, not inferred

CDP measurement, Chrome 130, `Emulation.setDeviceMetricsOverride`, five widths.
`imgs` = `<img>` elements with a rendered box larger than 8 × 8 px.

| Page       | 390 px           | 768 px           | 1000 px          | 1114 px             | 1440 px             |
| ---------- | ---------------- | ---------------- | ---------------- | ------------------- | ------------------- |
| `/`        | main 390         | main 768         | main 1000        | main 1114           | main 1114           |
| `/kontakt` | main 390         | main 768         | main 1000        | main 1114           | main 1114           |
| `/galeria` | **main 38** · tiles 4×4 · **imgs 0/9** | **main 38** · tiles 4×4 · **0/9** | **main 38** · tiles 4×4 · **0/9** | main 1114 · tiles 112×112 · 9/9 | main 1114 · tiles 112×112 · 9/9 |

Corroborated three independent ways: the CDP bounding boxes above, Lighthouse's
own `target-size` audit (which reports the four tiles at 4 × 4 px), and a headless
screenshot at 390 × 844 that shows a single dot where the product grid should be.

**Mechanism.** `app/tailwind.css:10-17` sets `body { display: flex; align-items: stretch }`.
`<main>` is the only in-flow flex child and has no `flex: 1` or `width: 100%`, so
it shrink-to-fits. On `/` and `/kontakt` the paragraphs give max-content a real
width. On `/galeria` the visible content is a `<ul class="grid grid-cols-2">`
whose `<img>` children are `position: absolute` (`galeria.jsx:75`) and whose
sibling detail panel is `hidden desktop:flex` — so max-content is the 4 px of
tile border plus the 10 px `gap-4` plus 20 px of `px-4` padding. 38 px, exactly
as measured. `grid-cols-2` then resolves to two 0-width columns and the tiles
render as their borders alone.

The one-line fix is `flex: 1` (or `w-full`) on `<main>` in `root.jsx:168`; the
sturdier fix is dropping `display: flex` from `body`, which nothing else needs.

---

## 3. Accessibility

Lighthouse scores **95** on `/` and **91** on `/galeria`. Both are real results
and neither is the whole picture — axe sees one rendered page, and the modals
below only exist after a click.

### 3.1 Landmarks & structure

| Item                | Status | Finding                                                                                                                                                                       |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skip link           | ✅     | `root.jsx:160-166`, localised in all three languages, correctly hidden off-screen until `:focus` (`tailwind.css:19-31`). Targets `<main id="main-content" tabIndex={-1}>`.    |
| `header`/`main`/`footer` | ✅ | Exactly one of each on all 9 URLs.                                                                                                                                            |
| Two labelled `<nav>` | ✅    | Language selector (`Header.jsx:138`) and main navigation (`Footer.jsx:12`), each with a localised `aria-label`. This is better than most sites this size manage.               |
| **No headings**     | ❌     | See §1.2 — 6 of 9 pages expose no heading at all, so heading navigation (the primary screen-reader wayfinding mechanism) does nothing on two thirds of the site.               |

### 3.2 Colour & contrast

Computed against `#EDEDED` (the page background). WCAG AA is 4.5:1 for normal text.

| Token             | Hex       | Ratio     | Where                            |     |
| ----------------- | --------- | --------- | -------------------------------- | --- |
| `black`           | `#000000` | 17.94     | Body text, active nav            | ✅  |
| `content`         | `#393939` | 9.86      | Descriptions                     | ✅  |
| `gray-accessible` | `#5C5C5C` | 5.71      | Inactive footer nav              | ✅  |
| `gray`            | `#858585` | **3.15**  | **defined but never used**       | ⚠️  |

**Contrast is not a finding here** — every colour actually rendered passes AA,
and the one failing token is dead. `gray` is a trap left in `tailwind.config.js:19`
that the next person to reach for a muted grey will fall into; `gray-accessible`
next to it is the evidence that someone already fell in once. Delete `gray`.

### 3.3 Text size & touch targets

| Item                            | Status | Finding                                                                                                                                                                                                                                                                                       |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`html { font-size: 10px }`**  | ❌     | `tailwind.css:5-8`. It exists so the `fontSize` scale can read `12`/`14`/`16` as px, but it discards the user's browser font-size preference for every element that does not carry an explicit `text-*` class. Lighthouse `font-size` on `/galeria`: **55.56% of text is below 12px**.       |
| **Language links are 17 × 12 px** | ❌   | Measured: `PL` 17 × 12, `EN` 18 × 12, `DE` 12 × 12, all at `font-size: 10px` — they inherit the root size because `Header.jsx:144` sets only `font-black`, never a `text-*` class. WCAG 2.5.8 requires 24 × 24. This is the only way to change language on the site.                        |
| Gallery tiles as targets        | ❌     | 4 × 4 px below 1114 px — a consequence of §2.4, listed here because Lighthouse reports it under `target-size`.                                                                                                                                                                                 |

### 3.4 Names & ARIA

| Item                              | Status | Finding                                                                                                                                                                                                                                                                                               |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logo link fails Label in Name** | ❌     | Lighthouse `label-content-name-mismatch`, score 0. `Header.jsx:101-111` gives the link `aria-label="Neatual - strona główna"` while its visible text is `netual.com`. The accessible name does not contain the visible label, so voice-control users saying "click netual dot com" get nothing. WCAG 2.5.3. |
| **`<li role="button">`**          | ❌     | `galeria.jsx:59`. Two Lighthouse failures from one line: `aria-allowed-role` (role `button` is not permitted on `<li>`) and `list` (the `<ul>` now has children that are not list items). It also strips the "list of 4 items" announcement. Use a `<button>` inside the `<li>`.                       |
| **`aria-label="Close"` in English** | ❌   | `ModalWithDetails.jsx:62` and `ModalSingleProduct.jsx:71`, hardcoded, on documents served as `lang="pl"` and `lang="de"`. Every other string in these components is localised.                                                                                                                          |
| Icons                             | ✅     | All decorative SVGs carry `aria-hidden="true"` at their call sites, verified in served markup. One exception: the homepage `<figure>` logo (`_index.jsx:25-28`) has neither `aria-hidden` nor a name — an unlabelled decorative graphic.                                                              |
| `aria-current`                    | ✅     | `Footer.jsx:25` sets `aria-current="page"` on the active nav link.                                                                                                                                                                                                                                     |

### 3.5 Keyboard & focus

| Item                              | Status | Finding                                                                                                                                                                                                                                                                          |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus indicators                  | ✅     | **Nothing in the codebase sets `outline-none`** — grepped across `app/`. Browser default focus rings are intact everywhere. Recorded so a later "add focus styles" pass does not start by removing them.                                                                          |
| Product tile selection            | ✅     | `galeria.jsx:53-60` handles `Enter` and `Space` and sets `tabIndex={0}`. The intent is right; only the `role` is wrong (§3.4).                                                                                                                                                    |
| **Photo thumbnails are click-only** | ❌   | `galeria.jsx:116` (desktop photo strip) and `ModalSingleProduct.jsx:109` (modal photo strip) attach `onClick` to `<li>` with no `tabIndex`, no `role` and no key handler. A keyboard user cannot switch between a product's four photos anywhere on the site.                     |
| Modal Escape                      | ✅     | Both modals bind a `keydown` listener for `Escape` and restore `document.body.style.overflow` on unmount (`ModalWithDetails.jsx:26-34`, `ModalSingleProduct.jsx:31-39`). Correct, including the cleanup.                                                                          |
| **No focus trap, no focus restore** | ❌ 📄 | Neither modal constrains Tab to its own subtree, and neither returns focus to the trigger on close. `autoFocus` on the close button handles entry; exit drops the user back at the top of the document. Source-verified — the modals do not exist in SSR output.                  |
| Backdrop click                    | ✅     | `aria-hidden="true"` on the backdrop with `onClick={onClose}`, and Escape provides the keyboard equivalent — so the click-only handler here is not a barrier.                                                                                                                     |

### 3.6 Motion & language

| Item                     | Status | Finding                                                                                                                                                                        |
| ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prefers-reduced-motion` | ✅     | Not needed. Grepped `app/` for `transition`, `animate-` and keyframes: **no animation of any kind exists**. Recorded so it is not added as a checklist item without a cause.    |
| `lang`                   | ✅     | `pl` / `en` / `de` on the matching URLs, verified in served markup on all 9.                                                                                                    |
| ARIA copy                | ❌     | Two English strings inside Polish and German documents — see §3.4.                                                                                                              |

### 3.7 Rendering strategy

| Item                              | Status | Finding                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`useDeviceType` defaults to desktop** | ⚠️ | `DisplayMedia.jsx:10` initialises state to `"desktop"` and corrects it in `useEffect`. SSR therefore always emits the desktop branch, and mobile visitors get a content swap after hydration. Verified: `/` SSR contains `fullDescription` and the `netual` wordmark, and **not** the mobile `shortDescription`.               |
| The upside                        | ✅     | Because desktop is the SSR default, the *long* copy is what crawlers index. Accidental, but correct.                                                                                                                                                                                                                            |
| The cost                          | ⚠️     | Measured CLS is **0** on both pages, so the swap is not currently shifting layout. It is still a JS-gated render of primary content: with JS disabled or slow, mobile users get desktop markup. A CSS media-query approach would remove the hook, the swap and the hydration risk in one move.                                 |

---

## 4. Open items, in the order worth doing them

1. **Make `<main>` fill its container** (§2.4) — `flex: 1` on `<main>`, or drop
   `display: flex` from `body`. One line. Until it lands, `/galeria`,
   `/en/gallery` and `/de/galerie` show nothing to any visitor under 1114 px,
   which is most of them. Everything else on this list is an improvement; this
   is a repair.
2. **Resize and convert the gallery images** (§2.1) — 23 MB of 4000 × 6000 JPEGs
   into 400/600/80 px slots. Generate WebP at the three rendered sizes and add
   `srcset`/`sizes`. Lighthouse puts this at 9,554 + 2,028 KiB, and it is the
   difference between a 44 s LCP and a normal one.
3. **Enable compression and cache headers** (§2.2) — `compression()` middleware
   plus `express.static(..., { immutable: true, maxAge: '1y' })` for
   `/assets/*`. Two lines in `server.js`, ~200 KiB per page load, and it stops
   the browser re-validating content-hashed bundles.
4. **Fix the lazy-loading ternary** (§2.1) — `index < 4` with 4 products means
   nothing is ever lazy. Either lower the threshold or drop the eager path.
5. **Write a real 404 page** (§1.3) — an `ErrorBoundary` in `root.jsx` with the
   site chrome, the right `lang`, and a link home. The current page tells the
   visitor the developer forgot.
6. **Localise the product data** (§1.4) — `products.js` is Polish-only on six
   non-Polish pages that carry `hreflang` promising otherwise. Same pass:
   replace `XX PLN` with a real price or remove the field.
7. **Add an `<h1>` to the gallery and contact templates** (§1.2) — 6 pages
   currently have no heading of any level.
8. **Fix the language switcher** (§3.3) — give the links a `text-14` class and
   padding to clear 24 × 24 px. They are 17 × 12 px at 10 px type, and they are
   the only way to change language.
9. **Fix the two ARIA defects** (§3.4) — `<button>` inside the `<li>` instead of
   `role="button"` on it, and localise `aria-label="Close"`.
10. **Add `og:image`** (§1.1) — plus `og:site_name`, and change `og:locale` to
    `pl_PL`/`en_US`/`de_DE`. Every share of this site is currently a bare card.
11. **Make the photo thumbnails keyboard-reachable** (§3.5) — `galeria.jsx:116`
    and `ModalSingleProduct.jsx:109`.
12. **Trap and restore focus in the modals** (§3.5).
13. **Delete the `gray` token** (§3.2) — 3.15:1, unused, and sitting next to the
    replacement someone already had to add.
14. **Reconsider `html { font-size: 10px }`** (§3.3) — a `rem`-based scale on a
    `62.5%` root is a known pattern, but it currently leaves every unclassed
    element at 10 px and puts 55% of the gallery's text under the legibility
    threshold.

Items 1–3 change whether the site works and what it costs to load. 4–7 are
content and correctness. The rest are mechanical.

---

## 5. What is enforced automatically

| Check            | Command      | In CI | Real coverage                                                                                                                                                                                   |
| ---------------- | ------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint           | `pnpm lint`  | ❌    | ⚠️ **Passes with zero output, and means very little.** `.eslintrc.cjs` extends `eslint:recommended` only — no `react`, no `react-hooks`, no `jsx-a11y`. Every §3 finding is out of its reach.  |
| Prettier         | —            | ❌    | Not configured.                                                                                                                                                                                  |
| Typecheck        | —            | ❌    | Plain JS, no JSDoc, no `checkJs`. Nothing checks types.                                                                                                                                          |
| Unit tests       | —            | ❌    | **There are no tests in this repository.**                                                                                                                                                       |
| a11y tests       | —            | ❌    | None.                                                                                                                                                                                            |
| Lighthouse       | —            | ❌    | Not wired. The numbers in §2 came from an ad-hoc `npx lighthouse` run in this audit and nothing reproduces them.                                                                                  |
| Production build | `pnpm build` | ❌    | Runs clean locally (863 ms client, 66 ms SSR, exit 0) but no CI job runs it.                                                                                                                      |
| Dependencies     | `pnpm audit` | ❌    | Nothing checks. 4 advisories — see the security audit.                                                                                                                                            |

There is **no `.github/` directory**. Nothing in this list runs anywhere except
by hand. The pattern in the sibling repos — "the gates that exist are real, and
the ones that would have caught these findings are green for the wrong reason" —
does not apply here, because only one gate exists and it is scoped too narrowly
to catch anything in this document.

The cheapest meaningful gate is a CI job running `pnpm lint && pnpm build` with
`eslint-plugin-jsx-a11y` added to the config: that alone would have caught the
`<li role="button">` defect in §3.4.

---

## 6. Related

- [`audits/2026-08-10-security-dependency-audit.md`](audits/2026-08-10-security-dependency-audit.md) — same audit date; the dependency snapshot and the runtime-dependency defect
- Sibling audits in the same shape: `~/Code/hannajuszczak.pl/docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`, `~/Code/soundhike.pl/docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`, `~/Code/warszawskaakademiamalucha.pl/docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`
- Templates these are written from: `~/Code/AI/RUNBOOK_AUDIT.md`, `RUNBOOK_SEO_AUDIT.md`, `RUNBOOK_A11Y_AUDIT.md`, `RUNBOOK_WEB_VITALS_AUDIT.md` — not vendored into this repo yet
