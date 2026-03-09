---
description: Pre-deploy validation — runs full CI checks and build to catch issues before merge
allowed-tools: Bash, Read, Grep, Glob
---

# Deploy Check

Run a full pre-deploy validation to ensure the branch is ready for merge to `main`. This simulates what CI does.

## Checks (run in order)

1. **Format** — `pnpm standard:format`
2. **Lint** — `pnpm standard:lint`
3. **Unit tests** — `pnpm test:unit`
4. **Type check** — `pnpm test:types`
5. **Build** — `pnpm build:dev`

## Additional Checks

After the standard checks pass:

6. **Uncommitted changes** — `git status` to check for forgotten files
7. **Commit messages** — `git log main..HEAD --oneline` to verify all commits follow Conventional Commits format (`type(scope): description`)
8. **Branch is up to date** — `git fetch origin main && git log HEAD..origin/main --oneline` to check if main has advanced

## Report

Provide a deployment readiness report:

```
🚀 Deploy Check Results
========================
Format:     ✅/❌
Lint:       ✅/❌
Tests:      ✅/❌ (X passed)
Types:      ✅/❌
Build:      ✅/❌
Clean tree: ✅/❌
Commits:    ✅/❌
Up to date: ✅/❌

Verdict: READY / NOT READY
```

If NOT READY, list each issue and how to fix it.
