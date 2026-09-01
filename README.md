# neatual.com

Marketing site for Neatual — a Polish wallpaper-hanging company that installs across Poland.

> [!NOTE]
> **Status: Dormant.** Sits in the archive folder locally but still ships to production from `master`. Revival vs. retirement is TBD — see [docs/audits/2026-08-17-comprehensive-audit.md](docs/audits/2026-08-17-comprehensive-audit.md) (P0 #13).

## Surfaces

| Locale  | Home  | Gallery       | Contact         |
| ------- | ----- | ------------- | --------------- |
| Polish  | `/`   | `/galeria`    | `/kontakt`      |
| English | `/en` | `/en/gallery` | `/en/contact`   |
| German  | `/de` | `/de/galerie` | `/de/kontakte`  |

- Live site: production Vercel deployment (see [docs/deploy.md](docs/deploy.md))
- Studio: <https://neatual.sanity.studio>

## Why this exists

Neatual needs a multilingual company site that survives a CMS outage and stays cheap to run. The site is the whole product — no accounts, no bookings, no dashboards; browsing and contact only.

## What it is not

Not a booking, quoting, or e-commerce platform. Installation only — the client or their designer supplies the wallpaper.

## Quick start

```bash
pnpm install
pnpm start:dev            # https://neatual.local via portless
```

`start:dev:raw` skips the proxy and runs on `PORT` (default 7777). `pnpm reboot` clears caches and reinstalls.

Requires **Node >= 22.12** and **pnpm 10.22.0**.

## Everyday commands

| Task                     | Command                  |
| ------------------------ | ------------------------ |
| Dev server               | `pnpm start:dev`         |
| Dev server (no proxy)    | `pnpm start:dev:raw`     |
| Production build         | `pnpm build`             |
| Run built server         | `pnpm start`             |
| Lint / format            | `pnpm lint` / `pnpm format` |
| Tests                    | `pnpm test`              |
| Lighthouse budgets       | `pnpm test:performance`  |
| Check CMS vs. fallback   | `pnpm content:check`     |
| Sanity Studio (local)    | `pnpm sanity:dev`        |
| Deploy Studio            | `pnpm sanity:deploy`     |
| Generate gallery images  | `pnpm images:generate`   |
| Generate OG card         | `pnpm og:generate`       |

## Stack

- **React Router 7** in framework mode (migrated from Remix 2)
- **React 19**, **Tailwind CSS**
- **Sanity 4.x** — field-level i18n (`{ pl, en, de }`), public `production` dataset, dotless document IDs
- **Vercel** — merge to `master` promotes to production; other branches get preview URLs
- **Express `server.js`** — used only by `pnpm start`, CI smoke, and Lighthouse; Vercel serves the built app through its own `@vercel/react-router` adapter, so security headers in `app/lib/securityHeaders.js` are applied both there and in `vercel.json`

Content flows through `app/lib/content.server.js`. When Sanity is unreachable or unconfigured, it falls back to bundled copy in `app/lib/locales.js` / `app/lib/inlineCopy.js` and logs a one-line notice — the site always renders. `pnpm content:check` is what tells CMS output from the fallback.

## Documentation

- [docs/deploy.md](docs/deploy.md) — Vercel project, env vars, logs
- [docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md](docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md)
- [docs/ICP-AND-SEO-STRATEGY.md](docs/ICP-AND-SEO-STRATEGY.md)
- [docs/audits/](docs/audits/) — dated audit reports, latest: [2026-08-17-comprehensive-audit.md](docs/audits/2026-08-17-comprehensive-audit.md)
- [docs/plans/](docs/plans/) — design and product plans

## License

Private. All rights reserved.
