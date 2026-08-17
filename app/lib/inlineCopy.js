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
 * The gallery categories. Grouped by the kind of covering rather than numbered,
 * because the photos are of completed installations and the grouping is what a
 * visitor is actually choosing between.
 *
 * ## Three identifiers, and why they are not one
 *
 * - `slug` — the canonical id. The folder under public/gallery, the document id
 *   suffix in Sanity, and the key other content (see `SERVICES`) references a
 *   category by. Never appears in a URL any more. Never changes.
 * - `slugs` — the URL segment, per locale. Changing one changes a published
 *   address; the old one redirects rather than 404s, via `findByAnySlug`.
 * - `imageBase` — set from `slug` in the fallback, a separate field in the CMS,
 *   so renaming a URL never moves an image file.
 *
 * ## Why the names say "montaż" and not "fototapety"
 *
 * These pages were titled after the wallpaper — "Fototapety kwiatowe",
 * "Pejzaże" — which is a product Neatual does not sell. The client or their
 * designer buys the paper; Neatual hangs it. Searching those terms returns
 * nothing but wallpaper shops, so the pages were competing with e-commerce for
 * a visitor who wanted to buy a roll, against domains they cannot outrank, for
 * traffic that would bounce on arrival.
 *
 * Every name, title and description here is framed as the service instead. The
 * volume on "montaż fototapet kwiatowych" is small — that is the honest trade.
 * What it buys is the right visitor, no e-commerce competition, and six pages
 * that support /uslugi rather than contradicting it.
 *
 * ## Why every category has its own `intro`
 *
 * They previously shared one pair of `descriptionLines` and had no intro at
 * all, which made six pages whose entire textual difference was the heading —
 * thin, near-duplicate content by any measure. Each intro now says what is
 * actually different about hanging that kind of covering. That is craft
 * description, not specification: no material, price, dimension or timescale is
 * claimed anywhere here, because none is known.
 */
export const PRODUCTS = [
  {
    slug: "kwiatowe",
    photoCount: 4,
    slugs: {
      pl: "montaz-fototapet-kwiatowych",
      en: "floral-mural-installation",
      de: "montage-blumen-fototapeten",
    },
    name: {
      pl: "Montaż fototapet kwiatowych",
      en: "Floral mural installation",
      de: "Montage von Blumen-Fototapeten",
    },
    intro: {
      pl: "Duże kwiatowe motywy trzeba rozłożyć na ścianie, zanim pójdzie pierwszy bryt — inaczej kwiat kończy się na krawędzi albo rozjeżdża na łączeniu. Ustawiamy wzór pod wymiar ściany, razem z gniazdkami i narożnikami.",
      en: "A large floral has to be laid out against the wall before the first drop goes up, or a flower ends at an edge or breaks across a seam. We set the pattern out to the wall it is going on, sockets and corners included.",
      de: "Ein großes Blumenmotiv muss vor der ersten Bahn an der Wand ausgelegt werden — sonst endet eine Blüte an der Kante oder versetzt sich an der Naht. Wir richten das Muster auf die Wand aus, samt Steckdosen und Ecken.",
    },
    alt: {
      pl: "Fototapeta z kwiatami w dużej skali, zamontowana na ścianie wnętrza",
      en: "Large-scale floral mural installed on an interior wall",
      de: "Großformatige Blumen-Fototapete an einer Innenwand",
    },
    metaTitle: {
      pl: "Montaż fototapet kwiatowych — cała Polska | Neatual",
      en: "Floral mural installation across Poland | Neatual",
      de: "Blumen-Fototapeten montieren, ganz Polen | Neatual",
    },
    metaDescription: {
      pl: "Wieszamy fototapety kwiatowe w domach i wnętrzach komercyjnych, w całej Polsce. Tapetę wybiera klient lub projektant — my odpowiadamy za montaż.",
      en: "We hang floral murals in homes and commercial interiors across Poland. The client or their designer picks the paper; the installation is ours.",
      de: "Wir montieren Blumen-Fototapeten in Wohn- und Gewerberäumen in ganz Polen. Die Tapete wählt der Kunde oder sein Planer — die Montage ist unsere.",
    },
  },
  {
    slug: "tropikalne",
    photoCount: 3,
    slugs: {
      pl: "montaz-fototapet-tropikalnych",
      en: "tropical-mural-installation",
      de: "montage-tropischer-fototapeten",
    },
    name: {
      pl: "Montaż fototapet tropikalnych",
      en: "Tropical mural installation",
      de: "Montage tropischer Fototapeten",
    },
    intro: {
      pl: "Motywy tropikalne mają zwykle ciemne, jednolite tło, na którym widać każde łączenie i każdy ślad kleju. Część z tych zdjęć jest z łazienki i sprzed basenu — tam podłoże przygotowuje się inaczej niż w salonie.",
      en: "Tropical prints usually sit on a dark, flat ground, where every seam and every trace of adhesive shows. Some of these were hung in a bathroom and beside a pool, where the surface is prepared differently than in a living room.",
      de: "Tropische Motive haben meist einen dunklen, ruhigen Grund, auf dem jede Naht und jede Kleberspur sichtbar bleibt. Einige dieser Fotos stammen aus einem Bad und von einem Pool — dort wird der Untergrund anders vorbereitet als im Wohnzimmer.",
    },
    alt: {
      pl: "Fototapeta z liśćmi i roślinnością tropikalną na ścianie wnętrza",
      en: "Mural of tropical leaves and foliage on an interior wall",
      de: "Fototapete mit tropischen Blättern und Pflanzen an einer Innenwand",
    },
    metaTitle: {
      pl: "Montaż fototapet tropikalnych w całej Polsce | Neatual",
      en: "Tropical mural installation across Poland | Neatual",
      de: "Tropische Fototapeten montieren | Neatual",
    },
    metaDescription: {
      pl: "Montaż fototapet z motywem tropikalnym — w łazienkach, przy basenie i w pokojach. Pracujemy w całej Polsce, tapetę dostarcza klient lub projektant.",
      en: "Installation of tropical murals — in bathrooms, beside a pool and in living spaces. We work across Poland; the client or their designer supplies the paper.",
      de: "Montage tropischer Fototapeten — in Bädern, am Pool und in Wohnräumen. Wir arbeiten in ganz Polen; die Tapete liefert der Kunde oder sein Planer.",
    },
  },
  {
    slug: "artystyczne",
    photoCount: 4,
    slugs: {
      pl: "montaz-fototapet-artystycznych",
      en: "artistic-mural-installation",
      de: "montage-kuenstlerischer-fototapeten",
    },
    name: {
      pl: "Montaż fototapet artystycznych",
      en: "Artistic mural installation",
      de: "Montage künstlerischer Fototapeten",
    },
    intro: {
      pl: "Fototapeta artystyczna jest zwykle drukowana na jedną konkretną ścianę i nie ma powtarzalnego raportu — nie da się jej przesunąć ani dociąć z zapasem. Ścianę mierzymy przed zamówieniem druku, bo drugiego kompletu brytów nie będzie.",
      en: "An artistic mural is usually printed for one specific wall and has no repeat, so it cannot be shifted along or trimmed generously. We measure the wall before the print is ordered — there is no second set of drops.",
      de: "Eine künstlerische Fototapete wird meist für genau eine Wand gedruckt und hat keinen Rapport — sie lässt sich weder verschieben noch großzügig zuschneiden. Wir messen die Wand vor dem Druckauftrag; einen zweiten Satz Bahnen gibt es nicht.",
    },
    alt: {
      pl: "Dekoracyjna fototapeta artystyczna pokrywająca całą ścianę wnętrza",
      en: "Decorative artistic mural covering a full interior wall",
      de: "Dekorative künstlerische Fototapete über eine ganze Innenwand",
    },
    metaTitle: {
      pl: "Montaż fototapet artystycznych na wymiar | Neatual",
      en: "Artistic mural installation, made to measure | Neatual",
      de: "Künstlerische Fototapeten montieren | Neatual",
    },
    metaDescription: {
      pl: "Montaż fototapet artystycznych drukowanych na wymiar ściany. Mierzymy przed drukiem i wieszamy na miejscu, w całej Polsce.",
      en: "Installation of artistic murals printed to the wall's measurements. We measure before printing and hang on site, anywhere in Poland.",
      de: "Montage künstlerischer Fototapeten, auf Wandmaß gedruckt. Wir messen vor dem Druck und tapezieren vor Ort, in ganz Polen.",
    },
  },
  {
    slug: "pejzaze",
    photoCount: 2,
    slugs: {
      pl: "montaz-fototapet-z-pejzazem",
      en: "landscape-mural-installation",
      de: "montage-von-landschafts-fototapeten",
    },
    name: {
      pl: "Montaż fototapet z pejzażem",
      en: "Landscape mural installation",
      de: "Montage von Landschafts-Fototapeten",
    },
    intro: {
      pl: "W pejzażu wszystko widać po linii horyzontu: jeśli ściana nie jest w poziomie, a bryty pójdą za nią, horyzont się przechyli. Ustawiamy go do poziomu, nie do sufitu — sufity rzadko są równe.",
      en: "In a landscape everything is read off the horizon: if the wall is out of level and the drops follow it, the horizon tilts. We set it to level rather than to the ceiling — ceilings rarely are.",
      de: "Bei einer Landschaft verrät alles die Horizontlinie: Ist die Wand nicht waagerecht und folgen die Bahnen ihr, kippt der Horizont. Wir richten ihn nach der Waage aus, nicht nach der Decke — Decken sind selten gerade.",
    },
    alt: {
      pl: "Fototapeta z pejzażem nadmorskim na ścianie wnętrza",
      en: "Coastal landscape mural on an interior wall",
      de: "Fototapete mit Küstenlandschaft an einer Innenwand",
    },
    metaTitle: {
      pl: "Montaż fototapet z pejzażem — cała Polska | Neatual",
      en: "Landscape mural installation across Poland | Neatual",
      de: "Landschafts-Fototapeten montieren | Neatual",
    },
    metaDescription: {
      pl: "Montaż panoramicznych fototapet z pejzażem. Horyzont ustawiany do poziomu, bryty dopasowane do ściany. Pracujemy w całej Polsce.",
      en: "Installation of panoramic landscape murals. The horizon set to level, drops fitted to the wall. We work across the whole of Poland.",
      de: "Montage panoramischer Landschafts-Fototapeten. Horizont in der Waage, Bahnen auf die Wand angepasst. Wir arbeiten in ganz Polen.",
    },
  },
  {
    slug: "geometryczne",
    photoCount: 3,
    slugs: {
      pl: "montaz-tapet-geometrycznych",
      en: "geometric-wallpaper-installation",
      de: "montage-geometrischer-tapeten",
    },
    name: {
      pl: "Montaż tapet geometrycznych",
      en: "Geometric wallpaper installation",
      de: "Montage geometrischer Tapeten",
    },
    intro: {
      pl: "Wzór geometryczny nie wybacza nic: prosta linia obok krzywej ściany od razu pokazuje, która jest krzywa. Pion wyznaczamy niezależnie od narożnika i stamtąd prowadzimy kolejne bryty.",
      en: "A geometric pattern forgives nothing: a straight line beside an out-of-true wall shows immediately which of the two is out. We strike the vertical independently of the corner and run the drops from there.",
      de: "Ein geometrisches Muster verzeiht nichts: Eine gerade Linie neben einer schiefen Wand zeigt sofort, welche von beiden schief ist. Wir loten unabhängig von der Ecke und führen die Bahnen von dort aus.",
    },
    alt: {
      pl: "Tapeta z powtarzalnym wzorem geometrycznym na ścianie wnętrza",
      en: "Wallpaper with a repeating geometric pattern on an interior wall",
      de: "Tapete mit sich wiederholendem geometrischem Muster an einer Innenwand",
    },
    metaTitle: {
      pl: "Montaż tapet geometrycznych — równe łączenia | Neatual",
      en: "Geometric wallpaper installation | Neatual",
      de: "Geometrische Tapeten montieren | Neatual",
    },
    metaDescription: {
      pl: "Montaż tapet w powtarzalne wzory geometryczne. Pion wyznaczany niezależnie od narożnika, łączenia na styk. Cała Polska.",
      en: "Installation of wallpaper with repeating geometric patterns. Vertical struck independently of the corner, seams butted. All of Poland.",
      de: "Montage von Tapeten mit geometrischem Rapport. Lot unabhängig von der Ecke, Nähte auf Stoß. In ganz Polen.",
    },
  },
  {
    slug: "strukturalne",
    photoCount: 4,
    slugs: {
      pl: "montaz-tapet-strukturalnych",
      en: "textured-wallpaper-installation",
      de: "montage-von-strukturtapeten",
    },
    name: {
      pl: "Montaż tapet strukturalnych",
      en: "Textured wallpaper installation",
      de: "Montage von Strukturtapeten",
    },
    intro: {
      pl: "Faktura ukrywa łączenia, ale nie ukrywa ściany pod spodem — każde wgłębienie i każda nierówność podłoża zbiera na sobie światło. Tu najwięcej zależy od tego, co zrobi się przed rozłożeniem pierwszego brytu.",
      en: "Texture hides the seams but not the wall beneath it — every dip and every unevenness in the substrate catches the light. Here more depends on what is done before the first drop goes up than on anything after.",
      de: "Struktur verbirgt die Nähte, aber nicht die Wand darunter — jede Vertiefung und jede Unebenheit des Untergrunds fängt das Licht. Hier hängt mehr von der Vorbereitung ab als von allem, was danach kommt.",
    },
    alt: {
      pl: "Tapeta o wyraźnej fakturze pokrywająca ścianę wnętrza",
      en: "Textured wallpaper covering an interior wall",
      de: "Strukturtapete an einer Innenwand",
    },
    metaTitle: {
      pl: "Montaż tapet strukturalnych i fakturowych | Neatual",
      en: "Textured wallpaper installation | Neatual",
      de: "Strukturtapeten montieren, ganz Polen | Neatual",
    },
    metaDescription: {
      pl: "Montaż tapet strukturalnych i fakturowych, wraz z przygotowaniem podłoża — bo pod fakturą widać każdą nierówność ściany. Cała Polska.",
      en: "Installation of textured wallpaper, surface preparation included — under a texture every unevenness in the wall shows. All of Poland.",
      de: "Montage von Strukturtapeten samt Untergrundvorbereitung — unter einer Struktur zeigt sich jede Unebenheit. In ganz Polen.",
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
 * The rate for a row the business has not put a number on.
 *
 * One constant rather than four copies of the same three strings: a row cannot
 * then half-disagree with its neighbours, and pricing.spec.js can assert that
 * every price is either an amount or exactly this.
 */
const INDIVIDUAL_QUOTE = {
  pl: "wycena indywidualna",
  en: "quoted individually",
  de: "individuelle Kalkulation",
};

/**
 * The price list.
 *
 * The four amounts are the business's own, supplied 2026-08-17, and they are the
 * first real rates this page has carried. They cut along the two axes the
 * business actually quotes on: the class of wallpaper (contract-grade, or
 * pattern-matched) and whether the wall underneath absorbs. A non-absorbent
 * substrate — lacquer, glass, board — is a flat rate rather than a surcharge,
 * which is why rows 3 and 4 replace rows 1 and 2 rather than adding to them.
 *
 * Four rows are still `wycena indywidualna`, because those are the ones no rate
 * was given for. That is not a placeholder: quoting per job is a real answer, and
 * it is the answer already given for high walls in the notes below. What the
 * rows must never do is carry an invented number — a visitor cannot tell a
 * made-up rate from a quoted one, and every one of these rows has a service page
 * pointing at it (`pricingKey` in SERVICES, asserted in seo.spec.js).
 *
 * `isPlaceholder` is now false, which lifts the "these are not real" notice and
 * the `noindex` in root.jsx. Both remain armed: switching the boolean back on in
 * the Studio re-arms them, which is the lever to reach for if the rates ever go
 * stale, rather than a line of code to restore.
 *
 * `notAnOffer` is the line that stays up permanently, and it is deliberately not
 * the same string. A range is not a quotation whatever its provenance, and the
 * page has to say so even — especially — when the numbers are genuine.
 */
export const PRICING = {
  isPlaceholder: false,

  placeholderNotice: {
    pl: "Cennik w przygotowaniu. Poniższe stawki są przykładowe i nie stanowią oferty — po wycenę prosimy o kontakt.",
    en: "This price list is being prepared. The rates below are placeholders and are not an offer — please get in touch for a quote.",
    de: "Diese Preisliste wird noch erstellt. Die untenstehenden Sätze sind Platzhalter und stellen kein Angebot dar — für ein Angebot kontaktieren Sie uns bitte.",
  },

  notAnOffer: {
    pl: "Stawki orientacyjne — nie stanowią oferty w rozumieniu Kodeksu cywilnego. Ostateczną wycenę podajemy po obejrzeniu ścian.",
    en: "Indicative rates — not a binding offer. We give the final quote once we have seen the walls.",
    de: "Orientierungspreise — kein verbindliches Angebot. Das endgültige Angebot nennen wir nach Besichtigung der Wände.",
  },

  intro: {
    pl: "Montaż wyceniamy według powierzchni ściany, rodzaju tapety i podłoża, na które ma być klejona. Poniżej stawki, od których wychodzimy.",
    en: "We price installation by wall area, wallpaper type and the surface it is going onto. Below are the rates a quote starts from.",
    de: "Wir kalkulieren die Montage nach Wandfläche, Tapetenart und dem Untergrund, auf den sie kommt. Unten die Sätze, von denen wir ausgehen.",
  },

  columns: {
    service: { pl: "Zakres", en: "Service", de: "Leistung" },
    unit: { pl: "Jednostka", en: "Unit", de: "Einheit" },
    price: { pl: "Stawka", en: "Rate", de: "Satz" },
  },

  // Re-exported so a test can check a row's price against it by identity rather
  // than by matching the wording a second time.
  individualQuote: INDIVIDUAL_QUOTE,

  /*
    Row order is the order a quote is built in: the two substrate-normal rates
    first, then what a non-absorbent wall costs instead, then the work that is
    quoted per job.

    `price` reads the same in en and de by design — an amount in złoty is a
    number, and "40–200 PLN" has no German translation. i18n.spec.js exempts the
    field for that reason; the label beside it is what carries the language.
  */
  rows: [
    {
      key: "contract",
      label: {
        pl: "Tapety obiektowe",
        en: "Contract wallpaper",
        de: "Objekttapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "35–150 zł", en: "35–150 PLN", de: "35–150 PLN" },
    },
    {
      key: "pattern-match",
      label: {
        pl: "Tapety z pasowaniem wzoru",
        en: "Wallpaper with pattern matching",
        de: "Tapeten mit Musteranpassung",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "40–200 zł", en: "40–200 PLN", de: "40–200 PLN" },
    },
    {
      key: "non-absorbent",
      label: {
        pl: "Tapety na podłożu niechłonnym",
        en: "Wallpaper on a non-absorbent surface",
        de: "Tapeten auf nicht saugendem Untergrund",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "250 zł", en: "250 PLN", de: "250 PLN" },
    },
    {
      key: "non-absorbent-patterned",
      label: {
        pl: "Tapety wzorzyste na podłożu niechłonnym",
        en: "Patterned wallpaper on a non-absorbent surface",
        de: "Gemusterte Tapeten auf nicht saugendem Untergrund",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: { pl: "300 zł", en: "300 PLN", de: "300 PLN" },
    },
    {
      key: "mural",
      label: {
        pl: "Montaż fototapety",
        en: "Photo mural installation",
        de: "Montage von Fototapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: INDIVIDUAL_QUOTE,
    },
    {
      key: "preparation",
      label: {
        pl: "Przygotowanie podłoża (gruntowanie, drobne ubytki)",
        en: "Surface preparation (priming, minor filling)",
        de: "Untergrundvorbereitung (Grundierung, kleine Ausbesserungen)",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: INDIVIDUAL_QUOTE,
    },
    {
      key: "removal",
      label: {
        pl: "Zdjęcie starej tapety",
        en: "Removal of existing wallpaper",
        de: "Entfernen alter Tapeten",
      },
      unit: { pl: "m²", en: "m²", de: "m²" },
      price: INDIVIDUAL_QUOTE,
    },
    {
      key: "bespoke",
      label: {
        pl: "Sufity, ściany wysokie, powierzchnie łukowe",
        en: "Ceilings, high walls, curved surfaces",
        de: "Decken, hohe Wände, gewölbte Flächen",
      },
      unit: { pl: "zlecenie", en: "per job", de: "pro Auftrag" },
      price: INDIVIDUAL_QUOTE,
    },
  ],

  notes: [
    {
      pl: "Tapetę kupuje klient lub jego projektant — my zajmujemy się wyłącznie montażem.",
      en: "The wallpaper is bought by the client or their designer — we handle installation only.",
      de: "Die Tapete kauft der Kunde oder sein Planer — wir übernehmen ausschließlich die Montage.",
    },
    {
      pl: "Stawka z widełek zależy od zakresu i warunków pracy na miejscu — dokładną kwotę potwierdzamy w wycenie.",
      en: "Where a rate falls within its range depends on the scope and the conditions on site — the exact figure is confirmed in the quote.",
      de: "Wo ein Satz innerhalb seiner Spanne liegt, hängt vom Umfang und den Bedingungen vor Ort ab — den genauen Betrag bestätigen wir im Angebot.",
    },
    {
      pl: "Podłoże niechłonne — na przykład lakierowane, szklane lub płyta meblowa — ma własną stawkę, podaną w tabeli powyżej.",
      en: "A non-absorbent surface — lacquered, glass or furniture board, for instance — has its own rate, given in the table above.",
      de: "Ein nicht saugender Untergrund — etwa lackiert, Glas oder Möbelplatte — hat einen eigenen Satz, siehe Tabelle oben.",
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
 * The same rates as numbers, keyed by the row they belong to.
 *
 * Structured data cannot use the display strings: "35–150 zł" is not a price a
 * crawler can read, and parsing it back into numbers would make the JSON-LD
 * depend on how the table happens to be punctuated. So the amounts exist twice —
 * and because that is a drift risk, pricing.spec.js asserts every number here
 * reads back out of the row it names.
 *
 * Only the rows with a rate appear. A row quoted per job has no
 * `priceSpecification`, which is the correct structured-data answer for it: an
 * Offer with no price is worse than no Offer.
 *
 * No `valueAddedTaxIncluded`. Whether the amounts are net or gross has not been
 * confirmed, and asserting either into machine-readable data is how a 23%
 * difference ends up quoted back at the business. Add it once it is known.
 */
export const RATE_NUMBERS = {
  contract: { min: 35, max: 150 },
  "pattern-match": { min: 40, max: 200 },
  "non-absorbent": { min: 250, max: 250 },
  "non-absorbent-patterned": { min: 300, max: 300 },
};

/**
 * The service pages — /uslugi and the six beneath it.
 *
 * ## Why these six and not the obvious ones
 *
 * The tempting set is materials: flizelinowa, winylowa, tekstylna. Those are the
 * terms contractors are searched by, and they are the biggest opening this site
 * has. They are also not written down anywhere in this codebase, and a page
 * saying "we hang textile wallpaper" would be a claim nobody here is in a
 * position to make. See the note at the end of
 * docs/ICP-AND-SEO-STRATEGY.md — those pages are the next step, and they need
 * the business to confirm the capability first, not a copywriter to assume it.
 *
 * Every entry below instead traces to something the site already publishes:
 * `pricingKey` names the row in `PRICING` this page is the prose for, or the
 * note it expands. Nothing here claims a material, a price, a timescale or a
 * certification.
 *
 * ## Why they do not cannibalise the gallery
 *
 * The gallery is cut by motif — what the finished wall looks like. These are cut
 * by operation — what is done to the wall. `categories` links each service to
 * the gallery pages that show it, which is the hub-and-spoke the gallery has
 * never had: six category pages currently link up to the index and nowhere else.
 *
 * Deliberately absent: a "tapety strukturalne" service page, which would compete
 * with the gallery category of the same name for the same query.
 */
export const SERVICES = [
  {
    slug: "montaz-fototapet",
    pricingKey: "mural",
    categories: ["kwiatowe", "tropikalne", "artystyczne", "pejzaze"],
    slugs: {
      pl: "montaz-fototapet",
      en: "photo-mural-installation",
      de: "montage-von-fototapeten",
    },
    name: {
      pl: "Montaż fototapet",
      en: "Photo mural installation",
      de: "Montage von Fototapeten",
    },
    intro: {
      pl: "Fototapeta to jeden obraz rozcięty na bryty, więc każdy błąd na jednym z nich widać na całej ścianie. Rozkładamy wzór przed klejeniem, prowadzimy łączenia na styk i docinamy przy suficie, listwie i gniazdkach.",
      en: "A mural is one image cut into drops, so a mistake on any one of them shows across the whole wall. We lay the pattern out before pasting, butt the seams, and trim at the ceiling, the skirting and the sockets.",
      de: "Eine Fototapete ist ein Bild, in Bahnen zerschnitten — ein Fehler auf einer Bahn ist auf der ganzen Wand zu sehen. Wir legen das Motiv vor dem Kleben aus, stoßen die Nähte auf Stoß und schneiden an Decke, Leiste und Steckdosen zu.",
    },
    scope: {
      pl: [
        "Pomiar ściany przed zamówieniem druku",
        "Rozłożenie wzoru i wyznaczenie pionu",
        "Klejenie brytów na styk",
        "Docinanie przy suficie, listwach i gniazdkach",
      ],
      en: [
        "Measuring the wall before the print is ordered",
        "Laying out the pattern and striking the vertical",
        "Hanging the drops with butted seams",
        "Trimming at ceiling, skirting and sockets",
      ],
      de: [
        "Wandaufmaß vor der Druckbestellung",
        "Motiv auslegen und Lot anschlagen",
        "Bahnen auf Stoß kleben",
        "Zuschnitt an Decke, Leisten und Steckdosen",
      ],
    },
    metaTitle: {
      pl: "Montaż fototapet — cała Polska | Neatual",
      en: "Photo mural installation across Poland | Neatual",
      de: "Fototapeten montieren, ganz Polen | Neatual",
    },
    metaDescription: {
      pl: "Montaż fototapet w domach i wnętrzach komercyjnych w całej Polsce. Pomiar, rozłożenie wzoru, klejenie na styk. Tapetę dostarcza klient lub projektant.",
      en: "Photo mural installation in homes and commercial interiors across Poland. Measuring, pattern layout, butted seams. The client or designer supplies the paper.",
      de: "Montage von Fototapeten in Wohn- und Gewerberäumen in ganz Polen. Aufmaß, Motivauslegung, Nähte auf Stoß. Die Tapete liefert der Kunde oder Planer.",
    },
  },
  {
    slug: "montaz-tapet-wzorzystych",
    pricingKey: "pattern-match",
    categories: ["geometryczne", "kwiatowe"],
    slugs: {
      pl: "montaz-tapet-wzorzystych",
      en: "patterned-wallpaper-installation",
      de: "montage-gemusterter-tapeten",
    },
    name: {
      pl: "Montaż tapet wzorzystych",
      en: "Patterned wallpaper installation",
      de: "Montage gemusterter Tapeten",
    },
    intro: {
      pl: "Tapeta wzorzysta ma raport, który musi się zgadzać na każdym łączeniu przez całą ścianę — a ściany bywają węższe u góry niż u dołu. Liczymy bryty tak, żeby wzór wychodził w narożnikach, a nie żeby po prostu starczyło rolki.",
      en: "Patterned wallpaper has a repeat that has to match at every seam along the whole wall — and walls are often narrower at the top than the bottom. We work the drops out so the pattern lands in the corners, not merely so the roll goes far enough.",
      de: "Gemusterte Tapete hat einen Rapport, der an jeder Naht über die ganze Wand passen muss — und Wände sind oben oft schmaler als unten. Wir teilen die Bahnen so ein, dass das Muster in den Ecken aufgeht, nicht nur, dass die Rolle reicht.",
    },
    scope: {
      pl: [
        "Sprawdzenie raportu i wyliczenie liczby brytów",
        "Wyznaczenie pionu niezależnie od narożnika",
        "Dopasowanie wzoru na każdym łączeniu",
        "Wykończenie przy ościeżnicach i narożnikach",
      ],
      en: [
        "Checking the repeat and working out the number of drops",
        "Striking the vertical independently of the corner",
        "Matching the pattern at every seam",
        "Finishing at door frames and corners",
      ],
      de: [
        "Rapport prüfen und Bahnenzahl ermitteln",
        "Lot unabhängig von der Ecke anschlagen",
        "Musteransatz an jeder Naht",
        "Abschluss an Zargen und Ecken",
      ],
    },
    metaTitle: {
      pl: "Montaż tapet wzorzystych — dopasowanie raportu | Neatual",
      en: "Patterned wallpaper installation | Neatual",
      de: "Gemusterte Tapeten montieren | Neatual",
    },
    metaDescription: {
      pl: "Montaż tapet wzorzystych z dopasowaniem raportu na każdym łączeniu. Wyliczamy bryty pod wymiar ściany. Pracujemy w całej Polsce.",
      en: "Patterned wallpaper installation with the repeat matched at every seam. Drops worked out to the wall. We work across the whole of Poland.",
      de: "Montage gemusterter Tapeten mit Musteransatz an jeder Naht. Bahnen aufs Wandmaß gerechnet. Wir arbeiten in ganz Polen.",
    },
  },
  {
    slug: "przygotowanie-scian-pod-tapete",
    pricingKey: "preparation",
    categories: ["strukturalne"],
    slugs: {
      pl: "przygotowanie-scian-pod-tapete",
      en: "wall-preparation-for-wallpaper",
      de: "wandvorbereitung-fuers-tapezieren",
    },
    name: {
      pl: "Przygotowanie ścian pod tapetę",
      en: "Wall preparation for wallpaper",
      de: "Wandvorbereitung fürs Tapezieren",
    },
    intro: {
      pl: "Tapeta nie wyrówna ściany — pokaże ją. Drobne ubytki uzupełniamy, powierzchnię gruntujemy, żeby klej trzymał równomiernie i żeby przy ewentualnym zdejmowaniu tapety nie schodził tynk.",
      en: "Wallpaper will not level a wall — it will show it. We fill minor defects and prime the surface so the adhesive grips evenly, and so the plaster does not come away with the paper if it is ever stripped.",
      de: "Tapete gleicht eine Wand nicht aus — sie zeigt sie. Wir schließen kleine Fehlstellen und grundieren die Fläche, damit der Kleber gleichmäßig hält und beim späteren Entfernen der Putz nicht mitgeht.",
    },
    scope: {
      pl: [
        "Ocena podłoża przed montażem",
        "Uzupełnienie drobnych ubytków",
        "Gruntowanie powierzchni",
        "Sprawdzenie pionu i poziomu ściany",
      ],
      en: [
        "Assessing the surface before installation",
        "Filling minor defects",
        "Priming the surface",
        "Checking the wall for plumb and level",
      ],
      de: [
        "Untergrund vor der Montage beurteilen",
        "Kleine Fehlstellen ausbessern",
        "Fläche grundieren",
        "Wand auf Lot und Waage prüfen",
      ],
    },
    metaTitle: {
      pl: "Przygotowanie ścian pod tapetę — gruntowanie | Neatual",
      en: "Wall preparation for wallpaper | Neatual",
      de: "Wandvorbereitung fürs Tapezieren | Neatual",
    },
    metaDescription: {
      pl: "Przygotowanie podłoża pod tapetę: uzupełnienie drobnych ubytków i gruntowanie. Wyceniane za m², razem z montażem lub osobno.",
      en: "Surface preparation for wallpaper: minor filling and priming. Quoted per m², alongside the installation or on its own.",
      de: "Untergrundvorbereitung fürs Tapezieren: kleine Ausbesserungen und Grundierung. Abrechnung pro m², mit der Montage oder separat.",
    },
  },
  {
    slug: "zdjecie-starej-tapety",
    pricingKey: "removal",
    categories: [],
    slugs: {
      pl: "zdjecie-starej-tapety",
      en: "wallpaper-removal",
      de: "entfernen-alter-tapeten",
    },
    name: {
      pl: "Zdjęcie starej tapety",
      en: "Removal of existing wallpaper",
      de: "Entfernen alter Tapeten",
    },
    intro: {
      pl: "Starą tapetę zdejmuje się przed nową, nie zakleja. Ile to zajmie, widać dopiero po pierwszym pasie — inaczej schodzi tapeta papierowa, inaczej winylowa położona na kilku warstwach kleju.",
      en: "Old wallpaper comes off before the new goes on; it is not papered over. How long it takes only becomes clear after the first strip — paper comes away differently from vinyl laid over several layers of old adhesive.",
      de: "Alte Tapete wird entfernt, nicht überklebt. Wie lange das dauert, zeigt sich erst nach der ersten Bahn — Papier löst sich anders als Vinyl über mehreren Schichten alten Klebers.",
    },
    scope: {
      pl: [
        "Zdjęcie starej tapety i resztek kleju",
        "Zabezpieczenie podłóg i mebli",
        "Ocena podłoża po zdjęciu",
        "Wywóz odpadów",
      ],
      en: [
        "Stripping the old paper and residual adhesive",
        "Protecting floors and furniture",
        "Assessing the surface once it is clear",
        "Taking the waste away",
      ],
      de: [
        "Alte Tapete und Kleberreste entfernen",
        "Böden und Möbel abdecken",
        "Untergrund nach dem Entfernen beurteilen",
        "Abfall abtransportieren",
      ],
    },
    metaTitle: {
      pl: "Zdjęcie starej tapety ze ścian — cała Polska | Neatual",
      en: "Removal of existing wallpaper | Neatual",
      de: "Alte Tapeten entfernen, ganz Polen | Neatual",
    },
    metaDescription: {
      pl: "Zdejmowanie starej tapety wraz z resztkami kleju, przed montażem nowej. Wyceniane za m². Pracujemy w całej Polsce.",
      en: "Stripping old wallpaper and residual adhesive before the new covering goes up. Quoted per m². We work across the whole of Poland.",
      de: "Entfernen alter Tapeten samt Kleberresten, bevor die neue Bahn kommt. Abrechnung pro m². Wir arbeiten in ganz Polen.",
    },
  },
  {
    slug: "tapetowanie-sufitow-i-scian-wysokich",
    pricingKey: "bespoke",
    categories: ["pejzaze", "artystyczne"],
    slugs: {
      pl: "tapetowanie-sufitow-i-scian-wysokich",
      en: "ceiling-and-high-wall-wallpapering",
      de: "tapezieren-von-decken-und-hohen-waenden",
    },
    name: {
      pl: "Tapetowanie sufitów i ścian wysokich",
      en: "Ceilings and high walls",
      de: "Decken und hohe Wände",
    },
    intro: {
      pl: "Sufity, klatki schodowe i ściany ponad standardową wysokość to inna robota niż ściana w pokoju: bryt trzeba prowadzić w dwie osoby, z rusztowania albo drabiny, a klej zaczyna schnąć, zanim pas dojdzie do końca. Takie zlecenia wyceniamy indywidualnie.",
      en: "Ceilings, stairwells and walls above standard height are a different job from a wall in a room: the drop takes two people and a tower or a ladder, and the adhesive starts to dry before the strip reaches the end. These are quoted individually.",
      de: "Decken, Treppenhäuser und Wände über Standardhöhe sind eine andere Arbeit als eine Zimmerwand: Die Bahn braucht zwei Personen und Gerüst oder Leiter, und der Kleber zieht an, bevor sie ausgelegt ist. Solche Aufträge kalkulieren wir individuell.",
    },
    scope: {
      pl: [
        "Sufity i powierzchnie nad głową",
        "Klatki schodowe i ściany ponad standardową wysokość",
        "Powierzchnie łukowe",
        "Wycena indywidualna dla każdej z nich",
      ],
      en: [
        "Ceilings and overhead surfaces",
        "Stairwells and walls above standard height",
        "Curved surfaces",
        "Each quoted individually",
      ],
      de: [
        "Decken und Flächen über Kopf",
        "Treppenhäuser und Wände über Standardhöhe",
        "Gewölbte Flächen",
        "Jeweils individuelle Kalkulation",
      ],
    },
    metaTitle: {
      pl: "Tapetowanie sufitów i ścian wysokich | Neatual",
      en: "Wallpapering ceilings and high walls | Neatual",
      de: "Decken und hohe Wände tapezieren | Neatual",
    },
    metaDescription: {
      pl: "Tapetowanie sufitów, klatek schodowych, ścian wysokich i powierzchni łukowych. Każde takie zlecenie wyceniamy indywidualnie.",
      en: "Wallpapering ceilings, stairwells, high walls and curved surfaces. Every job of this kind is quoted individually.",
      de: "Tapezieren von Decken, Treppenhäusern, hohen Wänden und gewölbten Flächen. Jeder dieser Aufträge wird individuell kalkuliert.",
    },
  },
  {
    slug: "tapetowanie-wnetrz-komercyjnych",
    pricingKey: "contract",
    categories: ["geometryczne", "strukturalne", "artystyczne"],
    slugs: {
      pl: "tapetowanie-wnetrz-komercyjnych",
      en: "commercial-interior-wallpapering",
      de: "tapezieren-gewerblicher-innenraeume",
    },
    name: {
      pl: "Tapetowanie wnętrz komercyjnych",
      en: "Commercial interiors",
      de: "Gewerbliche Innenräume",
    },
    intro: {
      pl: "W biurze, hotelu czy lokalu usługowym termin bywa ważniejszy od stawki — praca idzie po godzinach albo w oknie między jednym najemcą a drugim. Pracujemy z projektantami i wykonawcami wnętrz, którzy dostarczają tapetę i harmonogram.",
      en: "In an office, a hotel or a retail unit the date often matters more than the rate — the work goes in after hours, or in the window between one tenant and the next. We work with designers and fit-out contractors, who supply both the paper and the programme.",
      de: "Im Büro, Hotel oder Ladenlokal zählt der Termin oft mehr als der Satz — gearbeitet wird nach Feierabend oder im Fenster zwischen zwei Mietern. Wir arbeiten mit Planern und Innenausbauern, die Tapete und Terminplan stellen.",
    },
    scope: {
      pl: [
        "Biura, hotele, lokale usługowe i korytarze",
        "Praca w oknach czasowych ustalonych z inwestorem",
        "Współpraca z projektantem lub generalnym wykonawcą",
        "Wycena i harmonogram przed rozpoczęciem",
      ],
      en: [
        "Offices, hotels, retail units and hallways",
        "Working to time windows agreed with the client",
        "Alongside the designer or main contractor",
        "Quote and programme agreed before we start",
      ],
      de: [
        "Büros, Hotels, Ladenlokale und Flure",
        "Arbeit in abgestimmten Zeitfenstern",
        "Zusammenarbeit mit Planer oder Generalunternehmer",
        "Angebot und Terminplan vor Beginn",
      ],
    },
    metaTitle: {
      pl: "Tapetowanie biur i wnętrz komercyjnych | Neatual",
      en: "Commercial interior wallpapering | Neatual",
      de: "Tapezieren gewerblicher Innenräume | Neatual",
    },
    metaDescription: {
      pl: "Montaż tapet i fototapet w biurach, hotelach i lokalach usługowych w całej Polsce. Praca w ustalonych oknach czasowych, z projektantem lub wykonawcą.",
      en: "Wallpaper and mural installation in offices, hotels and retail units across Poland. Working to agreed time windows, with the designer or contractor.",
      de: "Montage von Tapeten und Fototapeten in Büros, Hotels und Ladenlokalen in ganz Polen. Arbeit in abgestimmten Zeitfenstern, mit Planer oder Ausbauer.",
    },
  },
];

/**
 * The paragraph at the top of /uslugi.
 *
 * The hub needs prose of its own, not just a list of links: it is the page
 * meant to answer "montaż tapet" and "tapetowanie ścian", and a page that is
 * only navigation ranks for nothing. It restates the one thing that decides
 * whether a visitor is in the right place — that the wallpaper is theirs to buy
 * and the hanging is ours — because arriving here from a search is the most
 * likely way to reach the site without having read the home page.
 */
export const SERVICES_INTRO = {
  pl: "Wieszamy tapety i fototapety w całej Polsce — w mieszkaniach, domach i wnętrzach komercyjnych. Tapetę kupuje klient albo jego projektant; my odpowiadamy za pomiar, przygotowanie ściany i montaż. Poniżej zakres prac, które wykonujemy.",
  en: "We hang wallpaper and murals across Poland — in flats, houses and commercial interiors. The client or their designer buys the paper; measuring, preparing the wall and hanging it are ours. Below is the work we take on.",
  de: "Wir tapezieren in ganz Polen — in Wohnungen, Häusern und Gewerberäumen. Die Tapete kauft der Kunde oder sein Planer; Aufmaß, Wandvorbereitung und Montage übernehmen wir. Unten der Leistungsumfang.",
};

/** Shared across every service page, the way PRODUCT_SHARED is across categories. */
export const SERVICE_SHARED = {
  scopeHeading: {
    pl: "Co wchodzi w zakres",
    en: "What the work covers",
    de: "Was dazugehört",
  },
  galleryHeading: {
    pl: "Zobacz realizacje",
    en: "See completed work",
    de: "Abgeschlossene Arbeiten",
  },
  pricingLink: {
    pl: "Zobacz cennik montażu",
    en: "See installation pricing",
    de: "Preise für die Montage",
  },
  backToServices: {
    pl: "Wszystkie usługi",
    en: "All services",
    de: "Alle Leistungen",
  },
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
  services: {
    suffix: { pl: "Usługi", en: "Services", de: "Leistungen" },
    description: {
      pl: "Montaż tapet i fototapet w całej Polsce: tapety wzorzyste i strukturalne, przygotowanie ścian, zdjęcie starej tapety, sufity i wnętrza komercyjne.",
      en: "Wallpaper and mural installation across Poland: patterned and textured papers, wall preparation, stripping old paper, ceilings and commercial interiors.",
      de: "Montage von Tapeten und Fototapeten in ganz Polen: gemusterte und strukturierte Tapeten, Wandvorbereitung, Entfernen alter Tapeten, Decken, Gewerberäume.",
    },
  },
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
      pl: "Cennik montażu tapet: od 35 zł/m² za tapety obiektowe, od 40 zł/m² z pasowaniem wzoru. Przygotowanie podłoża i zdjęcie starej tapety wyceniamy indywidualnie.",
      en: "Wallpaper installation pricing: from 35 PLN/m² for contract wallpaper, from 40 PLN/m² with pattern matching. Preparation and stripping quoted individually.",
      de: "Preise für Tapezierarbeiten: ab 35 PLN/m² für Objekttapeten, ab 40 PLN/m² mit Musteranpassung. Untergrundvorbereitung und Tapetenentfernung individuell.",
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
