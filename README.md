# Neatual.com

Company website for Neatual – a Polish uniform manufacturer and distributor (25+ years). Built with **Remix** and **Tailwind CSS**.

## Tech Stack

- **Remix** – Full-stack React framework
- **Tailwind CSS** – Styling
- **React 18** – UI

## Development

```bash
pnpm install
pnpm start:dev
```

`start:dev` runs behind `portless`, which serves the app at `https://neatual.local` and exposes it on
the LAN. Use `pnpm start:dev:raw` to skip the proxy and run on `PORT` (default 7777) directly.

To start from a clean slate:

```bash
pnpm reboot   # cache:clean && install && start:dev
```

## Build

```bash
pnpm build
pnpm start
```

## Content (Sanity)

The site still renders from `app/lib/locales.js`. The Sanity groundwork is in place but
not yet wired into the routes — `app/lib/sanity.js` exports a null client until a project
ID exists, so nothing breaks in the meantime.

The project (`kyyf7nu9`) exists and is seeded. To work on it locally:

```bash
cp .env.example .env    # already filled in for the existing project
pnpm sanity:dev         # Studio at http://localhost:3333
```

Re-seeding from `app/lib/locales.js`, should you need it:

```bash
pnpm seed:sanity --dry-run     # inspect the documents, write nothing
pnpm seed:sanity:import        # writes, using your `sanity login` session
pnpm seed:sanity               # same, but via SANITY_WRITE_TOKEN
```

Both are idempotent — fixed document IDs, `--replace` — so re-running overwrites
rather than duplicating. That also means re-seeding discards Studio edits.

The `production` dataset is **public**: the site reads it anonymously, with no token in
the server environment. Document IDs must stay dotless (`page-home`, not `page.home`) —
Sanity's default public read grant is `_id in path("*")`, which matches only dotless IDs,
so a dotted ID is invisible to anonymous readers.

The Studio is deployed separately from the site, to `<SANITY_STUDIO_HOST>.sanity.studio`:

```bash
pnpm sanity:deploy
```

Content is modelled with **field-level localization** — one document per page, each
translatable field holding `{ pl, en, de }`. The locale list lives in `app/lib/seo.js`
and is shared with the sitemap and hreflang tags, so adding a language is one edit.

Sanity is pinned to the `4.x` line because 5.x and later require React 19; this app is on
React 18.

## Routes

- **Polish:** `/`, `/galeria`, `/kontakt`
- **English:** `/en`, `/en/gallery`, `/en/contact`
- **German:** `/de`, `/de/galerie`, `/de/kontakte`

## Deployment

The app requires a Node.js server. Deploy to:

- **Vercel** – `vercel`
- **Netlify** – `netlify deploy`
- **Railway** – Connect your repo

For GitHub Pages, you would need a static export or a serverless function.
