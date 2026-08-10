/**
 * Content tooling for the pl/en/de copy.
 *
 * The site reads from Sanity but falls back to the copy bundled in
 * app/lib/locales.js and app/lib/inlineCopy.js. Those two must agree: when they
 * drifted earlier, a page rendered different text depending on which source
 * answered, and nothing failed — it just quietly served the wrong words.
 *
 *   pnpm content:check           compare Sanity against the bundled fallback
 *   pnpm content:pull            export the editable copy to content.json
 *   pnpm content:push [file]     write an edited export back to Sanity
 *
 * push needs write access: either `sanity login` (used automatically) or
 * SANITY_WRITE_TOKEN.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@sanity/client";
import {
  CONTENT_QUERY,
  fromLocales,
  fromSanity,
} from "../app/lib/content.server.js";
import { LOCALE_CODES, PAGE_KEYS } from "../app/lib/seo.js";

const DEFAULT_FILE = "content.json";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2026-08-10";

if (!projectId) {
  console.error("SANITY_STUDIO_PROJECT_ID is not set. Copy .env.example to .env.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

/** Fields worth comparing — everything a visitor can read. */
const PAGE_FIELDS = [
  "path",
  "navLabel",
  "srHeading",
  "metaTitle",
  "metaDescription",
  "heading",
  "shortDescription",
];

const blocksToText = (body) =>
  (body ?? []).map((b) => b.children?.map((c) => c.text).join("") ?? "").join("\n\n");

async function loadSanity(locale) {
  const data = await client.fetch(CONTENT_QUERY);
  return fromSanity(data, locale);
}

async function check() {
  let drift = 0;
  const report = (where, field, cms, local) => {
    drift += 1;
    console.log(`  DRIFT ${where} ${field}`);
    console.log(`    sanity  : ${JSON.stringify(cms)}`);
    console.log(`    fallback: ${JSON.stringify(local)}`);
  };

  for (const locale of LOCALE_CODES) {
    const cms = await loadSanity(locale);
    const local = fromLocales(locale);

    for (const key of PAGE_KEYS) {
      for (const field of PAGE_FIELDS) {
        const a = cms.pages[key]?.[field];
        const b = local.pages[key]?.[field];
        if (JSON.stringify(a) !== JSON.stringify(b)) report(`${locale}/${key}`, field, a, b);
      }
      const a = blocksToText(cms.pages[key]?.body);
      const b = blocksToText(local.pages[key]?.body);
      if (a !== b) report(`${locale}/${key}`, "body", a.slice(0, 60), b.slice(0, 60));
    }

    for (const field of ["phone", "email", "addressLine", "messageCta", "callCta"]) {
      if (cms.settings[field] !== local.settings[field]) {
        report(`${locale}/settings`, field, cms.settings[field], local.settings[field]);
      }
    }
    for (const key of Object.keys(local.settings.a11y)) {
      if (cms.settings.a11y[key] !== local.settings.a11y[key]) {
        report(`${locale}/a11y`, key, cms.settings.a11y[key], local.settings.a11y[key]);
      }
    }
    for (const [i, product] of local.products.entries()) {
      const other = cms.products[i];
      for (const field of ["name", "price", "alt"]) {
        if (product[field] !== other?.[field]) {
          report(`${locale}/product[${i}]`, field, other?.[field], product[field]);
        }
      }
    }
  }

  if (drift === 0) {
    console.log("✓ Sanity and the bundled fallback agree on every field.");
    return 0;
  }
  console.log(
    `\n${drift} field(s) differ. The site will render different text depending on\n` +
      `whether Sanity answers. Update app/lib/locales.js or app/lib/inlineCopy.js\n` +
      `to match, or re-run pnpm seed:sanity:import if the code is the source of truth.`
  );
  return 1;
}

/** Editable projection: one entry per document, localized fields kept together. */
async function pull(file) {
  const docs = await client.fetch(
    `*[_type in ["page","siteSettings","product"]]|order(_type asc, order asc, pageKey asc)`
  );
  const out = docs.map((doc) => {
    const { _rev, _createdAt, _updatedAt, ...rest } = doc;
    return rest;
  });
  await writeFile(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${out.length} documents to ${file}`);
  console.log("Edit the localized fields, then: pnpm content:push");
  return 0;
}

async function push(file) {
  const raw = await readFile(file, "utf8");
  const docs = JSON.parse(raw);
  if (!Array.isArray(docs) || docs.length === 0) {
    console.error(`${file} does not contain a document array.`);
    return 1;
  }
  for (const doc of docs) {
    if (!doc._id || !doc._type) {
      console.error(`Every document needs _id and _type. Offender: ${JSON.stringify(doc).slice(0, 80)}`);
      return 1;
    }
    if (doc._id.includes(".")) {
      // Sanity's default public read grant is `_id in path("*")`, which matches
      // only dotless ids — a dotted id is invisible to anonymous readers.
      console.error(`Document id "${doc._id}" contains a dot; use hyphens instead.`);
      return 1;
    }
  }
  if (!process.env.SANITY_WRITE_TOKEN) {
    console.error(
      "SANITY_WRITE_TOKEN is not set. Either export one, or write the file with\n" +
        "  pnpm exec sanity dataset import <ndjson> production --replace\n" +
        "which authenticates with your `sanity login` session."
    );
    return 1;
  }
  const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction());
  await tx.commit();
  console.log(`Pushed ${docs.length} documents to ${projectId}/${dataset}.`);
  console.log("Now run pnpm content:check — the bundled fallback has not moved.");
  return 0;
}

const [mode = "--check", arg] = process.argv.slice(2);
const exitCode =
  mode === "--pull"
    ? await pull(arg || DEFAULT_FILE)
    : mode === "--push"
      ? await push(arg || DEFAULT_FILE)
      : await check();
process.exit(exitCode);
