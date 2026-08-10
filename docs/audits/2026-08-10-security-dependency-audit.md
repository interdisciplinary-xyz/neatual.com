# Security & dependency audit — neatual.com

**Audited:** 10 August 2026, on `scope/v0.1.0` (`a15d00d`)
**Method:** source review of every route, component and the Express server;
`pnpm audit --prod`; `pnpm outdated`; response-header inspection against the
production build (`NODE_ENV=production node ./server.js`); and a grep of `app/`
for forms, cookies, storage, env access and third-party origins.

> **Verdict: passes on exposure, fails on posture.** There is very little here to
> attack, and correspondingly little defending it.
>
> **The attack surface is close to zero and that is a real result.** Grepped and
> confirmed: **no forms, no `<input>`, no `document.cookie`, no `localStorage`,
> no `sessionStorage`, no `process.env` reads outside `NODE_ENV`, no auth, no
> database, no API routes, no analytics, and exactly one third-party origin**
> (Google Fonts CSS). There are no secrets in this repository because there is
> nothing that needs one.
>
> **P1 — `pnpm start` depends on two devDependencies.** `server.js:2` imports
> `express`, and the `start` script shells out to `cross-env`. Both are declared
> under `devDependencies`. A production install (`pnpm install --prod`) followed
> by the documented `pnpm start` cannot work — `express` will not be on disk.
> It runs today only because every install so far has been a full one.
>
> **P2 — no security headers, at all.** Measured on the built server: no
> `Content-Security-Policy`, no `Strict-Transport-Security`, no
> `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy`, no
> frame policy. What *is* sent is `X-Powered-By: Express`.
>
> **P2 — 4 advisories, none of them fixable from Remix 2.** One high, three
> moderate, all in React Router, all patched only in `react-router >= 7.18.0` —
> a major version Remix 2.17.5 cannot use. This is a framework-lifecycle
> decision, not a `pnpm update`.

> **Remediation, 10 August 2026 (same day), `c41cc7e`…`6737b92`.** Findings
> below describe the state at audit time. Fixed since:
>
> - **P1** — `express` and `cross-env` moved to `dependencies`, and CI now
>   prunes to a production install and boots the server the way a host does,
>   which is the only check that would have caught this.
> - **P2** — all six security headers now sent (`nosniff`, `Referrer-Policy`,
>   `X-Frame-Options`, `Permissions-Policy`, CSP, HSTS), verified against the
>   built server with zero CSP violations and hydration intact. HSTS is gated on
>   a genuinely secure request: Chrome treats localhost as trustworthy, so an
>   unconditional header pinned localhost to https for two years in the
>   developer's browser.
> - **P3** — `X-Powered-By` disabled; `deploy.sh` no longer pretends to deploy;
>   four of the five future-flag warnings cleared; two of the eight
>   `dangerouslySetInnerHTML` sites removed by replacing the product
>   description HTML string with an array of lines.
>
> **Not fixed.** The four advisories in §1 stand — they are patched only in
> React Router 7, which Remix 2 cannot use, so they remain a framework-lifecycle
> decision. `pnpm audit` still runs in no CI job. The remaining six
> `dangerouslySetInnerHTML` sites are now partly the CMS integration's concern
> rather than a hardcoded-module one, and should be re-assessed against it —
> the reason they were safe (no user or network input) stops holding the moment
> content comes from Sanity.

**Legend:** ✅ verified · ⚠️ works, with a caveat · ❌ failing · 📄 source-verified only

---

## 1. Findings

### P1 — production runtime depends on `devDependencies` ❌ 📄

`package.json:33-36`, `server.js:2`, `package.json:11`

```json
"start": "cross-env NODE_ENV=production node ./server.js",
…
"devDependencies": { "cross-env": "^7.0.3", "express": "^4.21.0", … }
```

`server.js` imports `express` at module scope and `@remix-run/express` (a real
`dependency`) is useless without it. `cross-env` is the entry point of the
documented production command. Both live under `devDependencies`.

Consequence: the deployment path the README describes —
*"Build: `pnpm build` / `pnpm start`"* — breaks the moment anyone installs with
`--prod`, `NODE_ENV=production`, or on a platform that prunes dev dependencies
after build (Railway and Netlify both do by default; Vercel's Node builder does
for the runtime bundle). The failure is `ERR_MODULE_NOT_FOUND: express`, at
boot, with no build-time warning.

Marked 📄 because it was verified by reading `package.json` and `server.js`, not
by running a pruned install — doing so would have destroyed the `node_modules`
the rest of this audit measured against.

**Fix:** move `express` and `cross-env` into `dependencies`. `@remix-run/dev`,
`vite`, `tailwindcss` and `eslint` are correctly placed and should stay.

### P2 — no security headers on any response ❌

`server.js:11-20`

Measured against the production build (`curl -D -`), on both an HTML document
and a static asset. Every response carries exactly four headers of interest:
`X-Powered-By`, `Content-Type`, `Cache-Control` and `ETag`. Absent:

| Header                      | Effect of absence here                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | Nothing constrains script or style origins. Relevant because of the eight `dangerouslySetInnerHTML` sites (P3). |
| `Strict-Transport-Security` | No HSTS. A first visit over `http://` is downgradeable.                                                          |
| `X-Content-Type-Options`    | No `nosniff`. The server hands out user-supplied-path static files from `public/`.                              |
| `Referrer-Policy`           | Full URLs leak to `fonts.googleapis.com` and any outbound link.                                                 |
| `Permissions-Policy`        | Camera, microphone and geolocation are not denied on a site that needs none of them.                            |
| `X-Frame-Options` / `frame-ancestors` | The site can be framed by anyone. Low impact with no auth and no forms, but free to fix.               |

**Fix:** `helmet()` in `server.js`, or a dozen explicit lines. The CSP can be
genuinely strict here — one style origin (`fonts.googleapis.com`), one font
origin (`fonts.gstatic.com`), no third-party scripts, and no inline scripts
other than Remix's own hydration payload and the JSON-LD block.

### P2 — 4 advisories with no fix reachable from Remix 2 ⚠️

`pnpm audit --prod`, 10 August 2026:

| Severity     | Package            | Installed | Advisory                                                     | Patched in         |
| ------------ | ------------------ | --------- | ------------------------------------------------------------ | ------------------ |
| **high**     | `turbo-stream`     | < 3.0.0   | DoS via reflected user input                                  | `>= 3.0.0`         |
| moderate     | `react-router`     | 6.30.4    | Open redirect via backslash in `<Link>` / `useNavigate`       | `>= 7.18.0`        |
| moderate     | `react-router`     | 6.30.4    | Arbitrary constructor injection via `deserializeErrors()`     | `>= 7.18.0`        |
| moderate     | `react-router-dom` | 6.30.4    | Open redirect leading to XSS                                  | **none published** |

| Severity  | Count |
| --------- | ----: |
| Critical  |     0 |
| High      |     1 |
| Moderate  |     3 |
| Low       |     0 |
| **Total** | **4** |

All four arrive through `@remix-run/react@2.17.5`, which pins `react-router` to
the 6.x line. **There is no semver-safe upgrade**: the patched versions are
React Router 7, and `react-router-dom` 6.30.4's advisory has no patched release
at all. `pnpm update` will not move any of them.

Exploitability on *this* site is low and worth stating plainly rather than
hiding behind the counts: the two open-redirect advisories need attacker-controlled
navigation targets, and every `<Link to>` in this codebase is a hardcoded string
from `Header.jsx` or `locales.js`. `deserializeErrors()` needs a server error
payload, and there is no `ErrorBoundary` and no user input to trigger one. The
`turbo-stream` DoS is the one that does not depend on application code.

**Remediation order:**

1. **Decide on the framework, not the packages.** Remix 2 is in maintenance;
   React Router 7 is the continuation, and Remix ships a codemod for exactly
   this migration. That decision clears all four advisories at once and is the
   only thing that does. For a 9-page brochure site with 3 route modules and no
   loaders beyond one `url.pathname`, the migration is small.
2. **Until then, record it as accepted risk** rather than re-running `pnpm audit`
   and re-reading the same four rows. Nothing in CI checks this today (§5), so
   the practical step is a scheduled `pnpm audit` that notices when the count
   changes.

### P3 — eight `dangerouslySetInnerHTML` sites, all currently safe ⚠️ 📄

`root.jsx:127` · `_index.jsx:35,39,62,66` · `galeria.jsx:102` ·
`ModalWithDetails.jsx:73` · `ModalSingleProduct.jsx:97`

Seven inject copy from `app/lib/locales.js` and `app/lib/products.js`; the eighth
is `JSON.stringify` of a hardcoded JSON-LD object. All eight sources are
module-level constants compiled into the bundle. **There is no path from user or
network input into any of them**, so this is not exploitable today.

It is recorded because the reason it is safe is not the code — it is the absence
of a CMS. The `<br><br>` in `locales.js:22` is the only thing these calls exist
for. The moment this content moves to a CMS, an editor field, or a translation
service, eight injection points open simultaneously and the CSP that would blunt
them (P2) is not there either. A small `<Rich>` component that splits on `\n\n`
and renders paragraphs removes all seven.

### P3 — `X-Powered-By: Express` on every response ⚠️

`server.js:11`. Free version disclosure. `app.disable('x-powered-by')`.

### P3 — `deploy.sh` builds and then does nothing ⚠️

`deploy.sh:1-16`. The script runs `pnpm build`, then consists entirely of
comments explaining that GitHub Pages will not work and suggesting Vercel,
Netlify or Railway. Running it looks like a deploy and is not one. Either make
it deploy or delete it and keep the guidance in the README, which already
carries the same three-host list.

---

## 2. What is in good shape ✅

Recorded so a later pass does not re-open them.

| Area                | Status | Evidence                                                                                                                                                                |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No user input       | ✅     | No `<form>`, no `<input>` anywhere in `app/`. Contact is `mailto:` and `tel:` links (`kontakt.jsx:21-36`). Nothing is submitted, so nothing needs validating or rate-limiting. |
| No secrets          | ✅     | No `process.env` reads outside `NODE_ENV`. `git ls-files` returns no `.env*`. `.gitignore` covers `node_modules`, `.DS_Store`, `build`, `.cache`.                          |
| No client storage   | ✅     | No cookies, no `localStorage`, no `sessionStorage`. No consent banner is needed because nothing is stored — a genuinely correct GDPR posture rather than a missing one.   |
| Third-party surface | ✅     | One origin pair: `fonts.googleapis.com` + `fonts.gstatic.com`, both `preconnect`ed (`root.jsx:96-97`). No analytics, no tag manager, no embedded scripts.                  |
| Server routing      | ✅     | `server.js` mounts static assets then a single Remix catch-all. No path traversal surface beyond `express.static`, no proxying, no file writes.                            |
| 404 status          | ✅     | Unknown routes return a real 404, not a 200. (The page body is a separate problem — see the SEO audit §1.3.)                                                              |
| Build reproducible  | ✅     | `pnpm build` from a clean `build/` exits 0 in ~0.9 s. Two React Router v7 future-flag warnings, no errors.                                                                 |

---

## 3. Stack health

- Remix **2.17.5**, React **18.3.1**, Vite **5.4.21**, Tailwind **3.4.19**, Express **4.22.2**
- Build emits two future-flag notices (`v3_singleFetch`, `v3_throwAbortReason`) —
  both are the React Router 7 migration path referenced in P2, and opting into
  them early is the cheapest way to de-risk it
- One build warning nobody has decided about: `Generated an empty chunk: "sitemap_._xml"`

`pnpm outdated`:

| Package       | Current | Latest | Note                                                            |
| ------------- | ------: | -----: | --------------------------------------------------------------- |
| `react`       |  18.3.1 | 19.2.8 | Blocked behind the Remix/React Router decision                   |
| `react-dom`   |  18.3.1 | 19.2.8 | ditto                                                            |
| `tailwindcss` |  3.4.19 |  4.3.3 | Major; config format changes                                     |
| `vite` (dev)  |  5.4.21 |  8.2.1 | Pinned in practice by `@remix-run/dev`                           |
| `eslint` (dev)|  8.57.1 | 10.8.1 | Flat-config migration; worth doing *with* the plugin work in §5  |
| `express`     |  4.22.2 |  5.2.1 | Major; move it to `dependencies` first (P1)                      |
| `isbot`       |   4.4.0 |  5.2.1 | Minor surface; used by Remix's default entry                     |
| `cross-env`   |   7.0.3 | 10.1.0 | Or drop it — `NODE_ENV=production node ./server.js` works on macOS/Linux |

**Repository weight (not a security finding, but it belongs to the same
neglect):** `public/gallery` is **23 MB across 16 tracked JPEGs**, all at
3456 × 5184 or larger. They are in git history permanently. The optimisation is
covered in the SEO/performance audit §2.1; the point here is that every clone
and every CI checkout pays for them.

---

## 4. Build-time warnings worth clearing

Emitted on every `pnpm build`, none currently failing it:

- **Future flag** — `v3_singleFetch` not enabled. Opt in before the React Router 7
  migration rather than during it.
- **Future flag** — `v3_throwAbortReason` not enabled. Same reasoning.
- **Empty chunk** — `sitemap_._xml`. The sitemap is a server-only resource route,
  so Vite emits a 0-byte client chunk. Harmless; worth a `// eslint-disable`-style
  acknowledgement somewhere so the next reader does not investigate it twice.

---

## 5. What is enforced automatically

| Check           | Where       | Runs in CI?                                                                    |
| --------------- | ----------- | ------------------------------------------------------------------------------ |
| ESLint          | `pnpm lint` | ❌ — and the config extends `eslint:recommended` only: no `react`, no `react-hooks`, no `jsx-a11y` |
| Prettier        | —           | ❌ not configured                                                               |
| Typecheck       | —           | ❌ plain JS, no `checkJs`                                                        |
| Tests           | —           | ❌ **none exist**                                                                |
| `pnpm build`    | —           | ❌ no CI job — a broken production build reaches `master`                        |
| `pnpm audit`    | —           | ❌ nothing checks dependencies on a schedule or per PR                           |
| Secret scanning | —           | ❌ nothing — currently no secrets to find, which is why it has not mattered      |

**There is no `.github/` directory in this repository.** Every row above is a
manual step.

The gap that matters most here is the same one as in the SEO audit: no job runs
`pnpm build`. P1 — the `express` devDependency — is precisely the class of defect
a production-mode build-and-boot check would catch, and precisely the class that
no local `pnpm dev` ever will.

---

## 6. Related

- [`../AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md`](../AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md) — same audit date, SEO / performance / a11y half, including the `/galeria` layout collapse
- Sibling audit in the same shape: `~/Code/hannajuszczak.pl/docs/audits/2026-08-05-security-dependency-audit.md`
- Template: `~/Code/AI/RUNBOOK_DEPENDENCY_AUDIT.md`
