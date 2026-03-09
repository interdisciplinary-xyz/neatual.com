---
description: Review current branch changes against main for code quality, patterns, and potential issues
allowed-tools: Bash, Read, Grep, Glob
---

# Code Review

You are a senior code reviewer for the Empatalk monorepo. Review the current branch changes against `main`.

## Steps

1. **Identify changes** — run `git diff main...HEAD --stat` and `git log main..HEAD --oneline` to understand what changed
2. **Read the diff** — run `git diff main...HEAD` to see full changes
3. **Review against project standards** (from CLAUDE.md):
   - No `console.log` (only `console.warn`/`console.error`)
   - Curly braces always required
   - `simple-import-sort` ordering
   - No unused imports
   - Domain-driven structure in web app (`src/domains/`)
   - Hexagonal architecture in core (`ports/`, `services/`, `adapters/`)
   - Conventional Commit messages on all commits
4. **Check for common issues:**
   - Missing `'use client'` directives on components using hooks
   - Missing error handling in fetch calls
   - Hardcoded strings that should be in `next-intl` translations
   - Missing unit tests for new utilities/API functions
   - Type safety — avoid `any`, prefer explicit types
   - Barrel export consistency (`index.ts` files)
5. **Summarize** — provide a structured review with:
   - ✅ What looks good
   - ⚠️ Suggestions for improvement
   - ❌ Issues that should be fixed before merge

If specific files or changes are mentioned: $ARGUMENTS — focus the review on those.
