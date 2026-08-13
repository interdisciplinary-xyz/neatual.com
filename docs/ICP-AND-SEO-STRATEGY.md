# Company profile, ICP and search strategy

**Branch** `scope/v0.3.0` · **Base commit** `a84bbe5` · **Date** 2026-08-13

## Method

The company profile is read out of the codebase, not supplied: `app/lib/locales.js`,
`app/lib/inlineCopy.js` (`PRICING`, `PRODUCTS`), `.claude/CLAUDE.md` and the
`neatual-copy` skill. Where those disagree with the live site, the live site was
checked.

Search claims were checked against live SERPs rather than a keyword tool
(no Polish volume data was available in this environment), so **every claim
below about who ranks is observed; every claim about how much traffic a term
carries is an estimate and is marked as one.** Queries run:

| Query | What it was checked for |
| --- | --- |
| `fototapety kwiatowe` | who owns the product terms the gallery was titled after |
| `montaż tapet … cena za m2` | whether service+price intent has a contractor SERP |
| `"układanie tapet" OR "tapetowanie ścian" … Warszawa` | who the actual competitors are |
| `montaż tapety … flizelinowa/winylowa` | whether material terms are contractor or retail |

Page-level findings were observed in served HTML from `node ./server.js`, not
inferred from reading components.

**Deviation from the usual report-only rule:** this pass fixed what it found, in
the same branch. That was the request. Section 5 lists what changed; sections 6
and 7 list what was deliberately *not* done.

Legend: ✅ verified · ⚠️ works, with a caveat · ❌ failing · 📄 source-verified only

---

## 1. Verdict

> **The gallery was optimised for a business Neatual is not in.**
>
> Six category pages were titled after wallpaper *products* — "Fototapety
> kwiatowe", "Pejzaże", "Wzory geometryczne". Neatual does not sell wallpaper:
> the client or their designer buys it, and Neatual hangs it. The first page of
> `fototapety kwiatowe` is nine wallpaper shops and no installer, so those pages
> were competing against e-commerce domains they cannot outrank, for a visitor
> who wanted to buy a roll and would have bounced on arrival.
>
> **The pages that describe what Neatual actually sells did not exist.** There
> was no page for "montaż fototapet", "tapetowanie ścian", "zdjęcie starej
> tapety" or "przygotowanie ścian pod tapetę". The nearest thing was a row in a
> price table whose rates are placeholders and which is `noindex` because of it.
>
> **The technical SEO was already good** — hreflang, canonicals, sitemap,
> structured data and 404 handling were all correct before this pass, and are
> the reason the fix is a content and routing change rather than a rebuild.

---

## 2. Company profile

Read from the codebase; nothing here is inferred from the market.

| | |
| --- | --- |
| **What it does** | Hangs wallpaper. Murals (fototapety), patterned and textured coverings, on site. |
| **What it does not do** | Sell, print or supply wallpaper. `inlineCopy.js` note 1 under `PRICING`: "Tapetę kupuje klient lub jego projektant — my zajmujemy się wyłącznie montażem." |
| **Where** | All of Poland. Registered at ul. Siedlecka 172, 08-110 Żelków-Kolonia, near Siedlce. Travel beyond the Siedlce area is charged by distance. |
| **Interiors worked in** | Bathrooms, bedrooms, pool surrounds, hallways, commercial interiors — claimed because the gallery photographs show them. |
| **Priced by** | Wall area × covering type, plus preparation, plus removal of existing paper. High walls, ceilings, stairwells and curved surfaces quoted individually. Minimum job value applies. |
| **Languages** | Polish (source of truth, `x-default`), English, German. |
| **Rates** | ⚠️ **None published.** Every figure in `PRICING` is a deliberate `——— zł` placeholder and `/cennik` is `noindex` until `pricingIsPlaceholder` is turned off in the Studio. |

⚠️ **Stale-history warning.** The company previously made uniforms. Any copy
mentioning *szwalnia*, uniforms, EKOTRADE, "25 years" or the Warsaw University
of Technology ensemble is pre-pivot and wrong, not reference material.

---

## 3. ICP

Four segments, ordered by how well each is served by what the site can honestly
say today. The ranking is a judgement from the business model and the gallery
contents; it is not survey data.

### 3.1 Primary — the interior designer / architect (B2B2C)

The highest-value segment and the one the business model is already shaped
around: the site says twice that the wallpaper is chosen by "the client **or
their designer**".

| | |
| --- | --- |
| **Who** | Interior designers and design studios specifying wallpaper for residential or commercial projects. |
| **Job to be done** | "I have specified a mural for a client. I need somebody who will not ruin it." |
| **Buys on** | Craft, not price. A designer's reputation is on the wall. |
| **Fears** | A mis-aligned repeat, a visible seam, a tilted horizon, a fitter who blames the paper. |
| **Searches** | `montaż fototapet`, `wykonawca tapetowanie`, `tapeciarz [miasto]`, `montaż tapet tekstylnych` |
| **Frequency** | Repeat. One good job wins a decade of specifications. |
| **Site meets them at** | `/uslugi/montaz-fototapet`, `/uslugi/tapetowanie-wnetrz-komercyjnych`, and the gallery as proof. |

### 3.2 Primary — the commercial fit-out buyer

| | |
| --- | --- |
| **Who** | Office, hotel, retail and hospitality fit-out contractors and facilities managers. |
| **Job to be done** | "This has to be done by Monday, after hours, without disrupting the tenant." |
| **Buys on** | Schedule reliability and willingness to work in awkward windows — often ahead of rate. |
| **Fears** | Overrun, mess, a contractor who cannot work around an occupied building. |
| **Searches** | `tapetowanie biur`, `tapetowanie wnętrz komercyjnych`, `wykonawca tapet [miasto]` |
| **Value** | Largest jobs by area; the segment where a minimum job value is irrelevant. |
| **Site meets them at** | `/uslugi/tapetowanie-wnetrz-komercyjnych`. |

### 3.3 Secondary — the renovating homeowner

| | |
| --- | --- |
| **Who** | Owner of a flat or house, mid-renovation, has bought or is about to buy a mural. |
| **Job to be done** | "I bought this. I am not going to hang it myself." |
| **Buys on** | Price and proximity, then reassurance. Compares against doing it themselves. |
| **Fears** | Wasting expensive paper; being quoted for work they thought was included. |
| **Searches** | `montaż tapety cena`, `ile kosztuje położenie tapety`, `tapeciarz [miasto]`, `zdjęcie starej tapety` |
| **Blocked by** | ⚠️ **The absent price list.** This segment searches price first, and `/cennik` is currently `noindex` with placeholder rates. See §7. |
| **Site meets them at** | `/uslugi/przygotowanie-scian-pod-tapete`, `/uslugi/zdjecie-starej-tapety`. |

### 3.4 Tertiary — the German or English-speaking client

Real but small, and the only reason to keep three locales. Expats, foreign-owned
commercial property, and German-speaking designers specifying into Poland. Worth
the translated slugs shipped in this pass; **not** worth further investment
until analytics show the traffic exists.

### 3.5 Who is explicitly *not* the customer

Anyone searching to **buy** wallpaper. This is the disqualification the old
gallery titles failed to make, and it is now made in copy on every category page
and on `/uslugi`.

---

## 4. Search landscape

### 4.1 The intent split (observed)

| Query type | Example | Who ranks | Can Neatual compete? |
| --- | --- | --- | --- |
| Product | `fototapety kwiatowe` | ❌ 9/9 e-commerce: [tapetuj.pl](https://tapetuj.pl/category/fototapety-kwiaty), [4wall.pl](https://4wall.pl/259_fototapety-w-kwiaty), [feeby.pl](https://feeby.pl/fototapety/kwiaty), [swiat-obrazow.pl](https://www.swiat-obrazow.pl/fototapety-kwiaty.html), [decorlabs](https://decorlabs.pl/fototapety-rosliny-i-kwiaty) | **No, and should not try.** Wrong intent even if won. |
| Service + city | `tapetowanie ścian Warszawa` | ✅ Contractors: [haloremont](https://haloremont.pl/uslugi/tapetowanie-scian-wnetrz/), [milokolor](https://milokolor.com/oferta/tapetowanie/), [przyklejam.pl](https://przyklejam.pl/), [VERSO](https://www.versomalowania.pl/tapetowanie-warszawa/), [Anmar](https://anmarubieramywnetrza.com/montaz-tapet-warszawa/) | **Yes** — same class of business. |
| Service + price | `cennik tapetowania`, `ile kosztuje położenie tapety` | ⚠️ Mixed: aggregators ([Fixly](https://fixly.pl/kategoria/tapetowanie), [Zleca](https://zleca.pl/cennik/tapetowanie-scian-cena), [cennikremontow](https://cennikremontow.pl/tapetowanie-cennik/)) and contractor price lists | **Yes, once rates exist.** Blocked today. |
| Material | `tapeta flizelinowa montaż` | ⚠️ Manufacturer/retailer how-to guides, thin on contractors | **Likely yes** — see §7.1. |
| How-to | `jak kleić tapetę` | Retailer blogs and YouTube | Low priority: teaches the visitor to not need Neatual. |

### 4.2 What competitors publish that Neatual did not

Observed on the contractor sites above: a per-service page, a published rate
card, a city page, and a warranty statement (VERSO publishes 24 months).
Neatual had **none of the four**. This pass adds the first. §7 covers the rest.

### 4.3 The honest limit of the gallery keywords

The rewritten category pages target phrases like `montaż fototapet kwiatowych`.
**Estimated volume: very low.** Nobody searches for a floral installer by motif.

That is accepted deliberately. The category pages are not a volume play; they
are there to (a) stop competing with e-commerce for the wrong visitor, (b) rank
for long-tail combinations, and (c) pass relevance to `/uslugi/*`, which is
where the volume is. **If a page here has to be justified by its own traffic,
it cannot be. It is justified as proof and as internal-link structure.**

---

## 5. What changed in this pass

### 5.1 Gallery categories reframed from product to service

`app/lib/inlineCopy.js` — `PRODUCTS`

| Before (product intent) | After (service intent) | New Polish URL |
| --- | --- | --- |
| Fototapety kwiatowe | Montaż fototapet kwiatowych | `/galeria/montaz-fototapet-kwiatowych` |
| Motywy tropikalne | Montaż fototapet tropikalnych | `/galeria/montaz-fototapet-tropikalnych` |
| Fototapety artystyczne | Montaż fototapet artystycznych | `/galeria/montaz-fototapet-artystycznych` |
| Pejzaże | Montaż fototapet z pejzażem | `/galeria/montaz-fototapet-z-pejzazem` |
| Wzory geometryczne | Montaż tapet geometrycznych | `/galeria/montaz-tapet-geometrycznych` |
| Tapety strukturalne | Montaż tapet strukturalnych | `/galeria/montaz-tapet-strukturalnych` |

✅ Each also gained a **distinct `intro` paragraph**. Before this, all six shared
one identical pair of description lines and had no intro, so their entire textual
difference was the heading — six near-duplicate pages, which is the thin-content
pattern that suppresses all of them rather than just the weakest.

The intros describe craft (pattern layout, striking a vertical, keeping a
horizon level, substrate showing through texture). ✅ **No material, price,
dimension, timescale or certification is claimed anywhere**, per the standing
rule in the `neatual-copy` skill.

### 5.2 Slugs translated per locale

`app/lib/seo.js`, `sanity/schemas/product.js`, `sanity/schemas/service.js`

Previously one Polish slug served all three locales
(`/de/galerie/kwiatowe`). Now each locale has its own:

```
PL  /galeria/montaz-fototapet-kwiatowych
EN  /en/gallery/floral-mural-installation
DE  /de/galerie/montage-blumen-fototapeten
```

This was the tradeoff the old comment in `seo.js` deferred. It was taken now
because the category pages shipped on **2026-08-12, one day before this pass** —
they carry no index equity, so the change costs nothing today and would cost
real redirects in three months.

Three identifiers now exist and are deliberately independent:

| Field | Role | Changes when |
| --- | --- | --- |
| `slug` | reference id; what service pages point at | never |
| `slugs.{pl,en,de}` | the published address | an editor rewrites a URL |
| `imageBase` | folder under `public/gallery` | images are moved |

✅ Old URLs 301 rather than 404 — verified in served output:

| Request | Response |
| --- | --- |
| `/galeria/kwiatowe` | 301 → `/galeria/montaz-fototapet-kwiatowych` |
| `/en/gallery/kwiatowe` | 301 → `/en/gallery/floral-mural-installation` |
| `/de/galerie/pejzaze` | 301 → `/de/galerie/montage-von-landschafts-fototapeten` |
| `/galeria/floral-mural-installation` | 301 → `/galeria/montaz-fototapet-kwiatowych` |
| `/galeria/nonsense` | 404 |

### 5.3 A services section, which the site did not have

`app/routes/uslugi.jsx`, `app/routes/uslugi_.$slug.jsx` + four locale re-exports

Hub at `/uslugi` · `/en/services` · `/de/leistungen`, plus six pages:

| Page | Polish slug | Backed by |
| --- | --- | --- |
| Montaż fototapet | `montaz-fototapet` | `PRICING` row `mural` |
| Montaż tapet wzorzystych | `montaz-tapet-wzorzystych` | `PRICING` row `standard` |
| Przygotowanie ścian pod tapetę | `przygotowanie-scian-pod-tapete` | `PRICING` row `preparation` |
| Zdjęcie starej tapety | `zdjecie-starej-tapety` | `PRICING` row `removal` |
| Tapetowanie sufitów i ścian wysokich | `tapetowanie-sufitow-i-scian-wysokich` | `PRICING` note 2 |
| Tapetowanie wnętrz komercyjnych | `tapetowanie-wnetrz-komercyjnych` | home page body copy |

**Every service names a row in the price table** (`pricingKey`). That tie is
enforced by a test: a page promising work nobody has priced fails CI. It is the
guard against this section quietly growing into services the business does not
perform.

`services` was added to `PAGE_KEYS`, so the hub is in the nav, the sitemap and
the hreflang set automatically. Nav order is now
**Główna → Usługi → Galeria → Cennik → Kontakt**, which is the funnel: what we
do, what it looks like, what it costs, how to reach us.

### 5.4 Internal linking — hub and spoke

Previously the six category pages linked *up* to the gallery index and to
nothing else. Now, verified in served output:

- `/uslugi/montaz-fototapet` → four category pages, `/cennik`, `/uslugi`
- `/galeria/montaz-fototapet-kwiatowych` → `/uslugi/montaz-fototapet`, `/galeria`

Links are resolved from reference ids at render time, so renaming a category's
URL in the Studio cannot leave a dead link.

### 5.5 Structured data

A `Service` node is emitted on the six service pages, with `provider` pointing at
the existing `Organization`/`LocalBusiness` `@id`. ⚠️ It deliberately carries **no
`offers` or `priceSpecification`** — publishing the placeholder rates as machine-
readable data is exactly how a fabricated price reaches a search result. Revisit
with §7.2.

### 5.6 Everything on the page made editable in the Studio

Two sets of strings rendered on live pages but ignored the CMS entirely — they
came from `app/lib/inlineCopy.js` no matter what the Studio said, so changing
them needed a deploy:

| String | Renders on | Now |
| --- | --- | --- |
| `Co wchodzi w zakres` / `Zobacz realizacje` / `Zobacz cennik montażu` / `Wszystkie usługi` | all six service pages | `siteSettings.serviceLabels` |
| `Zakres` / `Jednostka` / `Stawka` | the price table (pre-existing gap) | `page-pricing.pricingColumns` |

Both resolve **per key**, so a partly filled set in the Studio falls back label
by label rather than discarding the whole group.

⚠️ One string remains deliberately non-editable: `pricing.placeholderNotice`,
the notice declaring the rates fabricated. A field whose entire job is to say
"these numbers are not real" must not be clearable from the Studio.

`scripts/seed-sanity.mjs` was split, with the document builders moved to
`scripts/seed-documents.mjs`. The script exits the process when its environment
is unset, which a test cannot do; the builders are now importable, which is what
makes §8's coverage proof possible.

### 5.7 Sitemap

33 → **51 URLs** (5 pages + 6 categories + 6 services, × 3 locales), each with a
full reciprocal hreflang set plus `x-default`. ✅ Verified against served
`/sitemap.xml`.

---

## 6. What is in good shape (do not re-litigate)

| Area | State |
| --- | --- |
| hreflang | ✅ Reciprocal across all three locales including the translated slugs; `x-default` → Polish, verified per-URL in the sitemap and in `<head>`. |
| Canonicals | ✅ Correct, trailing slash normalised. |
| 404 vs soft 404 | ✅ Unknown slugs return a real 404, not 200-with-empty-page. |
| Sitemap ↔ routes | ✅ Test derives the URL set from the route files, so a new route that misses the sitemap fails CI. |
| Structured data | ✅ `@graph` with `@id` references; omits `openingHours`, `geo`, `sameAs`, `priceRange` because none are known. Correct call — leave it. |
| Placeholder pricing | ✅ `noindex` on `/cennik` lifts itself when `pricingIsPlaceholder` is turned off. Nothing to remember to undo. |
| CMS fallback | ✅ Sanity outage degrades to bundled copy rather than taking the site down. |
| Alt text | ✅ Describes the photograph, not the product line. |

---

## 7. Open items, in the order worth doing them

### 7.1 Confirm material capability, then build the material pages — **highest value**

`tapeta flizelinowa`, `winylowa`, `tekstylna` are how contractors are searched
for, and the SERP is thin (retailer how-to guides, few contractors). One source
puts specialist coverings — textile, suede, felt, grasscloth, flock, quartz —
at **90 zł+/m² against 70–80 for standard**, so this is both the highest-volume
and the highest-margin opening on the list.

❌ **Not built in this pass, deliberately.** Nothing in the codebase says Neatual
hangs these materials, and a page claiming it would be an invented capability —
the one thing the copy rules forbid without exception.

**Needed from the business:** which of flizelina, winyl, tekstylia, raufaza and
grasscloth do you actually work with? Each confirmed one is a page.

### 7.2 Publish real rates

Blocks ICP 3.3 (homeowners), who search price first. `cennik tapetowania` has a
real contractor SERP that Neatual is absent from. The page, the notice and the
`noindex` are all wired and lift themselves the moment `pricingIsPlaceholder`
goes false with real numbers behind it.

### 7.3 Google Business Profile + local signals

Not a code change and probably worth more than anything below it. A verified
profile at the Żelków-Kolonia address, service areas listed, gallery photos
attached. Then add `sameAs` and `geo` to the `Organization` node — currently
omitted, correctly, because nothing to point at exists.

### 7.4 City pages — **not yet**

Tempting (`/montaz-tapet/warszawa`, `/siedlce`, `/lublin`) and the pattern
competitors use. ❌ Deliberately not built.

With one address, six shared photo sets and no per-city work to show, city pages
would be swapped-name duplicates — textbook doorway pages, which Google acts
against directly. **The unlock is per-city proof, not a template.** Once there
are photographed jobs in three or four named cities, build one page per city
around *those photographs*, and no others.

### 7.5 Case studies / realisation write-ups

The natural next content layer and what would make 7.4 legitimate. One page per
notable job: the interior, the covering, the problem, the photographs. Feeds
designers (ICP 3.1), who buy on evidence of craft.

### 7.6 A warranty statement

A competitor publishes 24 months. If Neatual offers one, it belongs on
`/uslugi`. ⚠️ Requires the business to state it — do not invent a term.

---

## 8. What is enforced automatically

| Gate | Runs in CI | Note |
| --- | --- | --- |
| Sitemap covers every route | ✅ | Derived from route filenames; a new dynamic route with no registered collection throws a named error rather than silently passing. |
| Reciprocal hreflang + `x-default` | ✅ | Per-URL, all 51. |
| Slug present and valid in all 3 locales | ✅ | Added this pass. |
| No slug collisions within a collection/locale | ✅ | Added this pass. |
| Reference id never appears in a published URL | ✅ | Added this pass; catches a document seeded without translated slugs. |
| Old/foreign slug redirects rather than 404s | ✅ | Added this pass. |
| Every service maps to a price list row | ✅ | Added this pass — the guard against unpriced promises. |
| Every service→category reference resolves | ✅ | Added this pass. |
| **Every rendered string is CMS-editable** | ✅ | `test/cms-coverage.spec.js`. Overrides the whole dataset with sentinels and fails on anything still showing bundled copy. Exemptions carry a written reason. |
| **Seeder reproduces the fallback exactly** | ✅ | Same file. Catches a field added to one source and not the other. |
| **All three locales complete** | ✅ | `test/i18n.spec.js`. Same field set, no empty strings, no prose identical in all three, no Polish diacritics in en/de. |
| CMS ↔ bundled copy agree | ⚠️ | `pnpm content:check`. **Not in CI**, and currently failing by design — see §9. |
| Lighthouse budgets | ✅ | `lighthouserc.cjs`. ⚠️ Green partly because the new pages are text-only and cheap; not evidence the gallery got faster. |

**Headline counts, for the next pass to diff against:**
sitemap URLs 33 → **51** · indexable service pages 0 → **7** · category pages
with unique body copy 0 → **6** · tests 42 → **63** · strings rendered but not
CMS-editable 7 → **1** (that one deliberate).

Both new guards were mutation-tested rather than assumed: reverting a field to
bundled-only, blanking a German label, and pasting Polish into a German field
each produced a failure naming the exact path.

---

## 9. Required follow-up before deploy

⚠️ **Sanity must be reseeded.** The dataset does not have the `service`
documents, the translated `slugs`, the new category copy, a `page` document for
`services`, or the two newly editable field groups (`serviceLabels`,
`pricingColumns`). `pnpm content:check` reports a large number of differing
fields, which is expected: the code is the source of truth for this change and
the CMS has not caught up. Until it is reseeded the site serves the correct new
copy from the bundled fallback, but Studio edits are ignored.

```bash
pnpm seed:sanity:import      # rewrites Sanity from app/lib/inlineCopy.js
pnpm content:check           # must print ✓ before deploying
```

⚠️ **`seed:sanity:import` overwrites Studio edits.** Confirm nothing was edited
in the Studio since the last seed before running it. If something was, pull it
first with `pnpm content:pull`.

📄 **Pre-existing, unrelated:** the `pricing` page document is *also* missing from
Sanity — the site has been falling back to bundled copy for it since before this
pass. The reseed fixes that too.

**After deploy:** resubmit `/sitemap.xml` in Search Console. The 18 old category
URLs 301 correctly, so no removal requests are needed.
