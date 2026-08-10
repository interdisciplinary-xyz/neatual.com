#!/usr/bin/env sh
#
# Pre-deploy verification.
#
# This script used to run `pnpm build` and then consist entirely of comments
# explaining that GitHub Pages would not work — so running it looked like a
# deploy and was not one. It now does the one useful thing it can do locally:
# reproduce what CI checks, and leave you with verified artifacts.
#
# It deliberately does not push anywhere. Neatual runs on a Node server;
# deployment is `vercel`, `netlify deploy` or a Railway push, and which of
# those is live is not encoded in this repo.

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
echo "Run it locally exactly as production does:"
echo "  pnpm start"
echo
echo "Deploy targets (see README): vercel · netlify deploy · Railway"
