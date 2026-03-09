---
description: Run the full test suite (unit, types, lint, format) and report results
allowed-tools: Bash, Read
---

# Test Runner

Run the project test suite and report results. Execute the following checks in order:

## Checks

1. **Format check** — `pnpm standard:format`
2. **Lint check** — `pnpm standard:lint`
3. **Unit tests** — `pnpm test:unit`
4. **Type check** — `pnpm test:types`

If a specific scope is provided: $ARGUMENTS — run only the relevant checks.

## Reporting

After running all checks, provide a summary:

| Check | Status | Details |
|-------|--------|---------|
| Format | ✅/❌ | ... |
| Lint | ✅/❌ | ... |
| Unit Tests | ✅/❌ | X passed, Y failed |
| Types | ✅/❌ | ... |

If any check fails, show the relevant error output and suggest fixes.
