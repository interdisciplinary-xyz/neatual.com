# neatual.com

[![CI](https://github.com/interdisciplinary-xyz/neatual.com/actions/workflows/ci.yml/badge.svg)](https://github.com/interdisciplinary-xyz/neatual.com/actions/workflows/ci.yml)

Trilingual (pl / en / de) marketing site for Neatual, a Polish wallpaper-hanging company that installs across Poland.

---

## Table of content

1. [Stack](#stack)
2. [Architecture](#architecture)
   - [Domains](#domains)
   - [Components](#components)
   - [API](#api)
   - [Scripts](#scripts)
   - [Environment](#environment)
3. [Quick start](#quick-start)
4. [Status](#status)
5. [License](#license)

---

## Stack

| App | Tests | Tools |
| --- | ----- | ----- |
| [React Router](https://reactrouter.com/) | [Vitest](https://vitest.dev/) | [pnpm](https://pnpm.io/) |
| [React](https://react.dev/) | [Testing Library](https://testing-library.com/) | [ESLint](https://eslint.org/) |
| [Tailwind CSS](https://tailwindcss.com/) | [vitest-axe](https://github.com/chaance/vitest-axe) | [Prettier](https://prettier.io/) |
| [Sanity](https://www.sanity.io/) | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | [Vite](https://vitejs.dev/) |
|  | [jsdom](https://github.com/jsdom/jsdom) | [sharp](https://sharp.pixelplumbing.com/) |
|  |  | [styled-components](https://styled-components.com/) |

---

## Architecture

Sanity-backed marketing site with a hard fallback. Content flows through `app/lib/content.server.js`; when Sanity is unreachable or unconfigured it serves bundled copy from `app/lib/locales.js` / `app/lib/inlineCopy.js` and logs a one-line notice, so the site always renders. Vercel serves the built app through `@vercel/react-router`; the Express `server.js` is used only by `pnpm start`, CI smoke, and Lighthouse. Security headers in `app/lib/securityHeaders.js` are applied both there and in `vercel.json`.

### Domains:

Flat route tree under `app/routes/` — file-based routing, one file per locale × surface. No domain folders.

- `app/routes/_index.jsx` — Home (`/` PL, `/en`, `/de`)
- `app/routes/galeria.jsx` — Gallery (`/galeria` PL, `/en/gallery`, `/de/galerie`)
- `app/routes/uslugi.jsx` — Services (`/uslugi` PL, `/en/services`, `/de/leistungen`)
- `app/routes/cennik.jsx` — Pricing (`/cennik` PL, `/en/pricing`, `/de/preise`)
- `app/routes/kontakt.jsx` — Contact (`/kontakt` PL, `/en/contact`, `/de/kontakte`)

Studio lives separately at <https://neatual.sanity.studio>.

---

### Components

Co-located in `app/components/` as flat `.jsx` files (no per-component folders). Test siblings use `Name.spec.jsx`; hooks use `useX.js` + `useX.spec.jsx`.

- Layout: `PageLayout.jsx`, `Header.jsx`, `Footer.jsx`
- Media: `DisplayMedia.jsx`, `ProductImage.jsx`, `SplashScreen.jsx`
- Content: `RichText.jsx` (Portable Text renderer), `Button.jsx`
- Modals: `ModalSingleProduct.jsx`, `ModalWithDetails.jsx`, `useModalBehaviour.js`
- Icons: `app/components/icons/`

---

### API

No API routes (Sanity-driven marketing site). Server-side data fetching happens in route loaders via `app/lib/content.server.js`; the only server-generated response is `app/routes/sitemap[.]xml.js`.

---

### Scripts

| Name | Description |
| --- | --- |
| `dev` / `start:dev` | Dev server via portless (`https://neatual.local`, `--lan`) |
| `start:dev:raw` | Dev server without the portless proxy (uses `PORT`, default 7777) |
| `build` | Production build (`react-router build`) |
| `start` | Run the built server (`server.js`, `NODE_ENV=production`) |
| `lint` / `lint:fix` | ESLint over `app/` |
| `format` / `format:check` | Prettier write / check |
| `test` / `test:watch` | Vitest (single run / watch) |
| `test:performance` | Lighthouse CI (`lhci autorun`) |
| `audit:check` | Verify against the audit baseline (`scripts/check-audit-baseline.mjs`) |
| `content:check` | Compare live Sanity output against the bundled fallback |
| `content:pull` / `content:push` | Sync content between Sanity and the repo fallback |
| `sanity:dev` | Run Sanity Studio locally |
| `sanity:build` / `sanity:deploy` | Build / deploy Sanity Studio |
| `seed:sanity` | Seed the Sanity dataset from `scripts/seed-sanity.mjs` |
| `seed:sanity:import` | Emit NDJSON and `sanity dataset import --replace` into `production` |
| `images:generate` | Regenerate gallery images (`scripts/generate-gallery-images.mjs`) |
| `og:generate` | Regenerate the Open Graph card (`scripts/generate-og-image.mjs`) |
| `fonts:fetch` | Fetch self-hosted fonts (`scripts/fetch-fonts.mjs`) |
| `cache:clean` | Delete `node_modules`, `build`, `dist`, `.cache`, `.sanity` |
| `reboot` | `cache:clean` + `pnpm install` + `start:dev` |

---

### Environment

Copy `.env.example` to `.env` — the Sanity project already exists and the file is checked in verbatim. Vercel serves production; merges to `master` promote, other branches get preview URLs. Deployment details in `docs/deploy.md`.

- Sanity
  - `SANITY_STUDIO_PROJECT_ID` — Sanity project id (`kyyf7nu9`)
  - `SANITY_STUDIO_DATASET` — Sanity dataset (`production`)
  - `SANITY_STUDIO_API_VERSION` — Pinned Sanity API date so responses cannot silently change
  - `SANITY_STUDIO_HOST` — Studio subdomain for `pnpm sanity:deploy` (`neatual`)

- Write token
  - `SANITY_WRITE_TOKEN` — Optional; only needed to run `pnpm seed:sanity` outside a `sanity login` session. Not set in CI.

---

## Quick start

```bash
pnpm install
pnpm start:dev            # https://neatual.local via portless
```

`start:dev:raw` skips the proxy and runs on `PORT` (default 7777). `pnpm reboot` clears caches and reinstalls. Requires **Node >= 22.12** and **pnpm 10.22.0**.

---

## Status

Dormant. In the local `_ARCHIVE/` folder but still deployed. Revive-vs-retire decision pending — see `docs/audits/2026-08-17-comprehensive-audit.md` P0 #13.

---

## License

Private. All rights reserved. © Neatual.
