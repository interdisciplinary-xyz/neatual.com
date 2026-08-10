import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./sanity/schemas/index.js";
import { structure } from "./sanity/structure.js";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2026-08-10";

export default defineConfig({
  name: "neatual",
  title: "Neatual",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: { types: schemaTypes },
  document: {
    // Site settings must stay a singleton — no "create new" action for it.
    actions: (prev, { schemaType }) =>
      schemaType === "siteSettings"
        ? prev.filter(({ action }) => action !== "duplicate" && action !== "delete")
        : prev,
  },
});
