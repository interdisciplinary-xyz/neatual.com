# Real rates and terms of cooperation — plan

Date: 2026-08-17 · Branch: `scope/v0.3.0` · Base commit: `e67fdcf`

The client sent the first real pricing over chat, plus a promise of a
"warunki współpracy" document to publish later ("taki dupochron dla mnie").
This is the plan for landing both.

## What arrived

| # | Client's wording (verbatim) | Rate |
| --- | --- | --- |
| 1 | Tapety obiektowe | od 35 zł do 150 zł za m² |
| 2 | Tapety z pasowaniem wzoru | od 40 do 200 zł za m² |
| 3 | Tapety klejone na powierzchnie niechłonne | 250 zł za m² |
| 4 | Tapety wzorzyste klejone na powierzchnie niechłonne | 300 zł za m² |

Plus: *"docelowo przygotuję Ci plik odnośnie warunków współpracy, żeby było na
stronie"* — a separate deliverable, arriving as a file.

**What did not arrive**, and the site currently has rows for: surface
preparation, removal of old wallpaper, minimum job value, and photo murals
(fototapety). Also missing: net or gross, and what moves rate 1 from 35 to 150.
See [Open questions](#open-questions-for-the-client).

## The good news: the page is already built

Nothing here is new construction. `/cennik`, `/en/pricing` and `/de/preise`
have rendered a real `<table>` from CMS-or-fallback content since v0.2.0,
deliberately holding em-dashes instead of invented numbers.

| Piece | Where | State |
| --- | --- | --- |
| Route + accessible table | `app/routes/cennik.jsx` (+ `en.pricing.jsx`, `de.preise.jsx`) | Done, no change needed |
| Bundled fallback rates | `PRICING` — `app/lib/inlineCopy.js:408` | 6 placeholder rows, all prices `——— zł` |
| CMS fields | `pricingIsPlaceholder`, `pricingIntro`, `pricingColumns`, `pricingRows`, `pricingNotes` — `sanity/schemas/page.js:76-142` | Done, empty |
| Resolver + placeholder guard | `pricingFrom()` — `app/lib/content.server.js:59` | Defaults `isPlaceholder` to **true** on a missing value |
| "Not an offer" notice | Rendered `role="status"` — `cennik.jsx:23-33` | Driven by `isPlaceholder` |
| `noindex` on the page | `app/root.jsx:260-268` | Driven by `isPlaceholder` |
| Deliberately absent `priceSpecification` | `app/root.jsx:195-218` | Comment says revisit "once real numbers are entered" |
| Guard tests | `test/pricing.spec.js` | Pin `isPlaceholder === true` and **no digit in any price** |

The whole design is one switch: fill the rows, set `pricingIsPlaceholder` to
false in the Studio, and the notice and the `noindex` lift themselves.

## Phase 1 — the four rates

### 1a. Row mapping

The client's taxonomy is not the site's. His axes are wallpaper class
(obiektowa / z pasowaniem wzoru / wzorzysta) × substrate (absorbent by default /
niechłonna). The site's six rows are class + job stage. Proposed rows —
the four he priced, then the three the site needs and he did not price, carried
as an explicit "quoted individually" rather than dropped:

| key | pl | en | de | Rate |
| --- | --- | --- | --- | --- |
| `contract` | Tapety obiektowe | Contract wallpaper | Objekttapeten | 35–150 zł |
| `pattern-match` | Tapety z pasowaniem wzoru | Wallpaper with pattern matching | Tapeten mit Musteranpassung | 40–200 zł |
| `non-absorbent` | Tapety na powierzchniach niechłonnych | Wallpaper on non-absorbent surfaces | Tapeten auf nicht saugenden Untergründen | 250 zł |
| `non-absorbent-patterned` | Tapety wzorzyste na powierzchniach niechłonnych | Patterned wallpaper on non-absorbent surfaces | Gemusterte Tapeten auf nicht saugenden Untergründen | 300 zł |
| `preparation` | Przygotowanie podłoża | Surface preparation | Untergrundvorbereitung | wycena indywidualna |
| `removal` | Zdjęcie starej tapety | Removal of existing wallpaper | Entfernen alter Tapeten | wycena indywidualna |
| `minimum` | Minimalna wartość zlecenia | Minimum job value | Mindestauftragswert | wycena indywidualna |

Retired: `standard` (superseded by `contract` + `pattern-match`), `textured`
(never had a service page), `mural` (fototapeta — see question 4; it has a
service page, so it stays as "wycena indywidualna" if he confirms he does them).

`pricingKey` on the `service` documents is a reference only — nothing renders
off a match (`content.server.js:192`, `:297`) — so retiring a key breaks no
page. But `mural`, `standard`, `preparation`, `removal` and `minimum` ×2 are
each named by a service page (`inlineCopy.js:543-793`), and the whole premise of
those pages is that they are prose for a row that exists. Retiring `standard`
means repointing `/uslugi/...` to `pattern-match`, which is a copy edit, not
a restructure.

### 1b. Edits

1. **`app/lib/inlineCopy.js`** — replace `PRICING.rows` with the table above;
   flip `isPlaceholder` to `false`; rewrite the ⚠️ block comment at `:390-407`
   (it documents *why* the numbers were fake, and would become a lie).
2. **`PRICING.notes`** — add the VAT line (question 1) and the range-driver line
   (question 2). Keep the existing three notes: client supplies the wallpaper,
   high walls/ceilings/stairwells quoted individually, travel beyond Siedlce.
3. **Sanity** — enter the same rows in the `pricing` page document and set
   *"Rates are placeholders"* to off. Then `pnpm content:check` must be clean;
   drift between the CMS and the fallback is the one failure mode this codebase
   has been bitten by before.
4. **`test/pricing.spec.js`** — three assertions invert:
   - `isPlaceholder` must now be `false` (a regression to `true` silently
     `noindex`es a page we want indexed — worth pinning in the new direction).
   - "carries no digit that could be read as a real rate" becomes: no price is
     still the em-dash placeholder, and every price is either an amount or the
     locale's individual-quote phrase.
   - the row-count assertion follows the new `PRICING.rows.length` for free.
5. **`test/i18n.spec.js`** — add `/^pricing\.rows\.\d+\.price$/` to
   `SAME_IN_EVERY_LANGUAGE` (`:34-56`). `"35–150 PLN"` is identical in en and
   de, and the drift test correctly reads identical strings as untranslated. A
   currency amount is a number, not prose — same category as the `m²` exemption
   already sitting two lines above.
6. **`app/root.jsx:195-218`** — add `priceSpecification` to the `Service` nodes
   whose row now has a real rate: `UnitPriceSpecification`, `priceCurrency:
   "PLN"`, `unitCode: "MTK"` (m²), `minPrice`/`maxPrice` for the ranges. The
   existing comment authorises exactly this once numbers are real. Skip it for
   the "wycena indywidualna" rows — a `priceSpecification` with no price is
   worse than none.
7. **Meta copy** — `PAGE_META.pricing.description` should stop implying a page
   in preparation, if it does. Run through `/copy-update` so pl/en/de move
   together.

### 1c. What flipping the switch buys

The page leaves `noindex` and enters the sitemap's indexable set. "cennik
tapetowania", "ile kosztuje tapetowanie za m2" and the `+ miasto` variants are
the highest-intent queries this business has, and the site currently answers
none of them. This is the single biggest SEO change available to it — which is
also the argument for not shipping it half-answered.

## Phase 2 — warunki współpracy

Blocked on his file. What can be decided now is where it lives.

### Routing

| Locale | Path |
| --- | --- |
| pl | `/warunki-wspolpracy` |
| en | `/en/terms-of-cooperation` |
| de | `/de/zusammenarbeit` |

Slugs are translated, matching the `/uslugi` · `/en/services` · `/de/leistungen`
convention set in v0.3.0.

### Not a sixth nav item

`navItemsFrom()` (`app/lib/useContent.js:14`) builds the header nav by mapping
`PAGE_KEYS` directly, so adding `terms` to `PAGE_KEYS` puts it in the main nav
automatically. It should not go there: `Header.jsx:290-297` records that the
nav is already tight enough at five labels that a hamburger exists below 608px,
and a legal page does not earn a slot ahead of Cennik or Kontakt.

Proposed: split the constant. `PAGE_KEYS` keeps its current job (sitemap,
hreflang, seed, CMS completeness check, schema `pageKey` list) and gains
`terms`; a new `NAV_KEYS` — the current five — is what `navItemsFrom()` maps.
Then link the page from the footer. Roughly 6 lines across `seo.js` and
`useContent.js`, and `test/seo.spec.js` picks the new page up on its own.

**Trap worth naming**: `getContent()` (`content.server.js:474`) drops the whole
site to bundled fallback copy if *any* `PAGE_KEYS` document is missing from
Sanity. So the `terms` document must exist in the dataset **before** the code
naming it deploys, or every page silently serves fallback copy. Seed first,
deploy second.

### Content

Transcribed from his file, not authored here — it is his liability position, and
inventing terms is worse than having none. Structure the transcription as
Portable Text in the existing `body` field, which `RichText.jsx` already
renders.

Two things to raise with him, because they decide whether the page does the job
he wants:

- **A page is not a contract.** Terms published on a website bind a client only
  if the engagement references them. For the "dupochron" to work, his quotes and
  order confirmations need a line like *"Zlecenie realizowane na warunkach
  opublikowanych na neatual.com/warunki-wspolpracy, wersja z DD.MM.YYYY"* — and
  the page therefore needs a visible version date, and old versions kept.
- **Consumer vs business clients.** If he works for private individuals and not
  only designers and contractors, Polish consumer law constrains what the terms
  can say (the unfair-terms register, and 14-day withdrawal on distance and
  off-premises contracts). Worth a lawyer's read of his draft before it goes up
  under his company's name. Recommend it; don't gate on it.

## Open questions for the client

Ordered by whether they block publishing.

**Blocking — a wrong answer here misquotes real money:**

1. **Netto czy brutto?** 35 zł net and 35 zł gross are 23% apart. The page must
   say which, in a note. (And if renovation work in housing is billed at 8% VAT,
   the note should say when each applies.)
2. **What moves 35 → 150 and 40 → 200?** A range with no stated driver reads as
   arbitrary and invites the client to assume the bottom of it. One line —
   material type, wall height, quantity, condition of the substrate — makes the
   number usable.

**Blocking for the rows we already publish:**

3. **Przygotowanie podłoża, zdjęcie starej tapety, minimalna wartość zlecenia** —
   rates, or confirm "wycena indywidualna"? Each has a live service page.
4. **Fototapety** — priced under `pattern-match`, or a separate rate? `/uslugi`
   has a page for them.
5. **Do the 250/300 zł niechłonne rates replace the base rate, or add to it?**
   Read as replacements in the table above — confirm.

**Non-blocking:**

6. Rate for ceilings, stairwells, curved walls, or keep the existing
   "quoted individually" note?
7. Travel: flat call-out fee, or per-km beyond Siedlce as the note now says?
8. Minimum billable area per job (e.g. 10 m² even on a 6 m² wall)?

## Sequencing

1. Send questions 1–5 to the client (one message, his four rates quoted back so
   he can correct the mapping).
2. On answers: Phase 1 in one commit — copy, tests, Sanity, JSON-LD.
   `pnpm test` · `pnpm content:check` · `/deploy-check`.
3. Flip *"Rates are placeholders"* off in the Studio as the last step, so the
   page is never indexable before the numbers are right.
4. Request a sitemap re-crawl; the pricing URLs are new to the index.
5. Phase 2 when the file arrives: seed the `terms` document, then ship the
   route, `NAV_KEYS` split, and footer link.

## Execution log — 2026-08-17

Phase 1 is done. Phase 2 is not started: it is blocked on the client's file, and
a route with no content is worse than no route.

| Step | What landed |
| --- | --- |
| Rows | 8 rows in `PRICING` (`inlineCopy.js`): the four rates, plus `mural`, `preparation`, `removal`, `bespoke` at `wycena indywidualna` via one shared `INDIVIDUAL_QUOTE` constant |
| Flag | `PRICING.isPlaceholder: false`; `pricingFrom()` now defaults to it instead of hardcoding `true` |
| Permanent qualifier | New bundled `notAnOffer` line, rendered above the table in `cennik.jsx` on every visit, with a `NOT_EDITABLE` entry in `cms-coverage.spec.js` |
| Service remapping | `standard` → `pattern-match`, and the two `minimum` services → `bespoke` and `contract` |
| Structured data | `RATE_NUMBERS` in `inlineCopy.js`; `Offer` + `UnitPriceSpecification` (`PLN`, `unitCode: MTK`) on the two priced service pages in `root.jsx`; nothing on the four quoted per job |
| Meta | `PAGE_META.pricing.description` leads with "od 35 zł/m²" in all three locales |
| Tests | `pricing.spec.js` guards inverted plus three new drift assertions; seeder comment corrected |

Verified in served output, not inferred: `/cennik` renders all four amounts and
the disclaimer, emits no `robots` meta, `/uslugi/tapetowanie-wnetrz-komercyjnych`
carries `minPrice: 35, maxPrice: 150`, `/de/leistungen/montage-gemusterter-tapeten`
carries `40–200` against `/de/preise`, and `/uslugi/zdjecie-starej-tapety` carries
no `offers` at all. `pnpm test` 73/73, `pnpm lint`, `pnpm build` clean.

### Two corrections to the plan above

1. **The i18n exemption in step 1b.5 was unnecessary and was not added.**
   `i18n.spec.js` only reports a string identical in *all three* locales, and
   Polish writes the currency as `zł` where en/de write `PLN`. Exempting the field
   would have bought nothing and stopped checking the rows priced "wycena
   indywidualna", which are prose and are translated. A comment saying so is in
   the exemption list in its place.

2. **The Studio step in sequencing 3 is currently moot, because Sanity is not
   answering for any page.** The dataset holds `home`, `gallery` and `contact`
   only — no `pricing` page and no `service` documents — and `getContent()`
   (`content.server.js:481`) drops the whole payload to bundled copy when any
   `PAGE_KEYS` document is missing. So the live site has been rendering entirely
   from `inlineCopy.js`/`locales.js` since the v0.2.0 content was written, and
   these rates go live on deploy with no Studio action. `pnpm content:check`
   reports 135 drifted fields, all of it the v0.2.0/v0.3.0 content never having
   been seeded — pre-existing, and not caused by this change.

   Reseeding (`pnpm seed:sanity:import`, which passes `--replace`) would overwrite
   the live dataset, so it is left for an explicit decision. The seeder writes
   `pricingIsPlaceholder` from `PRICING.isPlaceholder`, so a reseed lands the flag
   correctly rather than re-arming the notice.

### Second pass — the client's categories only

Decided after the first pass, and it supersedes the row set in §1a: the price
table holds **only** the four categories the business supplied, and no page names
a wallpaper type it did not. The four "wycena indywidualna" rows are gone.

Reasoning: a price list is the business's own category system. Adding rows to it —
even unpriced ones — puts words in its mouth about what it sells. "Quoted
individually" is not a rate; it is the reason there is no row.

| Surface | What changed |
| --- | --- |
| `/cennik` | 8 rows → the 4 supplied ones. `INDIVIDUAL_QUOTE` and `PRICING.individualQuote` removed |
| Notes | New note carrying what the removed rows said: preparation and stripping are quoted separately, once the walls have been seen. The high-walls note already covered the rest |
| Service pages | `pricingKey: null` on przygotowanie ścian, zdjęcie starej tapety, sufity i ściany wysokie. `montaz-fototapet` → `pattern-match`: a mural is not a fifth category, it is wallpaper whose drops must be matched — pending the client's answer to question 4 |
| Home page | `heading`, `shortDescription`, `fullDescription` and the site description in all three locales: "fototapety, wzory i tekstury" → "obiektowe i z pasowaniem wzoru", with the non-absorbent substrates named in the body. Gallery motifs (kwiatowe, tropikalne, pejzaże, geometryczne) kept — they are what the photographs show, and the gallery keeps them |
| Services hub | `PAGE_META.services.description` in all three locales: "tapety wzorzyste i strukturalne" → the client's categories |
| Gallery | Untouched, by decision — motif grouping, 18 published URLs, image folders |
| Tests | `seo.spec.js` relaxed from "every service names a row" to "names a row that exists, or explicitly names none", plus a new assertion that the field is always declared. `pricing.spec.js` now requires an amount on all four rows |

Verified in served output: `/cennik` shows exactly the four labels and the new
note; `/uslugi/montaz-fototapet` carries `minPrice: 40, maxPrice: 200`;
`/uslugi/przygotowanie-scian-pod-tapete` carries no `offers`; the home heading
reads "obiektowe i z pasowaniem wzoru". `pnpm test` 74/74, lint, build clean.

One inconsistency left standing on purpose: the gallery still has a
`montaz-tapet-strukturalnych` category, so "strukturalne" survives as a *motif*
name while it is gone from every page that describes what the business sells. That
is the trade the gallery decision buys — keeping 18 indexed URLs and the image
folders — and it is worth revisiting only if the client wants the gallery recut
along his four categories.

### Still outstanding

- **VAT.** No net/gross statement anywhere on the page, and none in the
  `priceSpecification` (`valueAddedTaxIncluded` deliberately omitted). This is
  question 1 and it is unanswered; it is a note in `PRICING.notes`, so once
  answered it is a Studio edit, not a deploy — *if* the dataset is seeded, and a
  one-line code change if it is not.
- **Questions 3–5.** Two of them now matter more than they did: whether murals
  really bill as `pattern-match` (the site now says so), and whether the four
  categories are the complete list or whether preparation, stripping and
  high-level work should have rows of their own.
- **Phase 2** in full.

## Risks

| Risk | Guard |
| --- | --- |
| Real rates land in the fallback but not in Sanity (or vice versa) | `pnpm content:check` — already exists, must be run |
| Page goes indexable while rows are half-answered | `pricingIsPlaceholder` stays on until step 3 |
| `terms` added to `PAGE_KEYS` before the document exists → whole site on fallback copy | Seed the document first; verify `content.source === "sanity"` after deploy |
| Ranges quoted without VAT or driver → client argues the low end | Questions 1–2 are blocking, not advisory |
| `priceSpecification` published with placeholder or missing prices | Only added for rows with real numbers |
