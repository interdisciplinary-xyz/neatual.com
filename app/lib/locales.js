export const LOCALES = {
  pl: {
    lang: "pl-PL",
    title: "Neatual.com | Szwalnia z pasją.",
    description:
      "Neatual - produkcja i dystrybucja uniformów od ponad 25 lat. Dbałość o szczegóły, polskie materiały, najwyższa jakość. EKOTRADE, Zespół Artystyczny PW.",
    navItems: [
      { label: "Główna", link: "/" },
      { label: "Galeria", link: "/galeria" },
      { label: "Kontakt", link: "/kontakt" },
    ],
    home: {
      heading:
        "Jesteśmy na rynku ponad 25 lat, zajmujemy się produkcją oraz dystrybucją uniformów.",
      shortDescription:
        "Naszym priorytetem jest dbałość o szczegóły i jakość wykonania a schludny efekt końcowy jest naszą motywacją. Starannie dobieramy materiały, korzystając tylko z produktów polskiego pochodzenia...",
      fullDescription: `Naszym priorytetem jest dbałość o szczegóły i jakość wykonania a schludny efekt końcowy jest
        naszą motywacją. Starannie dobieramy materiały, korzystając tylko z produktów polskiego
        pochodzenia. Nasza praca polega na dopracowywania i licznych konsultacjach. Chcemy, żeby
        każdy kto nosi nasze uniformy czuł się komfortowo i schludnie bez straty na elegancji.
        Tradycja przepleciona podążaniem za trendami oraz najwyższą jakością jest czymś czym się
        wyróżniamy.<br><br>
        Dotychczas współpracowaliśmy z firmami zajmującymi się ochroną mienia, produkcją
        żywności oraz występami artystycznymi. Prowadzimy produkcję dla takich firm jak: EKOTRADE
        czy Zespół Artystyczny Politechniki Warszawskiej.<br><br>
        Nasza branża nie ma przed nami tajemnic dlatego otwarci jesteśmy na współpracę z
        innymi podmiotami, które wykazują zapotrzebowanie na specjalistyczne zaopatrzenie.`,
    },
    contact: {
      phone: "+ 48 739 903 148",
      email: "info@neatual.com",
      message: "Napisz",
      call: "Zadzwoń",
      address: "ul.Siedlecka 172, 08-110 Żelków-Kolonia, Polska",
    },
  },
  en: {
    lang: "en-US",
    title: "Neatual.com | Sewing with passion.",
    description:
      "Neatual - uniform production and distribution for over 25 years. Attention to detail, Polish materials, highest quality. EKOTRADE, Warsaw University of Technology.",
    navItems: [
      { label: "Home", link: "/en" },
      { label: "Gallery", link: "/en/gallery" },
      { label: "Contact", link: "/en/contact" },
    ],
    home: {
      heading:
        "Our company has been around for over 25 years and we specialise in the production and distribution of uniforms.",
      shortDescription:
        "Our company has been around for over 25 years and we specialise in the production and distribution of uniforms. We always prioritise quality by taking care of the details in an orderly fashion by...",
      fullDescription: `Our company has been around for over 25 years and we specialise in the production
        and distribution of uniforms. We always prioritise quality by taking care of the details in an
        orderly fashion by providing the best possible service. As a company, we come together to
        agree that it is this point that strides us to be a truly sublime establishment. We embrace
        our clients to wear uniforms that make them feel comfortable and at ease, while looking
        formal to provide a magnificent appealing appearance. Tradition intertwined following the
        trends of the time while securing the highest quality is what makes us stand out.<br><br>
        As it stands, we have worked with companies involved in Property Protection, Food
        Production, and Artistic Performances. We have production for example for EKOTRADE or
        The Artistic Ensemble of the Warsaw University of Technology.<br><br>
        There are no secrets left for us to find out in our industry, so we are open to
        cooperate with other entities that have a need for specialized supplies.`,
    },
    contact: {
      phone: "+ 48 739 903 148",
      email: "info@neatual.com",
      message: "Mail us",
      call: "Call us",
      address: "ul.Siedlecka 172, 08-110 Żelków-Kolonia, Polska",
    },
  },
  de: {
    lang: "de-DE",
    title: "Neatual.com | Schneiderei mit Leidenschaft.",
    description:
      "Neatual - Uniformproduktion und -vertrieb seit über 25 Jahren. Liebe zum Detail, polnische Materialien, höchste Qualität.",
    navItems: [
      { label: "Zuhause", link: "/de" },
      { label: "Galerie", link: "/de/galerie" },
      { label: "Kontakte", link: "/de/kontakte" },
    ],
    home: {
      heading:
        "Wir sind seit über 25 Jahren auf dem Markt, wir fertigen und vertreiben Uniformen.",
      shortDescription:
        "Wir sind seit über 25 Jahren auf dem Markt, wir fertigen und vertreiben Uniformen. Unsere Priorität ist die Liebe zum Detail und die Qualität der Verarbeitung. Ein sauberes Endergebnis ist unsere Motivation...",
      fullDescription: `Wir sind seit über 25 Jahren auf dem Markt, wir fertigen und vertreiben Uniformen. Unsere
        Priorität ist die Liebe zum Detail und die Qualität der Verarbeitung. Ein sauberes Endergebnis ist
        unsere Motivation. Unsere Arbeit besteht aus Feinabstimmungen und zahlreichen Beratungen. Wir
        möchten, dass sich jeder, der unsere Uniformen trägt, wohlfühlt und ordentlich aussieht, ohne
        dabei an Eleganz zu verlieren. Tradition gepaart mit Trendverfolgung und höchster Qualität
        zeichnet uns aus.<br><br>
        Bisher haben wir mit Firmen zusammengearbeitet, die sich mit Eigentumsschutz,
        Lebensmittelproduktion und künstlerischen Darbietungen beschäftigen.
        Wir produzieren u.a. für Unternehmen wie: EKOTRADE oder das Künstlerische Ensemble der
        Warschauer Universität für Technologie.<br><br>
        Unsere Branche hat keine Geheimnisse vor uns, deshalb sind wir offen für die
        Zusammenarbeit mit anderen Unternehmen, die Bedarf an spezialisierten Lieferungen zeigen.`,
    },
    contact: {
      phone: "+ 48 739 903 148",
      email: "info@neatual.com",
      message: "Schreiben",
      call: "Anrufen",
      address: "ul.Siedlecka 172, 08-110 Żelków-Kolonia, Polska",
    },
  },
};

export function getLocaleFromPath(pathname) {
  if (pathname.startsWith("/de")) return "de";
  if (pathname.startsWith("/en")) return "en";
  return "pl";
}
