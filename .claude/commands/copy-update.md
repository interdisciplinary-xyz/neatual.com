---
description: Update site copy in all three languages — pull from Sanity, rewrite, push, mirror the fallback, verify no drift
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Task
---

# Copy update

Updates user-facing copy on neatual.com across `pl`, `en` and `de`, in both
places it lives, without leaving the two out of sync.

Load `.claude/skills/neatual-copy/SKILL.md` before writing anything — it holds
the voice, the field map, and the rules about what must never be invented.

**Target:** $ARGUMENTS (for example "homepage", "meta descriptions",
"contact page"). If empty, ask which pages or fields are in scope before
starting.

## 1. See what is actually there

```bash
pnpm content:pull        # → content.json, the live copy
pnpm content:check       # confirm you are starting from a clean state
```

If `content:check` already reports drift, fix that first or you will not be able
to tell your changes apart from the pre-existing mismatch.

Read the current copy for the fields in scope, in all three locales. Quote it
back to the user before proposing replacements — they may not know what is
there, especially where it still describes the old uniform business.

## 2. Write it

For each field, use the `copy-localizer` agent to produce all three locales at
once. Give it the field name and either the Polish source or the intent. It
returns `pl`/`en`/`de` plus a Risks section.

Batch independent fields into parallel agent calls; do not serialise a headline
behind a meta description.

**Stop and ask the user** if the copy needs a fact you do not have — materials,
prices, years in business, client names, service area. Write the version without
the fact and flag it. Never fill the gap yourself.

## 3. Show the diff before writing anything

Present old → new per field per locale, and let the user approve. Copy changes
are cheap to review and expensive to discover in production.

## 4. Apply to both sources

Edit `content.json`, then:

```bash
pnpm content:push        # needs SANITY_WRITE_TOKEN
```

Then mirror the identical words into the bundled fallback:

- page and settings copy → `app/lib/locales.js`
- `PRODUCTS`, `PRODUCT_SHARED`, `PAGE_META`, `HOME_SR_HEADING`,
  `A11Y_LABELS` → `app/lib/inlineCopy.js`

Alternative when the code is the source of truth: edit the fallback files and
run `pnpm seed:sanity:import`, which rewrites Sanity from them. **That
overwrites anything edited in the Studio** — only use it when you know nothing
was.

## 5. Verify

```bash
pnpm content:check       # must print ✓ — this is the gate
pnpm lint
pnpm build
```

Then serve it and read the result rather than trusting the diff:

```bash
pnpm start:dev:raw
curl -s localhost:7777/ | grep -o '<title>[^<]*</title>'
```

Check every affected page in all three locales, and check the title and meta
description as well as the visible text — they are separate fields and are
easy to leave behind.

## Done means

- `pnpm content:check` prints ✓
- lint and build pass
- every affected page returns 200 in all three locales
- no remaining mention of uniforms, sewing or EKOTRADE in the fields you touched
- nothing was invented that the user did not supply
