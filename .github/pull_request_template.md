<!--
  🏷️  BRANCH + PR NAMING for this project

  BRANCHES (create before opening the PR):
    scope/vX.Y.Z    — the current cycle's working branch (commit implementation directly
                      here; no per-change feat/*/fix/* sub-branches during scope)
    release/vX.Y.Z  — the release umbrella (PR targets main / master)
    fix/<slug>      — post-scope isolated fix (targets release/vX.Y.Z), only allowed once
                      scope is closed

  PR TITLE (set at the top of the "Open a pull request" form; GitHub cannot fill the
  title from a body template):
    MUST be:  neatual - <branch-name>
    Examples: neatual - scope/v0.1.0
              neatual - release/v0.1.0
              neatual - fix/<slug>

  The `neatual` prefix drops the .com TLD — human short name of the repo, NOT the full
  GitHub owner/repo path. This format puts the branch name at the visible position of
  the browser tab title so an author with a row of PR tabs open across the portfolio can
  pick this repo's PR out at a glance.
-->

## Summary

<!-- 1–3 sentences. What changed and why now. Link the issue(s) this closes. -->

Closes #

## Test plan

<!-- How a reviewer (or future-you) can verify this works. Be specific. -->

- [ ]

## Risk & rollback

<!-- 1–2 sentences. Worst case in prod, how you'd notice, how to revert. -->
