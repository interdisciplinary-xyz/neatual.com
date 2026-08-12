import { sanityClient, isSanityConfigured, localized } from "./sanity.js";
import { LOCALES } from "./locales.js";
import {
  HREFLANG_URLS,
  LOCALE_CODES,
  PAGE_KEYS,
  DEFAULT_LOCALE,
} from "./seo.js";
import { htmlToBlocks, tidy } from "./portableText.js";
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
  formatAddress,
} from "./inlineCopy.js";

export const CONTENT_QUERY = `{
  "pages": *[_type == "page"]{
    pageKey, path, navLabel, srHeading, metaTitle, metaDescription,
    heading, shortDescription, body,
    pricingIsPlaceholder, pricingIntro, pricingRows, pricingNotes
  },
  "products": *[_type == "product"] | order(order asc){
    order, slug, imageBase, photoCount, name, price, descriptionLines, alt,
    intro, metaTitle, metaDescription
  },
  "settings": *[_type == "siteSettings"][0]{
    wordmark, brandName, skipLink, phone, email, address, messageCta, callCta,
    ctaHeading, ctaBody, error, a11y
  }
}`;

const NAV_INDEX = { home: 0, gallery: 1, pricing: 2, contact: 3 };

/**
 * The pricing payload, in the shape both resolvers return.
 *
 * Kept as one helper because the placeholder guard has to behave identically
 * whichever source answered: if the CMS has not had real rates entered yet, the
 * page must still declare itself provisional. `pricingIsPlaceholder` therefore
 * defaults to *true* on a missing value rather than false — an unset flag means
 * nobody has confirmed the numbers, which is exactly the case the notice and the
 * noindex exist for.
 */
function pricingFrom(page, locale, resolve) {
  if (!page) return null;
  const rows = resolve(page.pricingRows) ?? [];
  return {
    isPlaceholder: page.pricingIsPlaceholder !== false,
    // Bundled, never resolved from the CMS. A notice whose entire job is to say
    // "these numbers are not real" must not be removable by clearing a Studio
    // field — that would leave fabricated rates on a live page with nothing
    // marking them as fabricated.
    placeholderNotice: PRICING.placeholderNotice[locale],
    intro: resolve(page.pricingIntro) ?? PRICING.intro[locale],
    columns: Object.fromEntries(
      Object.entries(PRICING.columns).map(([key, value]) => [
        key,
        value[locale],
      ])
    ),
    rows: rows.length
      ? rows
      : PRICING.rows.map((row) => ({
          key: row.key,
          label: row.label[locale],
          unit: row.unit[locale],
          price: row.price[locale],
        })),
    notes: resolve(page.pricingNotes) ?? PRICING.notes.map((n) => n[locale]),
  };
}

/**
 * The site-wide CTA. Lives on siteSettings, not on a page. Nothing renders it
 * since the call to action was taken off the pages — the field is kept so the
 * copy stays written and editable, and so restoring the block is a component
 * rather than a content migration.
 */
function ctaFrom(settings, locale, resolve) {
  return {
    heading: resolve(settings?.ctaHeading) ?? CTA.heading[locale],
    body: resolve(settings?.ctaBody) ?? CTA.body[locale],
  };
}

/** The 404 and 500 copy, from the CMS where it exists and locales.js where it doesn't. */
function errorFrom(settings, locale, resolve) {
  const bundled = (LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE]).error;
  return Object.fromEntries(
    Object.keys(bundled).map((key) => [
      key,
      resolve(settings?.error?.[key]) ?? bundled[key],
    ])
  );
}

/**
 * One gallery category, in the shape both resolvers return.
 *
 * `slug` falls back to `imageBase` so the six documents seeded before the slug
 * field existed keep their current URLs. The two are separate fields because one
 * is a published address and the other is a folder on disk: renaming a category
 * in the Studio should not require moving image files, and moving image files
 * should not 404 a page Google has indexed.
 *
 * `metaTitle` and `metaDescription` are composed when the CMS leaves them empty,
 * from copy that already exists in all three languages. Six category pages
 * inheriting the gallery's title would be six pages competing for one query;
 * composing a title here means an editor gets a reasonable one by default and a
 * deliberate one whenever they write it.
 */
function categoryFrom(product, locale, resolve, siteTitle) {
  const name = resolve(product.name);
  const alt = resolve(product.alt);
  const descriptionLines = resolve(product.descriptionLines) ?? [];

  return {
    order: product.order,
    slug: product.slug ?? product.imageBase,
    imageBase: product.imageBase,
    photoCount: product.photoCount ?? 4,
    name,
    price: resolve(product.price),
    descriptionLines,
    alt,
    intro: resolve(product.intro) ?? null,
    metaTitle: resolve(product.metaTitle) ?? `${siteTitle} — ${name}`,
    metaDescription:
      resolve(product.metaDescription) ??
      [alt, ...descriptionLines].filter(Boolean).join(". ") + ".",
  };
}

let warned = false;
function warnOnce(reason) {
  if (warned) return;
  warned = true;
  console.warn(`[content] Falling back to app/lib/locales.js — ${reason}`);
}

/** Shape produced from app/lib/locales.js, used when Sanity can't answer. */
export function fromLocales(locale) {
  const config = LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE];

  const pages = Object.fromEntries(
    PAGE_KEYS.map((pageKey) => {
      const isHome = pageKey === "home";
      return [
        pageKey,
        {
          pageKey,
          path: HREFLANG_URLS[locale][pageKey],
          navLabel: config.navItems[NAV_INDEX[pageKey]].label,
          srHeading: isHome
            ? HOME_SR_HEADING[locale]
            : config.headings[pageKey],
          metaTitle: isHome
            ? config.title
            : `${config.title} — ${PAGE_META[pageKey].suffix[locale]}`,
          metaDescription: isHome
            ? config.description
            : PAGE_META[pageKey].description[locale],
          heading: isHome ? tidy(config.home.heading) : undefined,
          shortDescription: isHome
            ? tidy(config.home.shortDescription)
            : undefined,
          body: isHome
            ? htmlToBlocks(config.home.fullDescription, `home-${locale}`)
            : [],
        },
      ];
    })
  );

  // Shaped like a Sanity product document and put through the same resolver, so
  // the composed meta and the slug fallback cannot behave differently depending
  // on which source answered.
  const products = PRODUCTS.map((product, index) =>
    categoryFrom(
      {
        order: index + 1,
        slug: product.slug,
        imageBase: product.slug,
        photoCount: product.photoCount,
        name: product.name[locale],
        price: PRODUCT_SHARED.price[locale],
        descriptionLines: PRODUCT_SHARED.descriptionLines[locale],
        alt: product.alt[locale],
      },
      locale,
      (value) => value,
      config.title
    )
  );

  return {
    source: "locales",
    locale,
    pages,
    // `{}` with a resolver that never resolves: every field falls through to the
    // bundled PRICING copy, which is the whole point of this branch.
    pricing: pricingFrom({}, locale, () => undefined),
    cta: ctaFrom(null, locale, () => undefined),
    error: errorFrom(null, locale, () => undefined),
    products,
    paths: HREFLANG_URLS,
    settings: {
      wordmark: BRAND.wordmark,
      brandName: BRAND.name,
      skipLink: SKIP_LINK[locale],
      phone: config.contact.phone,
      email: config.contact.email,
      address: ADDRESS,
      addressLine: formatAddress(ADDRESS, locale),
      messageCta: config.contact.message,
      callCta: config.contact.call,
      a11y: {
        close: config.a11y.close,
        homeLink: config.a11y.homeLink,
        selectProduct: A11Y_LABELS.selectProduct[locale],
        selectPhoto: A11Y_LABELS.selectPhoto[locale],
        photoAlt: A11Y_LABELS.photoAlt[locale],
        call: A11Y_LABELS.call[locale],
        email: A11Y_LABELS.email[locale],
        expand: A11Y_LABELS.expand[locale],
        langNav: A11Y_LABELS.langNav[locale],
        mainNav: A11Y_LABELS.mainNav[locale],
      },
    },
  };
}

/** Same shape, resolved from a Sanity response. */
export function fromSanity(data, locale) {
  const pages = Object.fromEntries(
    data.pages.map((page) => [
      page.pageKey,
      {
        pageKey: page.pageKey,
        path: localized(page.path, locale),
        navLabel: localized(page.navLabel, locale),
        srHeading: localized(page.srHeading, locale),
        metaTitle: localized(page.metaTitle, locale),
        metaDescription: localized(page.metaDescription, locale),
        heading: localized(page.heading, locale),
        shortDescription: localized(page.shortDescription, locale),
        body: localized(page.body, locale) ?? [],
      },
    ])
  );

  // Rebuilt per locale so hreflang and the sitemap read CMS paths, not constants.
  const paths = Object.fromEntries(
    LOCALE_CODES.map((code) => [
      code,
      Object.fromEntries(
        data.pages.map((p) => [p.pageKey, localized(p.path, code)])
      ),
    ])
  );

  const resolve = (value) => localized(value, locale);

  // The composed category title reads "<site title> — <category>", and the site
  // title is the home page's meta title in the CMS. Falls back to the bundled
  // one only if the home document has no title for this locale.
  const siteTitle =
    pages.home?.metaTitle ?? (LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE]).title;

  const products = (data.products ?? []).map((p) =>
    categoryFrom(p, locale, resolve, siteTitle)
  );

  const s = data.settings;
  return {
    source: "sanity",
    locale,
    pages,
    pricing: pricingFrom(
      data.pages.find((p) => p.pageKey === "pricing"),
      locale,
      resolve
    ),
    cta: ctaFrom(s, locale, resolve),
    error: errorFrom(s, locale, resolve),
    products,
    paths,
    settings: {
      wordmark: s.wordmark ?? BRAND.wordmark,
      brandName: s.brandName ?? BRAND.name,
      skipLink: resolve(s.skipLink) ?? SKIP_LINK[locale],
      phone: s.phone,
      email: s.email,
      address: s.address,
      addressLine: formatAddress(s.address, locale),
      messageCta: localized(s.messageCta, locale),
      callCta: localized(s.callCta, locale),
      a11y: Object.fromEntries(
        Object.entries(s.a11y ?? {}).map(([key, value]) => [
          key,
          localized(value, locale),
        ])
      ),
    },
  };
}

/**
 * The accessibility labels are the one part of the payload whose absence is
 * invisible. A missing page or product shows up immediately; a missing
 * `a11y.close` renders an icon-only button with no accessible name, and a
 * missing `a11y.photoAlt` renders `alt=""` on a content image. Nothing throws,
 * nothing looks wrong, and the regression only surfaces in an audit.
 *
 * The key set is derived from the bundled copy rather than hardcoded, so it
 * cannot drift from the contract the components are written against. The check
 * runs on the *resolved* value, which also catches a label that exists in the
 * CMS but has no translation for the locale being rendered.
 */
const REQUIRED_A11Y_KEYS = Object.keys(
  fromLocales(DEFAULT_LOCALE).settings.a11y
);

// Exported for the spec: this is the guard whose failure mode is silence, so
// it is the one worth testing directly rather than through getContent.
export function missingA11yLabels(settings) {
  return REQUIRED_A11Y_KEYS.filter((key) => {
    const value = settings?.a11y?.[key];
    return typeof value !== "string" || value.trim() === "";
  });
}

/**
 * Single entry point for page content. Always resolves — never throws — so a
 * Sanity outage degrades to the bundled copy instead of taking the site down.
 */
export async function getContent(locale) {
  if (!isSanityConfigured) {
    warnOnce("SANITY_STUDIO_PROJECT_ID is not set");
    return fromLocales(locale);
  }

  try {
    const data = await sanityClient.fetch(CONTENT_QUERY);
    const missing = PAGE_KEYS.filter(
      (key) => !data?.pages?.some((page) => page.pageKey === key)
    );
    if (missing.length || !data?.settings || !data?.products?.length) {
      warnOnce(
        `incomplete CMS response (missing: ${missing.join(", ") || (!data?.settings ? "siteSettings" : "products")})`
      );
      return fromLocales(locale);
    }

    const content = fromSanity(data, locale);
    const missingLabels = missingA11yLabels(content.settings);
    if (missingLabels.length) {
      warnOnce(
        `CMS response is missing accessibility labels (${missingLabels.join(", ")})`
      );
      return fromLocales(locale);
    }

    return content;
  } catch (error) {
    warnOnce(`Sanity request failed: ${error.message}`);
    return fromLocales(locale);
  }
}
