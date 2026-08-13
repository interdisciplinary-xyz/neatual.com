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
  SERVICES,
  SERVICE_SHARED,
  SERVICES_INTRO,
  ADDRESS,
  formatAddress,
} from "./inlineCopy.js";

export const CONTENT_QUERY = `{
  "pages": *[_type == "page"]{
    pageKey, path, navLabel, srHeading, metaTitle, metaDescription,
    heading, shortDescription, body,
    pricingIsPlaceholder, pricingIntro, pricingColumns, pricingRows, pricingNotes
  },
  "products": *[_type == "product"] | order(order asc){
    order, slug, slugs, imageBase, photoCount, name, price, descriptionLines, alt,
    intro, metaTitle, metaDescription
  },
  "services": *[_type == "service"] | order(order asc){
    order, slug, slugs, pricingKey, categories, name, intro, scope,
    metaTitle, metaDescription
  },
  "settings": *[_type == "siteSettings"][0]{
    wordmark, brandName, skipLink, phone, email, address, messageCta, callCta,
    ctaHeading, ctaBody, serviceLabels, error, a11y
  }
}`;

const NAV_INDEX = { home: 0, services: 1, gallery: 2, pricing: 3, contact: 4 };

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
    // Per column, not all-or-nothing: a CMS that has two of the three headings
    // should show those two and fall back for the third, rather than discard
    // both because the object was incomplete.
    columns: Object.fromEntries(
      Object.entries(PRICING.columns).map(([key, value]) => [
        key,
        resolve(page.pricingColumns?.[key]) ?? value[locale],
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
    // The canonical id, not an address. `imageBase` backs it for the six
    // documents seeded before the field existed.
    slug: product.slug ?? product.imageBase,
    // Passed through unresolved, on purpose: this is the only field on the
    // payload that every *other* locale needs. The hreflang links and the
    // sitemap have to render the German URL while serving the Polish page, so
    // resolving it here to one string would make those two impossible.
    slugs: slugsFor(product),
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

/**
 * The `{pl, en, de}` URL segments for one document.
 *
 * Falls back to the canonical id in every locale when no translated slugs
 * exist, which is what a category added in the Studio looks like until someone
 * fills the field in. That yields the old shared-slug behaviour rather than a
 * page with no address at all.
 */
function slugsFor(doc) {
  const id = doc.slug ?? doc.imageBase;
  const slugs = doc.slugs ?? {};
  return Object.fromEntries(
    LOCALE_CODES.map((code) => [code, slugs[code] || id])
  );
}

/**
 * One service page, in the shape both resolvers return.
 *
 * `pricingKey` and `categories` are references rather than copy: the first names
 * the row in the price table this page describes, the second the gallery
 * categories that illustrate it. Both are resolved at render time, so a category
 * renamed in the Studio updates the links on every service page that points at
 * it without anybody editing those pages.
 */
function serviceFrom(service, locale, resolve, siteTitle) {
  const name = resolve(service.name);
  const intro = resolve(service.intro);

  return {
    order: service.order,
    slug: service.slug,
    slugs: slugsFor(service),
    pricingKey: service.pricingKey ?? null,
    categories: service.categories ?? [],
    name,
    intro: intro ?? null,
    scope: resolve(service.scope) ?? [],
    metaTitle: resolve(service.metaTitle) ?? `${siteTitle} — ${name}`,
    metaDescription: resolve(service.metaDescription) ?? intro ?? "",
  };
}

/**
 * The fixed headings and links every service page renders around its content.
 *
 * On siteSettings rather than on each service, the same way the site-wide CTA
 * is: they are identical on all six pages, and as per-service fields they would
 * be six copies to keep in step. Resolved key by key so a partially filled set
 * in the Studio falls back per label rather than wholesale.
 */
function serviceLabelsFrom(settings, locale, resolve) {
  return Object.fromEntries(
    Object.entries(SERVICE_SHARED).map(([key, value]) => [
      key,
      resolve(settings?.serviceLabels?.[key]) ?? value[locale],
    ])
  );
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
          // The home page and the services hub are the two pages with prose
          // above their content; the gallery, price list and contact page carry
          // none. The hub's is not optional — a page that is only a list of
          // links is a page with nothing for a search engine to read.
          shortDescription: isHome
            ? tidy(config.home.shortDescription)
            : pageKey === "services"
              ? SERVICES_INTRO[locale]
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
        slugs: product.slugs,
        imageBase: product.slug,
        photoCount: product.photoCount,
        name: product.name[locale],
        price: PRODUCT_SHARED.price[locale],
        descriptionLines: PRODUCT_SHARED.descriptionLines[locale],
        alt: product.alt[locale],
        intro: product.intro?.[locale],
        metaTitle: product.metaTitle?.[locale],
        metaDescription: product.metaDescription?.[locale],
      },
      locale,
      (value) => value,
      config.title
    )
  );

  const services = SERVICES.map((service, index) =>
    serviceFrom(
      {
        order: index + 1,
        slug: service.slug,
        slugs: service.slugs,
        pricingKey: service.pricingKey,
        categories: service.categories,
        name: service.name[locale],
        intro: service.intro[locale],
        scope: service.scope[locale],
        metaTitle: service.metaTitle?.[locale],
        metaDescription: service.metaDescription?.[locale],
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
    services,
    serviceLabels: serviceLabelsFrom(null, locale, () => undefined),
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
        openMenu: A11Y_LABELS.openMenu[locale],
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

  // Falls back to the bundled set rather than rendering an empty hub: the
  // `service` documents are newer than the rest of the schema, so a dataset that
  // has not been reseeded since they were added would otherwise serve six live
  // URLs with nothing on them. Unlike the page keys, an absent services
  // collection does not fail the whole payload — see getContent.
  const services = data.services?.length
    ? data.services.map((s) => serviceFrom(s, locale, resolve, siteTitle))
    : fromLocales(locale).services;

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
    services,
    serviceLabels: serviceLabelsFrom(s, locale, resolve),
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
