# Neatual.com — Project Configuration

## Project Overview

Neatual.com is a company website for Neatual, a Polish uniform manufacturer and distributor (25+ years). Built with **Remix** and **Tailwind CSS**.

## Tech Stack

- **Framework**: Remix 2 (React Router)
- **Styling**: Tailwind CSS
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **CMS**: Sanity 4.x — field-level i18n, separately hosted Studio. Scaffolded in
  `sanity/` + `app/lib/sanity.js`; routes still read `app/lib/locales.js`.
  Pinned to 4.x because 5.x+ requires React 19 and this app is on React 18.

## Project Structure

```
app/
  components/     — Header, Footer, modals, icons
  lib/            — locales.js, products.js
  routes/         — File-based routing
public/gallery/   — Product images
```

## Routes

- **Polish**: `/`, `/galeria`, `/kontakt`
- **English**: `/en`, `/en/gallery`, `/en/contact`
- **German**: `/de`, `/de/galerie`, `/de/kontakte`

## Commands

Use `.claude/commands/` for workflows (review, deploy-check, web-interface-guidelines).

## Skills

Skills in `.claude/skills/` provide guidance for copywriting, frontend design, marketing psychology, programmatic SEO, and UI/UX.
