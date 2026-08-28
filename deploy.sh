#!/usr/bin/env sh
#
# Pre-deploy verification.
#
# This script used to run `pnpm build` and then consist entirely of comments
# explaining that GitHub Pages would not work — so running it looked like a
# deploy and was not one. It now does the one useful thing it can do locally:
# reproduce what CI checks, and leave you with verified artifacts.
#
# It deliberately does not push anywhere, and there is nothing for it to push:
# the site deploys to Vercel through the Git integration. A merge to master
# promotes to production and every other branch gets a preview URL, so the
# deploy command is `git push`. See docs/deploy.md.
#
# The name predates that integration. Kept because the thing it actually does —
# regenerate derivatives, lint, build, and verify the artifacts exist — is the
# check worth running before you open the PR that will deploy.

set -e

echo "==> Regenerating gallery derivatives and the OG card"
pnpm images:generate
pnpm og:generate

echo "==> Lint"
pnpm lint

echo "==> Production build"
pnpm build

echo "==> Verifying artifacts"
test -f build/server/index.js || { echo "missing build/server/index.js"; exit 1; }
test -d build/client/assets  || { echo "missing build/client/assets"; exit 1; }
test -f public/og-image.jpg  || { echo "missing public/og-image.jpg"; exit 1; }

echo
echo "Build OK."
echo "  build/client  static assets (content-hashed under /assets)"
echo "  build/server  server bundle"
echo
echo "Run it locally the way the CI smoke job does:"
echo "  pnpm start"
echo
echo "Note that this is NOT how production runs. Vercel serves the built Remix"
echo "app through its own adapter and never loads server.js — the headers it"
echo "sets come from vercel.json in production. See docs/deploy.md."
echo
echo "To deploy: merge to master. Vercel builds and promotes from the Git"
echo "integration; there is no command to run here."
