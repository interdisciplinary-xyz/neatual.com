/**
 * Builds the Sanity documents from the bundled copy in app/lib.
 *
 * Split out of seed-sanity.mjs so it can be imported without the CLI around it:
 * the script exits the process when its environment is not configured, which a
 * test cannot do. test/cms-coverage.spec.js feeds these documents through
 * fromSanity() to prove that every field the site renders can be edited in the
 * Studio — a claim nothing else in the suite checks, and one that quietly stops
 * being true every time a new string is added to the bundled copy instead of to
 * a schema.
 */
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
  SERVICES,
  SERVICES_INTRO,
  SERVICE_SHARED,
  ADDRESS,
} from "../app/lib/inlineCopy.js";

const NAV_INDEX = { home: 0, services: 1, gallery: 2, pricing: 3, contact: 4 };

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
    doc.pricingColumns = Object.fromEntries(
      Object.entries(PRICING.columns).map(([key, value]) => [
        key,
        byLocale((_, code) => value[code]),
      ])
    );
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

  if (pageKey === "services") {
    doc.shortDescription = byLocale((_, code) => SERVICES_INTRO[code]);
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
    serviceLabels: Object.fromEntries(
      Object.entries(SERVICE_SHARED).map(([key, value]) => [
        key,
        byLocale((_, code) => value[code]),
      ])
    ),
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
    // Three separate identifiers, seeded together but independent afterwards:
    // `slug` is the reference id other documents point at, `slugs` are the
    // published addresses (one per language), `imageBase` is the folder on disk.
    slug: product.slug,
    slugs: byLocale((_, code) => product.slugs[code]),
    imageBase: product.slug,
    photoCount: product.photoCount,
    name: byLocale((_, code) => product.name[code]),
    price: byLocale((_, code) => PRODUCT_SHARED.price[code]),
    descriptionLines: byLocale(
      (_, code) => PRODUCT_SHARED.descriptionLines[code]
    ),
    alt: byLocale((_, code) => product.alt[code]),
    intro: byLocale((_, code) => product.intro[code]),
    metaTitle: byLocale((_, code) => product.metaTitle[code]),
    metaDescription: byLocale((_, code) => product.metaDescription[code]),
  };
}

function buildService(service, index) {
  return {
    _id: `service-${service.slug}`,
    _type: "service",
    order: index + 1,
    slug: service.slug,
    slugs: byLocale((_, code) => service.slugs[code]),
    pricingKey: service.pricingKey,
    categories: service.categories,
    name: byLocale((_, code) => service.name[code]),
    intro: byLocale((_, code) => service.intro[code]),
    scope: byLocale((_, code) => service.scope[code]),
    metaTitle: byLocale((_, code) => service.metaTitle[code]),
    metaDescription: byLocale((_, code) => service.metaDescription[code]),
  };
}

export const buildDocuments = () => [
  ...PAGE_KEYS.map(buildPage),
  ...SERVICES.map(buildService),
  ...PRODUCTS.map(buildProduct),
  buildSiteSettings(),
];

export { buildPage, buildProduct, buildService, buildSiteSettings };
