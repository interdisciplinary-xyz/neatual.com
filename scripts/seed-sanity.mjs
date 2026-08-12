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
  BRAND,
  SKIP_LINK,
  HOME_SR_HEADING,
  A11Y_LABELS,
  CTA,
  PAGE_META,
  PRICING,
  PRODUCTS,
  PRODUCT_SHARED,
  ADDRESS,
  fillTemplate,
} from "../app/lib/inlineCopy.js";

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

const NAV_INDEX = { home: 0, gallery: 1, pricing: 2, contact: 3 };

/** Builds a { pl, en, de } object by running `pick` for each locale. */
const byLocale = (pick) =>
  Object.fromEntries(
    LOCALE_CODES.map((code) => [code, pick(LOCALES[code], code)])
  );

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

  if (pageKey === "pricing") {
    // Seeded with `pricingIsPlaceholder: true` on purpose. The rates below are
    // the em-dash placeholders from inlineCopy.js, and the flag is what keeps
    // the page carrying its "not an offer" notice and its noindex until an
    // editor replaces them and turns it off.
    doc.pricingIsPlaceholder = PRICING.isPlaceholder;
    doc.pricingIntro = byLocale((_, code) => PRICING.intro[code]);
    doc.pricingRows = Object.fromEntries(
      LOCALE_CODES.map((code) => [
        code,
        PRICING.rows.map((row) => ({
          _key: row.key,
          _type: "object",
          key: row.key,
          label: row.label[code],
          unit: row.unit[code],
          price: row.price[code],
        })),
      ])
    );
    doc.pricingNotes = Object.fromEntries(
      LOCALE_CODES.map((code) => [code, PRICING.notes.map((n) => n[code])])
    );
  }

  if (pageKey === "home") {
    doc.heading = byLocale((config) => tidy(config.home.heading));
    doc.shortDescription = byLocale((config) =>
      tidy(config.home.shortDescription)
    );
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
    wordmark: BRAND.wordmark,
    brandName: BRAND.name,
    skipLink: byLocale((_, code) => SKIP_LINK[code]),
    phone,
    email,
    address: ADDRESS,
    messageCta: byLocale((config) => config.contact.message),
    callCta: byLocale((config) => config.contact.call),
    ctaHeading: byLocale((_, code) => CTA.heading[code]),
    ctaBody: byLocale((_, code) => CTA.body[code]),
    error: {
      notFoundHeading: byLocale((config) => config.error.notFoundHeading),
      notFoundBody: byLocale((config) => config.error.notFoundBody),
      errorHeading: byLocale((config) => config.error.errorHeading),
      errorBody: byLocale((config) => config.error.errorBody),
      backHome: byLocale((config) => config.error.backHome),
    },
    a11y: {
      close: byLocale((config) => config.a11y.close),
      homeLink: byLocale((config) => config.a11y.homeLink),
      call: A11Y_LABELS.call,
      email: A11Y_LABELS.email,
      expand: A11Y_LABELS.expand,
      langNav: A11Y_LABELS.langNav,
      mainNav: A11Y_LABELS.mainNav,
      openMenu: A11Y_LABELS.openMenu,
      selectProduct: A11Y_LABELS.selectProduct,
      selectPhoto: A11Y_LABELS.selectPhoto,
      photoAlt: A11Y_LABELS.photoAlt,
    },
  };
}

function buildProduct(product, index) {
  return {
    _id: `product-${product.slug}`,
    _type: "product",
    order: index + 1,
    // The URL and the image folder are seeded from the same word. They are
    // separate fields so an editor can change one without the other.
    slug: product.slug,
    imageBase: product.slug,
    photoCount: product.photoCount,
    name: byLocale((_, code) => product.name[code]),
    price: byLocale((_, code) => PRODUCT_SHARED.price[code]),
    descriptionLines: byLocale(
      (_, code) => PRODUCT_SHARED.descriptionLines[code]
    ),
    alt: byLocale((_, code) => product.alt[code]),
  };
}

const documents = [
  ...PAGE_KEYS.map(buildPage),
  ...PRODUCTS.map(buildProduct),
  buildSiteSettings(),
];

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
