export const SITE_URL = "https://neatual.com";

export const LOCALE_CODES = ["pl", "en", "de"];

// Order is nav order: navItemsFrom() in useContent.js maps over this array, so
// the header and footer render in this sequence. It reads as the funnel a
// visitor actually walks: what we do, what it looks like, what it costs, how to
// reach us. Services sits ahead of the gallery because it is the page that
// answers the query — the gallery is the proof that follows it.
export const PAGE_KEYS = ["home", "services", "gallery", "pricing", "contact"];

// Every page in every locale. The hreflang <link> tags in root.jsx and the
// <url> entries in sitemap.xml both read from this map so the two can't drift.
export const HREFLANG_URLS = {
  pl: {
    home: "/",
    services: "/uslugi",
    gallery: "/galeria",
    pricing: "/cennik",
    contact: "/kontakt",
  },
  en: {
    home: "/en",
    services: "/en/services",
    gallery: "/en/gallery",
    pricing: "/en/pricing",
    contact: "/en/contact",
  },
  de: {
    home: "/de",
    services: "/de/leistungen",
    gallery: "/de/galerie",
    pricing: "/de/preise",
    contact: "/de/kontakte",
  },
};

// Polish is the default locale, so it backs x-default.
export const DEFAULT_LOCALE = "pl";

// The gallery and, optionally, one category under it: /galeria/<slug> and its
// two translations. Anchored at the start, unlike the page tests below, because
// the captured group has to be a category slug and nothing else — an unanchored
// match would read the last segment of any deep path as a category.
const GALLERY_PATH =
  /^(?:\/(?:en|de))?\/(?:galeria|gallery|galerie)(?:\/([^/]+))?$/;

// Same shape for the service hub and one service under it: /uslugi/<slug>,
// /en/services/<slug>, /de/leistungen/<slug>.
const SERVICES_PATH =
  /^(?:\/(?:en|de))?\/(?:uslugi|services|leistungen)(?:\/([^/]+))?$/;

const normalizePath = (pathname) =>
  String(pathname || "/").replace(/\/$/, "") || "/";

// Which of the four pages a path points at, in any locale. Both the meta and
// the hreflang logic in root.jsx derived this separately before; keeping one
// implementation means they can't disagree about what page you're on.
//
// A category page counts as the gallery: it is the gallery's section of the
// site, so it takes the gallery's nav highlight and its CollectionPage type.
// Its title, description, canonical and alternates are still its own — see
// getGalleryCategorySlug and the callers in root.jsx.
export function getPageKey(pathname) {
  const path = normalizePath(pathname);
  if (GALLERY_PATH.test(path)) return "gallery";
  if (SERVICES_PATH.test(path)) return "services";
  if (/\/(cennik|pricing|preise)$/.test(path)) return "pricing";
  if (/\/(kontakt|contact|kontakte)$/.test(path)) return "contact";
  return "home";
}

/** The category slug in a gallery path, or null for the gallery index itself. */
export function getGalleryCategorySlug(pathname) {
  return normalizePath(pathname).match(GALLERY_PATH)?.[1] ?? null;
}

/** The service slug in a services path, or null for the hub itself. */
export function getServiceSlug(pathname) {
  return normalizePath(pathname).match(SERVICES_PATH)?.[1] ?? null;
}

/**
 * One entry's slug in one locale.
 *
 * Accepts either the localized `{pl, en, de}` map or a bare string. The string
 * form is what every document held before slugs were translated, and what a
 * category added in the Studio holds until someone fills in the other two
 * languages — so it has to keep resolving rather than 404 the page.
 */
export function localizedSlug(entry, locale) {
  const slugs = entry?.slugs ?? entry?.slug ?? entry;
  if (typeof slugs === "string") return slugs;
  if (!slugs || typeof slugs !== "object") return null;
  return slugs[locale] ?? slugs[DEFAULT_LOCALE] ?? null;
}

/**
 * Where a category lives in a given locale.
 *
 * The slug is now translated per locale: /galeria/montaz-fototapet-kwiatowych,
 * /en/gallery/floral-mural-installation, /de/galerie/montage-blumen-fototapeten
 * are one page in three languages. It used to be one shared Polish slug, which
 * kept the hreflang set mechanical at the cost of Polish words in the English
 * and German URLs and no keyword signal in either.
 *
 * The cost of translating them is this function and `findBySlug` below — the
 * lookup has to run in both directions, because a request arrives as a localized
 * segment and has to find the document, while the sitemap and the hreflang tags
 * hold the document and have to produce every locale's segment.
 *
 * `imageBase` is deliberately untouched by any of this: it is the folder under
 * public/gallery, so renaming a URL still never moves an image file.
 */
export function galleryCategoryPath(locale, category, paths = HREFLANG_URLS) {
  const base = paths[locale]?.gallery ?? HREFLANG_URLS[locale].gallery;
  return `${base}/${localizedSlug(category, locale)}`;
}

/** Where a service lives in a given locale. */
export function servicePath(locale, service, paths = HREFLANG_URLS) {
  const base = paths[locale]?.services ?? HREFLANG_URLS[locale].services;
  return `${base}/${localizedSlug(service, locale)}`;
}

/**
 * The document a localized URL segment addresses, or null.
 *
 * Strict about the locale: /galeria/floral-mural-installation does not resolve,
 * because that English segment is not the Polish page's address and serving the
 * same content at two URLs is the duplicate the translated slugs exist to avoid.
 * The routes turn that miss into a redirect rather than a 404 — see
 * `findByAnySlug`.
 */
export function findBySlug(entries, locale, segment) {
  if (!segment) return null;
  return (
    entries?.find((entry) => localizedSlug(entry, locale) === segment) ?? null
  );
}

/**
 * The document a segment addresses in *any* locale, plus its `imageBase`.
 *
 * This is the redirect path, not the render path. It catches three cases that
 * would otherwise 404: a URL from before the slugs were translated
 * (/galeria/kwiatowe), a visitor who hand-edited /en/ onto a Polish URL, and a
 * link built against another locale's slug. All three are the same page, so all
 * three should arrive at it with a 301 rather than a dead end.
 */
export function findByAnySlug(entries, segment) {
  if (!segment) return null;
  return (
    entries?.find(
      (entry) =>
        // The reference id, which is exactly the address these pages carried
        // before the slugs were translated — /galeria/kwiatowe. Checked first
        // because it is the case with an indexed URL behind it.
        entry?.slug === segment ||
        entry?.imageBase === segment ||
        LOCALE_CODES.some((code) => localizedSlug(entry, code) === segment)
    ) ?? null
  );
}
