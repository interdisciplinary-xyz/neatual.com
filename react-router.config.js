import { vercelPreset } from "@vercel/react-router/vite";

// Server-rendered, and told so explicitly: `ssr` defaults to true, but this app
// has a root loader that fetches from the CMS on every request, so it is worth
// stating rather than inheriting.
//
// The Vercel preset is what makes the build produce the output that platform
// expects. Without it the app still deploys, but per-route function config and
// the deployment summary do not work — Vercel's own docs call it "highly
// recommended", and this repo has already paid once for a deployment detail it
// assumed rather than encoded (see docs/deploy.md on server.js).
export default {
  ssr: true,
  presets: [vercelPreset()],
};
