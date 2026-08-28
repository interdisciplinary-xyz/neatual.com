# Neatual.com — Agent Configuration

## Project Overview

Neatual.com is a company website for Neatual, a Polish wallpaper-hanging company working across Poland. Installation only — the client or their designer supplies the wallpaper. Built with **React Router 7** and **Tailwind CSS**.

## Tech Stack

- **Framework**: React Router 7, framework mode (migrated from Remix 2)
- **Styling**: Tailwind CSS
- **Runtime**: Node.js
- **Package Manager**: pnpm
- **CMS**: Sanity — every page and the product gallery render from it

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

## Skills & Tools

Project inherits skills from `.claude/skills/`:

- **copywriting** — Copy frameworks, natural transitions
- **frontend-design** — UI/UX design principles
- **marketing-psychology** — Psychology for marketing
- **programmatic-seo** — SEO playbooks
- **ui-ux-pro-max** — Design system, typography, colors, UX guidelines

Commands in `.claude/commands/`:

- **content-editor** — Content editing workflow
- **deploy-check** — Pre-deploy checklist
- **review** — Code review guidelines
- **web-interface-guidelines** — Web UI standards
