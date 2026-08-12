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

// Which of the three pages a path points at, in any locale. Both the meta and
// the hreflang logic in root.jsx derived this separately before; keeping one
// implementation means they can't disagree about what page you're on.
export function getPageKey(pathname) {
  const path = String(pathname || "/").replace(/\/$/, "") || "/";
  if (/\/(galeria|gallery|galerie)$/.test(path)) return "gallery";
  if (/\/(cennik|pricing|preise)$/.test(path)) return "pricing";
  if (/\/(kontakt|contact|kontakte)$/.test(path)) return "contact";
  return "home";
}
