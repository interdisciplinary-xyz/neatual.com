/**
 * One-shot migration: lifts the hardcoded content in app/lib/locales.js into
 * Sanity as three `page` documents plus the `siteSettings` singleton.
 *
 * Idempotent — uses createOrReplace against fixed document IDs, so re-running
 * overwrites rather than duplicating. That also means it will discard edits
 * made in the Studio, so run it to seed, not to sync.
 *
 *   pnpm seed:sanity:import        # no token needed — uses your `sanity login`
 *   SANITY_WRITE_TOKEN=... pnpm seed:sanity
 *   pnpm seed:sanity --dry-run     # print the documents, write nothing
 *   pnpm seed:sanity --ndjson      # emit ndjson for `sanity dataset import`
 */
import { createClient } from "@sanity/client";
import { LOCALES } from "../app/lib/locales.js";
import { LOCALE_CODES, PAGE_KEYS, HREFLANG_URLS } from "../app/lib/seo.js";
import { htmlToBlocks, tidy } from "../app/lib/portableText.js";
import {
  HOME_SR_HEADING,
  A11Y_LABELS,
  PAGE_META,
  PRODUCT_COPY,
  ADDRESS,
  fillTemplate,
} from "../app/lib/inlineCopy.js";

const dryRun = process.argv.includes("--dry-run");
const asNdjson = process.argv.includes("--ndjson");
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!dryRun && !asNdjson && !projectId) {
  console.error("SANITY_STUDIO_PROJECT_ID is not set. Copy .env.example to .env first.");
  process.exit(1);
}
if (!dryRun && !asNdjson && !token) {
  console.error(
    "SANITY_WRITE_TOKEN is not set. Create an editor token at\n" +
      `https://www.sanity.io/manage/project/${projectId}/api#tokens`
  );
  process.exit(1);
}


const NAV_INDEX = { home: 0, gallery: 1, contact: 2 };


/** Builds a { pl, en, de } object by running `pick` for each locale. */
const byLocale = (pick) =>
  Object.fromEntries(LOCALE_CODES.map((code) => [code, pick(LOCALES[code], code)]));

function buildPage(pageKey) {
  const meta = PAGE_META[pageKey];

  const doc = {
    // Hyphen, not a dot. Sanity treats dots in an _id as path segments, and the
    // default public read grant is `_id in path("*")`, which matches only
    // dotless IDs — `page.home` would be invisible to anonymous readers while
    // `siteSettings` stayed visible.
    _id: `page-${pageKey}`,
    _type: "page",
    pageKey,
    path: Object.fromEntries(
      LOCALE_CODES.map((code) => [code, HREFLANG_URLS[code][pageKey]])
    ),
    navLabel: byLocale((config) => config.navItems[NAV_INDEX[pageKey]].label),
    srHeading: byLocale((config, code) =>
      pageKey === "home" ? HOME_SR_HEADING[code] : config.headings[pageKey]
    ),
    metaTitle: byLocale((config, code) =>
      meta ? `${config.title} — ${meta.suffix[code]}` : config.title
    ),
    metaDescription: byLocale((config, code) =>
      meta ? meta.description[code] : config.description
    ),
  };

  if (pageKey === "home") {
    doc.heading = byLocale((config) => tidy(config.home.heading));
    doc.shortDescription = byLocale((config) => tidy(config.home.shortDescription));
    doc.body = Object.fromEntries(
      LOCALE_CODES.map((code) => [
        code,
        htmlToBlocks(LOCALES[code].home.fullDescription, `home-${code}`),
      ])
    );
  }

  return doc;
}

function buildSiteSettings() {
  // Phone and email are identical in all three locales today, so they are
  // stored once rather than translated.
  const { phone, email } = LOCALES.pl.contact;
  return {
    _id: "siteSettings",
    _type: "siteSettings",
    phone,
    email,
    address: ADDRESS,
    messageCta: byLocale((config) => config.contact.message),
    callCta: byLocale((config) => config.contact.call),
    a11y: {
      close: byLocale((config) => config.a11y.close),
      homeLink: byLocale((config) => config.a11y.homeLink),
      call: A11Y_LABELS.call,
      email: A11Y_LABELS.email,
      expand: A11Y_LABELS.expand,
      langNav: A11Y_LABELS.langNav,
      mainNav: A11Y_LABELS.mainNav,
      selectProduct: A11Y_LABELS.selectProduct,
      selectPhoto: A11Y_LABELS.selectPhoto,
      photoAlt: A11Y_LABELS.photoAlt,
    },
  };
}

function buildProduct(n) {
  return {
    _id: `product-${n}`,
    _type: "product",
    order: n,
    imageBase: `produkt-${n}`,
    photoCount: PRODUCT_COPY.photoCount,
    name: byLocale((_, code) => fillTemplate(PRODUCT_COPY.name[code], { n })),
    price: byLocale((_, code) => PRODUCT_COPY.price[code]),
    descriptionLines: byLocale((_, code) => PRODUCT_COPY.descriptionLines[code]),
    alt: byLocale((_, code) => fillTemplate(PRODUCT_COPY.alt[code], { n })),
  };
}

const documents = [
  ...PAGE_KEYS.map(buildPage),
  ...PRODUCT_COPY.numbers.map(buildProduct),
  buildSiteSettings(),
];

if (asNdjson) {
  // One document per line, for `sanity dataset import`, which authenticates
  // with the CLI session rather than a token.
  process.stdout.write(documents.map((doc) => JSON.stringify(doc)).join("\n") + "\n");
  process.exit(0);
}

if (dryRun) {
  console.log(JSON.stringify(documents, null, 2));
  console.log(`\nDry run — ${documents.length} documents built, nothing written.`);
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
console.log(`\nSeeded ${documents.length} documents into ${projectId}/${dataset}.`);
