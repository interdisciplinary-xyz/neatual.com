export const SITE_URL = "https://neatual.com";

export const LOCALE_CODES = ["pl", "en", "de"];

// Order is nav order: navItemsFrom() in useContent.js maps over this array, so
// the footer renders in this sequence. Pricing sits between the gallery and
// contact — a visitor looks at the work, asks what it costs, then gets in touch.
export const PAGE_KEYS = ["home", "gallery", "pricing", "contact"];

// Every page in every locale. The hreflang <link> tags in root.jsx and the
// <url> entries in sitemap.xml both read from this map so the two can't drift.
export const HREFLANG_URLS = {
  pl: {
    home: "/",
    gallery: "/galeria",
    pricing: "/cennik",
    contact: "/kontakt",
  },
  en: {
    home: "/en",
    gallery: "/en/gallery",
    pricing: "/en/pricing",
    contact: "/en/contact",
  },
  de: {
    home: "/de",
    gallery: "/de/galerie",
    pricing: "/de/preise",
    contact: "/de/kontakte",
  },
};

// Polish is the default locale, so it backs x-default.
export const DEFAULT_LOCALE = "pl";

// The gallery and, optionally, one category under it: /galeria/kwiatowe and its
// two translations. Anchored at the start, unlike the page tests below, because
// the captured group has to be a category slug and nothing else — an unanchored
// match would read the last segment of any deep path as a category.
const GALLERY_PATH =
  /^(?:\/(?:en|de))?\/(?:galeria|gallery|galerie)(?:\/([^/]+))?$/;

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
  if (/\/(cennik|pricing|preise)$/.test(path)) return "pricing";
  if (/\/(kontakt|contact|kontakte)$/.test(path)) return "contact";
  return "home";
}

/** The category slug in a gallery path, or null for the gallery index itself. */
export function getGalleryCategorySlug(pathname) {
  return normalizePath(pathname).match(GALLERY_PATH)?.[1] ?? null;
}

/**
 * Where a category lives in a given locale.
 *
 * The slug is the same in all three — it is the image folder name in
 * public/gallery, so one identifier runs from the filesystem through the CMS to
 * the URL. That keeps the hreflang set mechanical (/galeria/X, /en/gallery/X,
 * /de/galerie/X are the same page by construction) at the cost of Polish words
 * in the English and German URLs. Localising the slugs would mean three slugs
 * per category in the CMS and a lookup in both directions; worth revisiting
 * before launch, not worth guessing at now.
 */
export function galleryCategoryPath(locale, slug, paths = HREFLANG_URLS) {
  const base = paths[locale]?.gallery ?? HREFLANG_URLS[locale].gallery;
  return `${base}/${slug}`;
}
