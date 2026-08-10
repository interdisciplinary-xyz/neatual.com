import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
} from "../lib/seo";
import { getContent } from "../lib/content.server";

function alternateLinks(paths, page) {
  const hrefFor = (code) => `${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}`;
  const links = LOCALE_CODES.map(
    (code) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${hrefFor(code)}"/>`
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${hrefFor(DEFAULT_LOCALE)}"/>`
  );
  return links.join("\n");
}

function sitemapXml(paths) {
  // Iterates PAGE_KEYS and LOCALE_CODES rather than Object.keys(paths): GROQ
  // returns documents alphabetically, so keying off the response would silently
  // reorder the sitemap depending on whether the CMS or the fallback answered.
  const urls = PAGE_KEYS.flatMap((page) =>
    LOCALE_CODES.map(
      (code) =>
        `  <url>
    <loc>${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}</loc>
${alternateLinks(paths, page)}
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
  const content = await getContent(DEFAULT_LOCALE);
  return new Response(sitemapXml(content.paths), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
