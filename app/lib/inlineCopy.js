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

/**
 * Fills {name} / {n} placeholders. The parameterised labels were functions in
 * locales.js, which no CMS field can express; as templates they become ordinary
 * strings an editor can translate, and this is the one place that expands them.
 */
export function fillTemplate(template, values) {
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    values[key] === undefined ? match : String(values[key])
  );
}

/** Screen-reader labels, previously inline ternaries in Header, _index and kontakt. */
export const A11Y_LABELS = {
  call: { pl: "Zadzwoń", en: "Call", de: "Anrufen" },
  email: { pl: "Napisz e-mail", en: "Send email", de: "E-Mail senden" },
  expand: {
    pl: "Pokaż pełny opis",
    en: "Show full description",
    de: "Vollständige Beschreibung anzeigen",
  },
  langNav: {
    pl: "Wybierz język",
    en: "Language selector",
    de: "Sprachauswahl",
  },
  mainNav: {
    pl: "Nawigacja główna",
    en: "Main navigation",
    de: "Hauptnavigation",
  },
  selectProduct: {
    pl: "{name} — wybierz, aby zobaczyć",
    en: "{name} — select to view",
    de: "{name} — auswählen zum Anzeigen",
  },
  selectPhoto: {
    pl: "Pokaż zdjęcie {n}",
    en: "Show photo {n}",
    de: "Foto {n} anzeigen",
  },
  photoAlt: {
    pl: "{name} — zdjęcie {n}",
    en: "{name} — photo {n}",
    de: "{name} — Foto {n}",
  },
};

/**
 * The postal address, in schema.org's components rather than one string.
 *
 * It was stored as a single display string in the CMS *and* hardcoded a second
 * time as a PostalAddress in root.jsx's JSON-LD, so moving premises would have
 * updated the visible address while quietly leaving the old one in the
 * structured data. One source, both consumers.
 *
 * `countryName` is seeded as "Polska" in all three locales because that is what
 * the site shows today; translating it is now an edit in the Studio rather than
 * a silent change made during a refactor.
 */
export const ADDRESS = {
  streetAddress: "ul.Siedlecka 172",
  postalCode: "08-110",
  addressLocality: "Żelków-Kolonia",
  addressCountry: "PL",
  countryName: { pl: "Polska", en: "Polska", de: "Polska" },
};

/** The one-line form shown on the page, derived so it cannot drift from the parts. */
export function formatAddress(address, locale) {
  if (!address) return "";
  const country =
    typeof address.countryName === "string"
      ? address.countryName
      : address.countryName?.[locale];
  return [
    address.streetAddress,
    [address.postalCode, address.addressLocality].filter(Boolean).join(" "),
    country,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * The wallpaper catalogue. Grouped by the kind of covering rather than numbered,
 * because the photos are of completed installations and the grouping is what a
 * visitor is actually choosing between.
 *
 * `slug` is both the folder under public/gallery and the document id suffix.
 * Photo paths are derived from it, so the CMS stores the slug and a count
 * rather than four URLs per product.
 */
export const PRODUCTS = [
  {
    slug: "kwiatowe",
    photoCount: 4,
    name: { pl: "Murale kwiatowe", en: "Floral murals", de: "Blumen-Wandbilder" },
    alt: {
      pl: "Fototapeta z kwiatami w dużej skali, zamontowana na ścianie wnętrza",
      en: "Large-scale floral mural installed on an interior wall",
      de: "Großformatiges Blumen-Wandbild an einer Innenwand",
    },
  },
  {
    slug: "tropikalne",
    photoCount: 3,
    name: {
      pl: "Motywy tropikalne",
      en: "Tropical motifs",
      de: "Tropische Motive",
    },
    alt: {
      pl: "Fototapeta z liśćmi i roślinnością tropikalną na ścianie wnętrza",
      en: "Mural of tropical leaves and foliage on an interior wall",
      de: "Wandbild mit tropischen Blättern und Pflanzen an einer Innenwand",
    },
  },
  {
    slug: "artystyczne",
    photoCount: 4,
    name: {
      pl: "Murale artystyczne",
      en: "Artistic murals",
      de: "Künstlerische Wandbilder",
    },
    alt: {
      pl: "Dekoracyjny mural artystyczny pokrywający całą ścianę wnętrza",
      en: "Decorative artistic mural covering a full interior wall",
      de: "Dekoratives künstlerisches Wandbild über eine ganze Innenwand",
    },
  },
  {
    slug: "pejzaze",
    photoCount: 2,
    name: { pl: "Pejzaże", en: "Landscapes", de: "Landschaften" },
    alt: {
      pl: "Fototapeta z pejzażem nadmorskim na ścianie wnętrza",
      en: "Coastal landscape mural on an interior wall",
      de: "Wandbild mit Küstenlandschaft an einer Innenwand",
    },
  },
  {
    slug: "geometryczne",
    photoCount: 3,
    name: {
      pl: "Wzory geometryczne",
      en: "Geometric patterns",
      de: "Geometrische Muster",
    },
    alt: {
      pl: "Tapeta z powtarzalnym wzorem geometrycznym na ścianie wnętrza",
      en: "Wallpaper with a repeating geometric pattern on an interior wall",
      de: "Tapete mit sich wiederholendem geometrischem Muster an einer Innenwand",
    },
  },
  {
    slug: "strukturalne",
    photoCount: 4,
    name: {
      pl: "Tapety strukturalne",
      en: "Textured wallpapers",
      de: "Strukturtapeten",
    },
    alt: {
      pl: "Tapeta o wyraźnej fakturze pokrywająca ścianę wnętrza",
      en: "Textured wallpaper covering an interior wall",
      de: "Strukturtapete an einer Innenwand",
    },
  },
];

/** Shared across every product — no per-item price list exists. */
export const PRODUCT_SHARED = {
  price: {
    pl: "Wycena indywidualna",
    en: "Price on request",
    de: "Preis auf Anfrage",
  },
  descriptionLines: {
    pl: ["Tapeta dobierana pod wymiar ściany", "Zdjęcia z realizacji u klientów"],
    en: ["Sized to the wall it is hung on", "Photographed at completed installations"],
    de: ["Auf das Wandmaß abgestimmt", "Fotos abgeschlossener Umsetzungen"],
  },
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
