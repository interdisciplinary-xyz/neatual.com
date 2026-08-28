# Audits

One line per audit, newest first, so the current state of a finding can be read
without opening four documents and reconciling them.

**Audits are records, not documentation.** They describe what was true on the
date at the top, and they are not edited when the code changes — correcting an
audit falsifies the observation that made it worth writing. What changes is this
index, and the "superseded by" header on anything since overtaken.

| Date | Audit | Verdict |
| --- | --- | --- |
| 2026-08-17 | [Comprehensive audit](2026-08-17-comprehensive-audit.md) | 4 P0, 3 P1, 7 P2. All filed as issues #10–#19. P0s and P1s closed in `scope/v0.4.0` and `scope/v0.5.0`; P2 backlog closed in `scope/v0.6.0`. One P1 was wrong — see below. |
| 2026-08-13 | [Lighthouse budget fix](2026-08-13-lighthouse-budget-fix.md) | `/galeria` perf 0.87 against a 0.9 floor, caused by a render-blocking Google Fonts stylesheet. Fixed by self-hosting. |
| 2026-08-10 | [Security and dependency audit](2026-08-10-security-dependency-audit.md) | 4 advisories, all React Router 6.x, unfixable under Remix 2. Tolerated against a recorded baseline until the React Router 7 migration cleared them; the baseline is now zeros. |
| (undated) | [SEO, performance and accessibility](../AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md) | Superseded. Predates the wallpaper rewrite and the Remix rebuild; several findings describe a site that no longer exists. |

## Where an audit was wrong

Worth recording, because an audit's authority is the reason anyone acts on it.

**2026-08-17, P1 #2 — "Trim the stale-uniform warning in `.claude/CLAUDE.md`.
Grep confirms zero matches."** It did not. The grep covered `app/` and
`sanity/`. `scripts/generate-og-image.mjs` was still drawing "Produkcja i
dystrybucja uniformów / od ponad 25 lat" into `public/og-image.jpg` on every
build, so every share of the site on every platform advertised the previous
business — for months after the on-page copy had been rewritten, and for eleven
days after the audit said it was clean.

The warning was not stale. The search was too narrow, and a finding of "zero
matches" from a hand-run grep is a claim about where someone looked, not about
the repository. Fixed in `scope/v0.6.0`, with `test/stale-copy.spec.js` now
searching every shipped path on every CI run.
