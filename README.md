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
