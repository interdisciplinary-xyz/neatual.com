/**
 * One-shot migration: lifts the bundled content in app/lib into Sanity as the
 * `page` documents, the `service` and `product` collections, and the
 * `siteSettings` singleton.
 *
 * Idempotent — uses createOrReplace against fixed document IDs, so re-running
 * overwrites rather than duplicating. That also means it will discard edits
 * made in the Studio, so run it to seed, not to sync.
 *
 *   pnpm seed:sanity:import        # no token needed — uses your `sanity login`
 *   SANITY_WRITE_TOKEN=... pnpm seed:sanity
 *   pnpm seed:sanity --dry-run     # print the documents, write nothing
 *   pnpm seed:sanity --ndjson      # emit ndjson for `sanity dataset import`
 *
 * The documents themselves are built in ./seed-documents.mjs, which has no
 * environment requirements and can therefore be imported by the test suite.
 */
import { createClient } from "@sanity/client";
import { buildDocuments } from "./seed-documents.mjs";

const dryRun = process.argv.includes("--dry-run");
const asNdjson = process.argv.includes("--ndjson");
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!dryRun && !asNdjson && !projectId) {
  console.error(
    "SANITY_STUDIO_PROJECT_ID is not set. Copy .env.example to .env first."
  );
  process.exit(1);
}
if (!dryRun && !asNdjson && !token) {
  console.error(
    "SANITY_WRITE_TOKEN is not set. Create an editor token at\n" +
      `https://www.sanity.io/manage/project/${projectId}/api#tokens`
  );
  process.exit(1);
}

const documents = buildDocuments();

if (asNdjson) {
  // One document per line, for `sanity dataset import`, which authenticates
  // with the CLI session rather than a token.
  process.stdout.write(
    documents.map((doc) => JSON.stringify(doc)).join("\n") + "\n"
  );
  process.exit(0);
}

if (dryRun) {
  console.log(JSON.stringify(documents, null, 2));
  console.log(
    `\nDry run — ${documents.length} documents built, nothing written.`
  );
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.SANITY_STUDIO_API_VERSION || "2026-08-10",
  useCdn: false,
});

const transaction = documents.reduce(
  (tx, doc) => tx.createOrReplace(doc),
  client.transaction()
);

await transaction.commit();

for (const doc of documents) {
  console.log(`  ✓ ${doc._id}`);
}
console.log(
  `\nSeeded ${documents.length} documents into ${projectId}/${dataset}.`
);
