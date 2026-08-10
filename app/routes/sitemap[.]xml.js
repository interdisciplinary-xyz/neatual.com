import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
} from "../lib/seo";

function alternateLinks(page) {
  const links = LOCALE_CODES.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${code}" href="${SITE_URL}${HREFLANG_URLS[code][page]}"/>`
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${HREFLANG_URLS[DEFAULT_LOCALE][page]}"/>`
  );
  return links.join("\n");
}

function sitemapXml() {
  // Each locale of a page gets its own <loc>. Listing a URL only as an
  // hreflang alternate does not submit it — every canonical URL needs an entry.
  const urls = PAGE_KEYS.flatMap((page) =>
    LOCALE_CODES.map(
      (code) =>
        `  <url>
    <loc>${SITE_URL}${HREFLANG_URLS[code][page]}</loc>
${alternateLinks(page)}
  </url>`
    )
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
