export const SITE_URL = "https://neatual.com";

export const LOCALE_CODES = ["pl", "en", "de"];

export const PAGE_KEYS = ["home", "gallery", "contact"];

// Every page in every locale. The hreflang <link> tags in root.jsx and the
// <url> entries in sitemap.xml both read from this map so the two can't drift.
export const HREFLANG_URLS = {
  pl: { home: "/", gallery: "/galeria", contact: "/kontakt" },
  en: { home: "/en", gallery: "/en/gallery", contact: "/en/contact" },
  de: { home: "/de", gallery: "/de/galerie", contact: "/de/kontakte" },
};

// Polish is the default locale, so it backs x-default.
export const DEFAULT_LOCALE = "pl";
