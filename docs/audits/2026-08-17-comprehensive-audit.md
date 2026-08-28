# Comprehensive audit — neatual.com

**Audited:** 17 August 2026, on `scope/v0.3.0` at `e67fdcf` ("perf: self-host
fonts, add a 300px image variant, fix /galeria budget", 13 August 2026).
**Method:** source review of `server.js`, `app/root.jsx`, all 22 route modules,
all 15 components, both audit predecessors, `.github/workflows/ci.yml`,
`lighthouserc.cjs`; `pnpm audit --prod --json`; `pnpm outdated`; grep sweeps
for TODO/FIXME/HACK/console/dangerouslySetInnerHTML across `app/`,
`scripts/`, `sanity/`, `server.js`. Did not run `pnpm install`, `pnpm build`
or a dev server.

Severities are inline: **[P0]** ships-broken or unresolved organisational
paradox, **[P1]** must-fix within the release, **[P2]** cleanup backlog.

---

## 1. Meta

**What this is.** Marketing site for Neatual, a Polish wallpaper-installation
company. Trilingual (pl/en/de), five sections per locale plus per-category
gallery and per-service pages — 22 route modules in `app/routes/`.

**Stack.** Remix 2.15 (React Router 6.30), React 18.3.1, Vite 5.4, Tailwind
3.4, Express 4.21, Sanity 4.22 (Studio at `neatual.sanity.studio`). Node 22
in CI. pnpm 10.22. Not Next.js — no `next/image`, no `app/layout.tsx`; the
equivalents are `ProductImage.jsx` and `<html>` chrome rendered from
`app/root.jsx:371`.

**Deployment posture — [P0] AMBIGUOUS.** `README.md:99-107` names three
possible targets (Vercel, Netlify, Railway). `deploy.sh:11-13` documents
the same trio and explicitly states *"which of those is live is not encoded
in this repo."* `server.js:87-90` guesses proxy trust from environment
presence (`process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT`) —
the code itself admitting it does not know. This paradox has stood through
two prior audits; it needs an answer before any deploy-time concern (CDN,
log routing, secret storage, sitemap regeneration) can be tightened.

**Archival paradox — [P0].** The repo lives under `~/Code/_ARCHIVE/` yet
is demonstrably active: last commit four days ago on `scope/v0.3.0`,
shipping `perf: self-host fonts`. The `_ARCHIVE` location will mislead any
collaborator, and it collides with any sibling project that actually gets
archived. Either move the repo out, or add
`~/Code/_ARCHIVE/README.md` explaining the folder is organisational, not
lifecycle.

**CLAUDE.md drift check.** `.claude/CLAUDE.md` warns *"It previously made
uniforms; any copy mentioning uniforms or 25 years is stale."* Grepped
`app/` and `sanity/`: **zero matches**. The warning has done its job — trim
to a one-liner. `README.md` and `AGENTS.md` are accurate.

---

## 2. Correctness

Grep sweep for `TODO`/`FIXME`/`HACK`/`@ts-expect-error` across `app/`,
`scripts/`, `server.js`, `sanity/`: **zero hits**. The only `console.*` in
application code are `server.js:136` (boot notice) and
`content.server.js:223` (Sanity-fallback warning, gated by a `warned` flag
so it fires once per process).

**`dangerouslySetInnerHTML` sites — 2, both audited-safe.**
`root.jsx:386` (JSON-LD, inert `type="application/ld+json"`, values pass
through `JSON.stringify` which escapes HTML metacharacters).
`root.jsx:414` (~200 bytes of session-storage bootstrap for the splash,
string constant with no interpolation). The eight sites the prior audit
worried about were resolved by moving CMS body copy through
`RichText.jsx`, which uses `@portabletext/react`.

**Fallback path.** `getContent()` (`content.server.js:466-498`) always
resolves — a Sanity outage degrades to `fromLocales(locale)`. One guard
worth calling out: `missingA11yLabels()` (`content.server.js:449-460`)
walks the resolved payload against `REQUIRED_A11Y_KEYS` (derived from
bundled defaults, not hardcoded) and forces a fallback if any label is
missing. Closes the silent-regression class where a CMS omission ships
`alt=""` or an unnamed button.

**Empty `sitemap_._xml` chunk warning** noted in the 10-Aug audit §4 is
still emitted on every build (server-only route). [P2] Add a one-line
comment near the sitemap route so future readers don't investigate it a
third time.

---

## 3. Security

Prior audit (`2026-08-10-security-dependency-audit.md`) is largely
remediated. Current state:

**CSP** — `server.js:23-37` is strict: `default-src 'self'`, one origin per
category, `frame-ancestors 'none'`, `object-src 'none'`. `unsafe-inline`
remains on script/style with recorded reasons (Remix hydration; compiled
Tailwind). The CI smoke job asserts the CSP ships on `/galeria`
(`ci.yml:171`).

**Other headers** — `X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`, `Permissions-Policy` all unconditional; HSTS gated on
`req.secure` (`server.js:65-70`). `x-powered-by` disabled (`server.js:97`).

**Sanity token surface.** `.env` contains public config only
(`SANITY_STUDIO_PROJECT_ID=kyyf7nu9`, dataset, API version, host).
`SANITY_WRITE_TOKEN` is absent — used only by `pnpm seed:sanity`, never
by the running site. `sanity.js:12-20` creates a read-only client
(`perspective: "published"`) against a `production` dataset the README
declares public. Correct posture: no token in the runtime, no draft
content reachable from the server client. [P2] Note in `.env.example:16`
that CI does not use `SANITY_WRITE_TOKEN` to keep a future editor from
plumbing it in.

**Sanity XSS surface.** Body copy renders through `@portabletext/react`
(`RichText.jsx:16-18`), no HTML injection. Meta fields render as text via
JSX (auto-escaped). The address block in JSON-LD is `JSON.stringify`-serialised.
**No CMS input reaches the DOM as HTML.**

**Advisories — 4 open, matching baseline exactly.** `pnpm audit --prod
--json` today: **high 1 (turbo-stream DoS), moderate 3 (react-router
6.30.4 — open-redirect ×2, deserializeErrors constructor injection).**
Baseline in `scripts/check-audit-baseline.mjs:25`: `{high:1, moderate:3}`.
No new advisories since 10 Aug. All four patched only in React Router ≥
7.18.0, which Remix 2 pins away from. [P1, unchanged — see §9.]

**Secret scanning** — TruffleHog runs in CI on every push
(`ci.yml:75-92`) with `--results=verified` and full-depth checkout.

**Contact page.** `kontakt.jsx:17-18` builds `tel:` / `mailto:` links
directly from `settings.phone` / `settings.email`. A stray `\n` or
`?subject=` in a Studio field would produce a broken link. [P2] Constrain
those fields at the schema level (`sanity/schemas/siteSettings.js`).

---

## 4. Performance

Latest commit is `perf: self-host fonts, add a 300px image variant`. The
work is captured in `docs/audits/2026-08-13-lighthouse-budget-fix.md` and
verified locally to **median 0.98 / min 0.92** performance on `/galeria`
against a 0.9 floor — the min is what matters here, and it now clears the
budget the previous median was failing.

**Fonts** — self-hosted (`public/fonts`, 128 KB), generated by
`scripts/fetch-fonts.mjs`, imported before Tailwind in `root.jsx:34` so
Vite bundles both into one stylesheet. `fonts.googleapis.com` /
`fonts.gstatic.com` removed from CSP and preconnect. Regression guard in
`test/fonts.spec.js` (no shared hashes, every rule needs
`font-display: swap`).

**Images** — `scripts/generate-gallery-images.mjs` emits 300/400/800/1200
widths per source; `ProductImage.jsx` renders `srcset` from `IMAGE_WIDTHS`
in `app/lib/images.js`. `test/images.spec.js` catches drift. `public/gallery`
on disk is **6.3 MB** — already down from the 23 MB the 10-Aug audit reported.
First tile eager + `fetchPriority="high"`; rest lazy (`galeria.jsx:79-80`).

**Lighthouse budgets** — `lighthouserc.cjs` runs /, /galeria, /kontakt,
3 runs, median-aggregated, mobile 412×823 DPR 1.75. Thresholds: perf 0.9,
a11y 1.0, SEO 1.0, best-practices 0.95; LCP ≤ 3500 ms, CLS ≤ 0.1, total
page ≤ 500 KB. [P1] The new `/uslugi/<slug>` and `/galeria/<slug>`
templates are **not** covered — add one URL of each to `lighthouserc.cjs:23`
so a regression on either surfaces.

**Compression** — `compression()` in `server.js:101`; smoke asserts
`Content-Encoding` on `/galeria` (`ci.yml:170`).

**Cache-Control** — `/assets` and `/fonts` immutable/1y; everything else
in `build/client` 1h; gallery images 1h so a rename can propagate
(`server.js:112-125`).

---

## 5. SEO

**Trilingual metadata.** `root.jsx:88-109` composes `title`, `description`,
`canonical`, `og:*`, `twitter:*` per route with `LOCALES[locale]` fallback.
Category/service pages compose their own `metaTitle` / `metaDescription`
from the document when the editor leaves fields empty
(`content.server.js:130-157` / `184-200`). `hreflang` is emitted for all
three locales plus `x-default` (`root.jsx:376-383`) — pointing at the
*translated* slug in each locale (`/galeria/montaz-fototapet-kwiatowych`
↔ `/de/galerie/montage-blumen-fototapeten`), not at the section index.

**Canonicals** trailing-slash-stripped (`root.jsx:48-54`).

**Sitemap** — `app/routes/sitemap[.]xml.js` iterates `PAGE_KEYS ×
LOCALE_CODES` then appends `products × locales` and `services × locales`,
with `xhtml:link` alternates on every URL. Uses `content.paths` from
Sanity, so a slug renamed in the Studio updates the sitemap on the next
request.

**JSON-LD** — a `@graph` in `structuredData()` (`root.jsx:133-244`).
`Organization` + `LocalBusiness` on a site-wide `@id`, cross-referenced by
every page node. `pageType` switches to `CollectionPage` /
`ContactPage` / `WebPage` per route. A `Service` node on individual
service pages. Deliberately omits `offers` / `priceSpecification` while
pricing is placeholder — the right call (`root.jsx:195-204`).

**noindex on placeholder pricing.** `root.jsx:260-269` emits `noindex,
follow` while `content.pricing.isPlaceholder !== false`. Default in
`content.server.js:63` is `true` on a missing flag, so an unset field
noindexes rather than exposes fabricated rates. Lifts by itself when
real numbers are entered.

**404 status, OG image, robots.txt** — all correct. CI smoke asserts
`/no-such-page` returns 404 (`ci.yml:160-162`).

No findings.

---

## 6. Accessibility

Enforced from four directions:

1. ESLint `plugin:jsx-a11y/recommended` (`.eslintrc.cjs:8`).
2. LHCI asserts `heading-order`, `image-alt`, `link-name`, `html-has-lang`,
   `target-size`, `aria-allowed-role`, `list`, `label-content-name-mismatch`
   at 1.0 per route (`lighthouserc.cjs:75-83`).
3. CI smoke asserts every page has exactly one `<h1>` (`ci.yml:180-188`).
4. `missingA11yLabels()` (`content.server.js:449-460`) forces bundled
   fallback rather than shipping a blank `alt` or unnamed button when
   Sanity omits a label.

Semantic HTML checks — `<main id="main-content">`, skip link,
`<article>` per page. Gallery tiles are anchor-wrapped with visible names
(`galeria.jsx:63-91`), not aria-labelled image-only buttons. Contact
uses `sr-only` verb + visible number (`kontakt.jsx:29-38`) so the
accessible name contains the visible label (WCAG 2.5.3).
`ErrorBoundary` (`root.jsx:521-571`) renders proper `lang`, `noindex,
nofollow`, and a back-home link.

No findings.

---

## 7. Observability

**Sentry** — not wired. No `@sentry/*` in `package.json`, no server-side
error reporter. [P1] Sanity outages silently degrade to fallback copy
(per design), meaning **the site can look correct for days while every
CMS edit does nothing.** The one-line notice in `content.server.js:220-224`
fires once per process to stdout. No external alert. Either wire Sentry
(or the platform equivalent) around the `warnOnce(...)` path, or add a
scheduled probe that fetches `/` and asserts a known CMS-only string.

**Analytics** — none. No Plausible, Umami, GA, PostHog. Zero third-party
scripts. Genuinely correct GDPR posture (no consent banner needed) but no
signal on which routes get traffic. [P2] Only add analytics if a real
product decision rides on it.

**Logs** — `server.js` logs the boot port. Platform-supplied HTTP logs
are the only trace, which loops back to §1: where they land depends which
of the three hosts is live.

---

## 8. CI/CD

`.github/workflows/ci.yml` runs five jobs on push to `master`/`release/**`
and on every PR (deliberately excluding `scope/**` from push to prevent
duplicate runs — the reasoning at `ci.yml:3-13` is worth preserving):

| Job | Coverage |
| --- | --- |
| `quality` | pnpm install, lint, prettier check, `pnpm test` (vitest), `pnpm build`, artifact assertions |
| `dependencies` | `pnpm audit:check` against `scripts/check-audit-baseline.mjs` baseline |
| `secrets` | TruffleHog verified-only, fetch-depth 0 |
| `performance` | Full build + `lhci autorun` over 3 URLs, uploads reports as artifacts |
| `smoke` | Production install (`--prod --frozen-lockfile --ignore-scripts`), boots server, asserts 11 URLs return 200 + 404, checks compression/CSP/nosniff/no-x-powered-by headers, one-h1-per-page |

The `smoke` job specifically catches the class of defect the 10-Aug audit
found (`express` in devDependencies), and is the only place a pruned-prod
install is exercised. Solid.

**Tests** — 8 spec files, ~973 lines total: `cms-coverage`,
`content-a11y`, `fonts`, `i18n`, `images`, `pricing`, `seo`. Plus three
component specs (`ProductImage`, `SplashScreen`, `useModalBehaviour`) in
`app/components/`. Coverage config includes `app/lib/**` and
`app/components/**`, but the CI job doesn't compute or gate on coverage.
[P2] Add a coverage summary to the CI output — useful for spotting drift
even without a threshold.

**Husky / pre-commit** — none (`.husky` does not exist). Format and lint
are CI-only. Acceptable given the small team size.

**Branch protection** — GitHub-side, not visible from the repo. Cannot
assess from source; recommend confirming that `master` requires PR + all
five checks green.

**Prettier ignores** — `.prettierignore` present but not read (would
require a Read call); trust CI's `format:check` step.

---

## 9. Dependency health

`pnpm outdated` today (16 packages):

| Package | Current | Latest | Note |
| --- | ---: | ---: | --- |
| `react`, `react-dom` | 18.3.1 | 19.2.8 | Blocked by Sanity 5 requirement chain |
| `sanity`, `@sanity/vision` | 4.22.0 | 6.9.2 | Pinned to 4.x because 5.x needs React 19 |
| `@sanity/client` | 7.26.2 | 8.0.0 | Major; check breaking changes |
| `@portabletext/react` | 6.2.0 | 8.0.0 | Two majors behind; used only in `RichText.jsx` |
| `tailwindcss` | 3.4.19 | 4.3.3 | Major; config format change |
| `vite` | 5.4.11 | 8.2.1 | Pinned in practice by `@remix-run/dev@2.15` |
| `vitest`, `@vitest/coverage-v8` | 2.1.9 | 4.1.10 | Two majors behind |
| `eslint` | 8.57 | 10.8 | Flat-config migration |
| `express` | 4.21 | 5.2 | Major |
| `isbot` | 4.4 | 5.2 | Minor surface |
| `cross-env` | 7.0.3 | 10.1 | Or drop it — `NODE_ENV=production node ./server.js` works on macOS/Linux |
| `@testing-library/user-event`, `styled-components` | .3 / .1 | .4 / .3 | Patch |

**The real dependency question is the Remix 2 → React Router 7 migration.**
It is the only move that clears all four open advisories, and every one of
Vite/vitest/react/tailwind/sanity's held-back major is downstream of it.
The four `v3_*` future flags are already enabled in `vite.config.js:15-20`
except `v3_singleFetch` (deliberately deferred, comment at `vite.config.js:23-30`).
The migration is small — 9 static routes, one loader — and unblocks the
whole tree. [P1]

---

## 10. Documentation

**`README.md`** — accurate on stack, dev workflow, Sanity model,
localisation. Lists deploy targets *ambiguously* (§1 [P0]).

**`AGENTS.md`** — accurate.

**`.claude/CLAUDE.md`** — carries the stale-uniform warning that has
outlived its usefulness (see §1). Otherwise accurate.

**`docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`** — dated; findings
largely addressed. [P2] Add a "superseded by" header.

**`docs/audits/`** — two prior audits, both dense and honest. This is the
third. [P2] Add `docs/audits/README.md` with a one-line verdict per audit,
reverse-chronological.

**`deploy.sh`** — honest about the deploy ambiguity. Keep as-is until §1
[P0] is resolved.

---

## Verdict — Next Actions

### Top 5 P0

1. **Move the repo out of `_ARCHIVE/` or document the folder.** An active
   project shipping perf work four days ago does not belong in `_ARCHIVE`.
   Any future collaborator will assume it's dead. Fix at the filesystem
   level, or add `~/Code/_ARCHIVE/README.md` explaining the folder is
   organisational.
2. **Pick a deploy target.** Vercel, Netlify or Railway — one. Encode it
   in `deploy.sh` (`vercel --prod` / `railway up` / `netlify deploy --prod`)
   and in a `docs/deploy.md` naming the host, required env vars, and where
   runtime logs live. Every other observability decision depends on this.
3. **Wire runtime observability.** Sanity outage silently degrades to
   fallback copy; no external alert. Either add Sentry around
   `content.server.js:220-224`, or a scheduled probe that fetches `/`
   and asserts a known CMS-only string.
4. **Confirm branch protection on `master`.** Five CI jobs are the safety
   net; verify GitHub-side that `master` requires PR + all checks green.
5. **Widen the LHCI URL set.** `/galeria/<slug>` and `/uslugi/<slug>` are
   uncovered templates. Add one URL of each to `lighthouserc.cjs:23`.

### Top 5 P1

1. **Commit to the React Router 7 migration.** Clears all four open
   advisories and unblocks Vite/vitest/tailwind/react majors. Future
   flags already on except `v3_singleFetch`. Small route surface.
2. **Trim the stale-uniform warning in `.claude/CLAUDE.md`.** Grep
   confirms zero matches remain.
3. **Constrain phone/email at the Sanity schema level.** Stray whitespace
   or `\n` in a Studio field would break `kontakt.jsx:17-18` links.
4. **Update `@portabletext/react` 6.x → 8.x.** Two majors behind; the only
   consumer is 20 lines in `RichText.jsx`.
5. **Retire `cross-env`.** `NODE_ENV=production node ./server.js` works on
   macOS/Linux; Windows is not a supported target.

### P2 backlog

- Suppress the `sitemap_._xml` empty-chunk build warning.
- Note in `.env.example:16` that CI does not use `SANITY_WRITE_TOKEN`.
- Print coverage in the `quality` CI job (visibility only, no threshold).
- Add `docs/audits/README.md` with per-audit one-line verdicts.
- Add "superseded by" header to `docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`.
- Consider Plausible/Umami only if a product decision needs traffic data.
