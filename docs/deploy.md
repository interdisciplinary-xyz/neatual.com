# Deployment

**Neatual.com deploys to Vercel.** Not "Vercel, Netlify or Railway" — one host,
named here, and this file is the answer to every question that used to start
with "well, it depends which one is live."

| | |
| --- | --- |
| Host | Vercel |
| Project | `neatual-com` (team `micha-dopieralskis-projects`) |
| Framework preset | `remix` |
| Node | 24.x |
| Repository | `interdisciplinary-xyz/neatual.com` |
| Production domains | `neatual.com`, `www.neatual.com` |
| Dashboard | https://vercel.com/micha-dopieralskis-projects/neatual-com |

## How a deploy happens

Through the Git integration, not the CLI. There is nothing to run:

- **Production** — every merge to `master` builds and promotes automatically.
  `neatual.com` 308-redirects to `www.neatual.com`, which serves the app.
- **Preview** — every push to any other branch gets its own URL, and every PR
  gets a comment linking to it. Scope branches also get a stable alias,
  `neatual-com-git-<branch>-micha-dopieralskis-projects.vercel.app`.

`./deploy.sh` does **not** deploy. It reproduces what CI checks and leaves you
with verified local artifacts; the name is older than the Git integration.

To roll production back, promote a previous deployment from the dashboard —
Vercel keeps every build, and the deployment list marks which ones are rollback
candidates. That is faster and safer than reverting a merge commit, which has
to go through CI again.

## `server.js` does not run in production

This is the thing to know before changing anything about headers, compression
or proxy trust.

Vercel's `remix` preset builds the app and serves it through its own adapter.
The Express server in `server.js` is never loaded there. It is still the real
server for `pnpm start`, the CI smoke job and the Lighthouse run — but nothing
it does at the HTTP layer reaches a visitor.

Measured against `https://www.neatual.com/` on 28 August 2026: no
`Content-Security-Policy`, no `X-Content-Type-Options`, no `Referrer-Policy`,
no `X-Frame-Options`, and `Strict-Transport-Security: max-age=63072000` —
Vercel's own default, missing the `includeSubDomains; preload` that `server.js`
sends. The CI smoke job asserts all of them and was green, because it boots
`server.js` itself.

`vercel.json` now restates those headers for the platform. The values live once
in `app/lib/securityHeaders.js`; `server.js` imports them and
`test/security-headers.spec.js` fails if `vercel.json` drifts from them.

Response compression is Vercel's (`content-encoding: br`), not the
`compression()` middleware's.

## Environment variables

Set in the Vercel project, for all three environments unless noted.

| Variable | Purpose |
| --- | --- |
| `SANITY_STUDIO_PROJECT_ID` | Sanity project — `kyyf7nu9` |
| `SANITY_STUDIO_DATASET` | `production` |
| `SANITY_STUDIO_API_VERSION` | Pinned API date, so a Sanity change cannot alter responses silently |
| `SANITY_WRITE_TOKEN` | Only needed by `pnpm seed:sanity`. Not required to serve the site |
| `SANITY_STUDIO_HOST` | Only used by `pnpm sanity:deploy` |

`VERCEL` is set by the platform. `TRUST_PROXY=1` is a local escape hatch for
running `pnpm start` behind your own reverse proxy, and is not set in the
project.

None of these are required for the site to render: if Sanity cannot be reached,
`app/lib/content.server.js` falls back to the bundled copy in
`app/lib/locales.js`. That is by design, and it is also why the fallback path
needs its own alarm — see `.github/workflows/cms-probe.yml`.

## Where the logs are

Vercel dashboard → the project → **Logs** for runtime, or a specific deployment
→ **Build Logs**. Both are also reachable from the deployment's inspector URL,
which appears in the PR comment.

Runtime logs are retained on the platform's own schedule and are not shipped
anywhere. The one application-level warning worth catching —
`[content] Falling back to app/lib/locales.js` — is therefore not something a
human will see in time, which is what the scheduled CMS probe exists to cover.

## Sanity Studio

Deployed separately, to https://neatual.sanity.studio, by `pnpm sanity:deploy`.
It is not part of the Vercel build and does not redeploy when the site does.

## Branch protection on `master`

Because a merge to `master` deploys to production, the gate on merging *is* the
gate on deploying. It is recorded here because branch protection lives in
GitHub's settings, not in the repo — nothing in a clone reveals it, and it does
not survive the repo moving to another account.

Applied 28 August 2026. Before that, `master` was not protected at all.

| Rule | Value |
| --- | --- |
| Pull request required | yes — no direct pushes |
| Approving reviews required | **0** |
| Required checks | Lint & build · Dependency audit · Secret scan · Lighthouse budgets · Production boot smoke test |
| Branch must be up to date before merging | yes |
| Applies to administrators | yes |
| Force push | blocked |
| Branch deletion | blocked |

**Why zero approvals.** The rule that matters is "every change goes through a
PR and every check passes"; requiring an approving review on a single-maintainer
repo would only mean nothing could ever merge, because GitHub does not let an
author approve their own pull request. Zero approvals still forces the PR, still
runs the five checks, and still blocks a direct push. Raise it the day there is
a second maintainer.

**Why the check names look different from the job ids.** Protection matches the
*display* name of a check run, not the job key in `ci.yml` — so it is
`Lint & build`, not `quality`. Renaming a job's `name:` silently stops it being
required, because a rule naming a check that never reports is a rule that never
blocks anything. Change both together.

Two other checks report on PRs and are deliberately **not** required: CodeQL
(GitHub default setup, not defined in `ci.yml`) and Vercel's preview comment.

To restore this after an account or repository move:

```sh
gh api -X PUT repos/<owner>/<repo>/branches/master/protection --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint & build", "Dependency audit", "Secret scan",
                 "Lighthouse budgets", "Production boot smoke test"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Verify with `gh api repos/<owner>/<repo>/branches/master/protection`.
