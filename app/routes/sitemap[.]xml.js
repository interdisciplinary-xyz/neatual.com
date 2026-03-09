const SITE_URL = "https://neatual.com";

const PAGES = [
  { path: "/", alternates: { pl: "/", en: "/en", de: "/de" } },
  { path: "/galeria", alternates: { pl: "/galeria", en: "/en/gallery", de: "/de/galerie" } },
  { path: "/kontakt", alternates: { pl: "/kontakt", en: "/en/contact", de: "/de/kontakte" } },
];

function sitemapXml() {
  const urls = PAGES.map(
    (page) =>
      `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <xhtml:link rel="alternate" hreflang="pl" href="${SITE_URL}${page.alternates.pl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${page.alternates.en}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE_URL}${page.alternates.de}"/>
  </url>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;
}

export async function loader() {
  return new Response(sitemapXml(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
