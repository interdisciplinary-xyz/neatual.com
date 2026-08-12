/**
 * Copy that was written inline in components rather than in locales.js, and so
 * had no single home. Both the seeder (which writes it into Sanity) and the
 * fallback in content.server.js (which serves it when Sanity is unreachable)
 * read it from here — otherwise the two drift and a page renders different text
 * depending on which source answered.
 */

/**
 * The brand as it is written on the page, previously three string literals in
 * Header, SplashScreen, _index and kontakt.
 *
 * Not localized: it is a name. It is here rather than left inline because the
 * site spent two commits rendering "netual" in one of those four places, which
 * is exactly what a single source prevents.
 */
export const BRAND = {
  wordmark: "neatual.com",
  name: "neatual",
};

/** The skip-to-content link, previously an inline ternary in app/root.jsx. */
export const SKIP_LINK = {
  pl: "Przejdź do treści",
  en: "Skip to main content",
  de: "Zum Inhalt springen",
};

/** The home page's visually hidden <h1>, previously inline in app/routes/_index.jsx. */
export const HOME_SR_HEADING = {
  pl: "Neatual — montaż tapet w całej Polsce",
  en: "Neatual — wallpaper installation across Poland",
  de: "Neatual — Tapezierarbeiten in ganz Polen",
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
  openMenu: {
    pl: "Otwórz menu",
    en: "Open menu",
    de: "Menü öffnen",
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
    name: {
      pl: "Fototapety kwiatowe",
      en: "Floral murals",
      de: "Blumen-Fototapeten",
    },
    alt: {
      pl: "Fototapeta z kwiatami w dużej skali, zamontowana na ścianie wnętrza",
      en: "Large-scale floral mural installed on an interior wall",
      de: "Großformatige Blumen-Fototapete an einer Innenwand",
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
      de: "Fototapete mit tropischen Blättern und Pflanzen an einer Innenwand",
    },
  },
  {
    slug: "artystyczne",
    photoCount: 4,
    name: {
      pl: "Fototapety artystyczne",
      en: "Artistic murals",
      de: "Künstlerische Fototapeten",
    },
    alt: {
      pl: "Dekoracyjna fototapeta artystyczna pokrywająca całą ścianę wnętrza",
      en: "Decorative artistic mural covering a full interior wall",
      de: "Dekorative künstlerische Fototapete über eine ganze Innenwand",
    },
  },
  {
    slug: "pejzaze",
    photoCount: 2,
    name: { pl: "Pejzaże", en: "Landscapes", de: "Landschaften" },
    alt: {
      pl: "Fototapeta z pejzażem nadmorskim na ścianie wnętrza",
      en: "Coastal landscape mural on an interior wall",
      de: "Fototapete mit Küstenlandschaft an einer Innenwand",
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
    pl: [
      "Tapeta dobierana pod wymiar ściany",
      "Zdjęcia z realizacji u klientów",
    ],
    en: [
      "Sized to the wall it is hung on",
      "Photographed at completed installations",
    ],
    de: ["Auf das Wandmaß abgestimmt", "Fotos abgeschlossener Umsetzungen"],
  },
};

/**
 * The price list.
 *
 * ⚠️ EVERY RATE HERE IS A PLACEHOLDER. No real pricing was supplied, and
 * inventing numbers for a real business is worse than shipping none — a visitor
 * cannot tell a made-up rate from a quoted one. The amounts are deliberately
 * `———` rather than plausible-looking figures, so there is no version of this
 * page that reads as genuine while being fabricated.
 *
 * `isPlaceholder` drives two things: the notice rendered above the table, and
 * `noindex` on the page (see root.jsx). Set it false in the Studio once real
 * rates are in and both guards lift themselves — there is nothing to remember
 * to undo in the code.
 *
 * The rows are the *structure* of a wallpaper-hanging quote, which is real even
 * though the numbers are not: area-based installation, per-type surcharges,
 * surface preparation, and the things that are quoted per-job rather than per m².
 */
export const PRICING = {
  isPlaceholder: true,

  placeholderNotice: {
    pl: "Cennik w przygotowaniu. Poniższe stawki są przykładowe i nie stanowią oferty — po wycenę prosimy o kontakt.",
    en: "This price list is being prepared. The rates below are placeholders and are not an offer — please get in touch for a quote.",
    de: "Diese Preisliste wird noch erstellt. Die untenstehenden Sätze sind Platzhalter und stellen kein Angebot dar — für ein Angebot kontaktieren Sie uns bitte.",
  },

  intro: {
    pl: "Montaż wyceniamy według powierzchni ściany i rodzaju tapety. Poniżej zakres prac, które wchodzą w wycenę.",
    en: "We price installation by wall area and wallpaper type. Below is the scope of work a quote covers.",
    de: "Wir kalkulieren die Montage nach Wandfläche und Tapetenart. Unten der Leistungsumfang, den ein Angebot abdeckt.",
  },

  columns: {
    service: { pl: "Zakres", en: "Service", de: "Leistung" },
    unit: { pl: "Jednostka", en: "Unit", de: "Einheit" },
    price: { pl: "Stawka", en: "Rate", de: "Satz" },
  },

  // `price` is intentionally the same em-dash placeholder in every locale.
  rows: [
    {
      key: "standard",
      label: {
        pl: "Montaż tapety wzorzystej",
        en: "Patterned wallpaper installation",
        de: "Montage gemusterter Tapete",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
    {
      key: "mural",
      label: {
        pl: "Montaż fototapety",
        en: "Photo mural installation",
        de: "Montage von Fototapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
    {
      key: "textured",
      label: {
        pl: "Montaż tapety strukturalnej",
        en: "Textured wallpaper installation",
        de: "Montage von Strukturtapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
    {
      key: "preparation",
      label: {
        pl: "Przygotowanie podłoża (gruntowanie, drobne ubytki)",
        en: "Surface preparation (priming, minor filling)",
        de: "Untergrundvorbereitung (Grundierung, kleine Ausbesserungen)",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
    {
      key: "removal",
      label: {
        pl: "Zdjęcie starej tapety",
        en: "Removal of existing wallpaper",
        de: "Entfernen alter Tapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
    {
      key: "minimum",
      label: {
        pl: "Minimalna wartość zlecenia",
        en: "Minimum job value",
        de: "Mindestauftragswert",
      },
      unit: { pl: "zlecenie", en: "per job", de: "pro Auftrag" },
      price: { pl: "——— zł", en: "——— PLN", de: "——— PLN" },
    },
  ],

  notes: [
    {
      pl: "Tapetę kupuje klient lub jego projektant — my zajmujemy się wyłącznie montażem.",
      en: "The wallpaper is bought by the client or their designer — we handle installation only.",
      de: "Die Tapete kauft der Kunde oder sein Planer — wir übernehmen ausschließlich die Montage.",
    },
    {
      pl: "Ściany wysokie, sufity, klatki schodowe i powierzchnie łukowe wyceniamy indywidualnie.",
      en: "High walls, ceilings, stairwells and curved surfaces are quoted individually.",
      de: "Hohe Wände, Decken, Treppenhäuser und gewölbte Flächen werden individuell kalkuliert.",
    },
    {
      pl: "Dojazd poza okolice Siedlec doliczamy według odległości.",
      en: "Travel beyond the Siedlce area is added according to distance.",
      de: "Anfahrt außerhalb der Region Siedlce wird nach Entfernung berechnet.",
    },
  ],
};

/**
 * The site-wide call to action, rendered under every page's content by root.jsx.
 *
 * It lives in siteSettings rather than on any one page document because it is
 * the same block everywhere — as a per-page field it would be three copies to
 * keep in step, and they would drift.
 *
 * The wording asks for wall dimensions and wallpaper type, which is what the
 * business actually needs to quote. That holds on every page it appears on, so
 * it does not need a per-page variant.
 */
export const CTA = {
  heading: {
    pl: "Potrzebujesz dokładnej wyceny?",
    en: "Need an exact quote?",
    de: "Brauchen Sie ein genaues Angebot?",
  },
  body: {
    pl: "Napisz lub zadzwoń — podaj wymiary ściany i rodzaj tapety, a odeślemy wycenę.",
    en: "Write or call — send the wall dimensions and the wallpaper type and we will send a quote back.",
    de: "Schreiben oder rufen Sie an — nennen Sie Wandmaße und Tapetenart, und wir senden ein Angebot.",
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
      pl: "Zdjęcia zrealizowanych montaży: fototapety, tapety wzorzyste i tekstury — w łazienkach, sypialniach, przy basenie i w przestrzeniach komercyjnych.",
      en: "Photographs of finished installations — murals, patterned and textured wallpaper in bathrooms, bedrooms, a pool area and commercial spaces.",
      de: "Fotos abgeschlossener Projekte — Fototapeten, gemusterte und strukturierte Tapeten in Bädern, Schlafzimmern, am Pool und in Gewerberäumen.",
    },
  },
  pricing: {
    suffix: { pl: "Cennik", en: "Pricing", de: "Preise" },
    description: {
      pl: "Cennik montażu tapet i fototapet: stawki za m², przygotowanie podłoża i zdjęcie starej tapety. Wycena indywidualna dla każdego zlecenia.",
      en: "Pricing for wallpaper and mural installation: rates per m², surface preparation and removal of existing wallpaper. Every job quoted individually.",
      de: "Preise für die Montage von Tapeten und Fototapeten: Sätze pro m², Untergrundvorbereitung und Entfernen alter Tapeten. Jeder Auftrag wird individuell kalkuliert.",
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
