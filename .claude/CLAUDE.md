# Neatual.com — Project Configuration

## Project Overview

Neatual.com is a company website for Neatual, a Polish wallpaper-hanging company working across Poland. Installation only — the client or their designer supplies the wallpaper. Built with **React Router 7** and **Tailwind CSS**.

It previously made uniforms. Any copy mentioning uniforms or 25 years is stale, and `test/stale-copy.spec.js` now fails on it across every shipped path. That guard replaced this warning rather than the warning being retired: the 17 August audit proposed dropping it as having done its job, having grepped `app/` and `sanity/` — while `scripts/generate-og-image.mjs` was still rendering "Produkcja i dystrybucja uniformów / od ponad 25 lat" into the Open Graph card on every build.

## Tech Stack

- **Framework**: React Router 7, framework mode (migrated from Remix 2)
- **Styling**: Tailwind CSS
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **React 19.** Moved from 18 on 28 August 2026. Nothing was pinned to 18 in the
  end: `sanity@4.22.0` peers `react: "^18||^19"`, and so does everything else
  in the tree.
- **CMS**: Sanity 4.x — field-level i18n, Studio at https://neatual.sanity.studio.
  Still on 4.x, but no longer for the reason this file used to give ("5.x+
  requires React 19 and this app is on React 18"). That was read backwards:
  4.x already supported both, so React 18 was never what held Sanity here.
  There is simply no reason to move yet. Content flows through
  `app/lib/content.server.js`, which falls back to `app/lib/locales.js` if
  Sanity is unreachable.

## Project Structure

```
app/
  components/     — Header, Footer, modals, icons
  lib/            — locales.js (fallback), seo.js, content.server.js, sanity.js
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
