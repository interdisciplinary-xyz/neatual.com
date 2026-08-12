import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
  galleryCategoryPath,
} from "../lib/seo";
import { getContent } from "../lib/content.server";

// One entry point for both the <loc> and its alternates, so a URL can never be
// submitted under one path and annotated under another.
function urlFor(paths, page, code, slug) {
  if (slug) return `${SITE_URL}${galleryCategoryPath(code, slug, paths)}`;
  return `${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}`;
}

function alternateLinks(paths, page, slug) {
  const links = LOCALE_CODES.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${code}" href="${urlFor(paths, page, code, slug)}"/>`
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(paths, page, DEFAULT_LOCALE, slug)}"/>`
  );
  return links.join("\n");
}

function urlBlock(paths, page, code, slug) {
  return `  <url>
    <loc>${urlFor(paths, page, code, slug)}</loc>
${alternateLinks(paths, page, slug)}
  </url>`;
}

function sitemapXml(paths, categorySlugs) {
  // Iterates PAGE_KEYS and LOCALE_CODES rather than Object.keys(paths): GROQ
  // returns documents alphabetically, so keying off the response would silently
  // reorder the sitemap depending on whether the CMS or the fallback answered.
  const urls = PAGE_KEYS.flatMap((page) =>
    LOCALE_CODES.map((code) => urlBlock(paths, page, code))
  );

  // Category pages, after the four fixed pages. Slugs come from the product list
  // in the same response as `paths`, so a category added in the Studio is in the
  // sitemap on the next request rather than at the next deploy.
  urls.push(
    ...categorySlugs.flatMap((slug) =>
      LOCALE_CODES.map((code) => urlBlock(paths, "gallery", code, slug))
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
  const categorySlugs = (content.products ?? []).map((p) => p.slug);
  return new Response(sitemapXml(content.paths, categorySlugs), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
