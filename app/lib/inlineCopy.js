/**
 * Copy that was written inline in components rather than in locales.js, and so
 * had no single home. Both the seeder (which writes it into Sanity) and the
 * fallback in content.server.js (which serves it when Sanity is unreachable)
 * read it from here — otherwise the two drift and a page renders different text
 * depending on which source answered.
 */

/** The home page's visually hidden <h1>, previously inline in app/routes/_index.jsx. */
export const HOME_SR_HEADING = {
  pl: "Neatual - produkcja i dystrybucja uniformów",
  en: "Neatual - uniform production and distribution",
  de: "Neatual - Uniformproduktion und -vertrieb",
};

/** Screen-reader labels, previously inline ternaries in Header, _index and kontakt. */
export const A11Y_LABELS = {
  call: { pl: "Zadzwoń", en: "Call", de: "Anrufen" },
  email: { pl: "Napisz e-mail", en: "Send email", de: "E-Mail senden" },
  expand: {
    pl: "Pokaż pełny opis",
    en: "Show full description",
    de: "Vollständige Beschreibung anzeigen",
  },
  langNav: { pl: "Wybierz język", en: "Language selector", de: "Sprachauswahl" },
  mainNav: { pl: "Nawigacja główna", en: "Main navigation", de: "Hauptnavigation" },
};

/**
 * Per-page title suffix and meta description. Was branching logic inside
 * root.jsx's getPageMeta(); now content, seeded into Sanity and mirrored here
 * so the fallback produces byte-identical <title> and description tags.
 */
export const PAGE_META = {
  gallery: {
    suffix: { pl: "Galeria", en: "Gallery", de: "Galerie" },
    description: {
      pl: "Galeria produktów Neatual - uniformy szyte w Polsce z polskich materiałów.",
      en: "Neatual product gallery - uniforms made in Poland from Polish materials.",
      de: "Neatual Produktgalerie - in Polen aus polnischen Materialien gefertigte Uniformen.",
    },
  },
  contact: {
    suffix: { pl: "Kontakt", en: "Contact", de: "Kontakt" },
    description: {
      pl: "Skontaktuj się z Neatual - ul. Siedlecka 172, Żelków-Kolonia. Tel. +48 739 903 148.",
      en: "Contact Neatual - ul. Siedlecka 172, Żelków-Kolonia. Phone +48 739 903 148.",
      de: "Kontakt Neatual - ul. Siedlecka 172, Żelków-Kolonia. Tel. +48 739 903 148.",
    },
  },
};
