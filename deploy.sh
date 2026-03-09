#!/usr/bin/env sh

# abort on errors
set -e

# build Remix app
yarn build

# For GitHub Pages: Remix requires a Node server. Consider deploying to
# Vercel, Netlify, or Railway instead. To deploy the built app:
# - build/client contains static assets
# - build/server contains the server bundle
# Run: NODE_ENV=production node build/server/index.js