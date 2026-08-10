import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Studio is deployed separately (pnpm sanity:deploy), not served by the
  // Remix app, so keep its build output out of the app's build/ directory.
  studioHost: process.env.SANITY_STUDIO_HOST,

  // Pinned so `sanity deploy` does not prompt for an application id, which
  // makes the command non-interactive and therefore CI-safe.
  deployment: {
    appId: "zau18vzkuey7xumqtmladni9",
  },
});
