import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
  galleryCategoryPath,
  servicePath,
} from "../lib/seo";
import { getContent } from "../lib/content.server";

// One entry point for both the <loc> and its alternates, so a URL can never be
// submitted under one path and annotated under another.
//
// `entry` is a category or service document, not a slug: with the slugs
// translated, the German URL for a page is a different string from the Polish
// one, and only the document knows both. Passing a slug here was what made a
// shared-slug sitemap possible and is exactly what stopped working.
function urlFor(paths, page, code, entry) {
  if (entry) {
    const pathFor = page === "services" ? servicePath : galleryCategoryPath;
    return `${SITE_URL}${pathFor(code, entry, paths)}`;
  }
  return `${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}`;
}

function alternateLinks(paths, page, entry) {
  const links = LOCALE_CODES.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${code}" href="${urlFor(paths, page, code, entry)}"/>`
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(paths, page, DEFAULT_LOCALE, entry)}"/>`
  );
  return links.join("\n");
}

function urlBlock(paths, page, code, entry) {
  return `  <url>
    <loc>${urlFor(paths, page, code, entry)}</loc>
${alternateLinks(paths, page, entry)}
  </url>`;
}

function sitemapXml(paths, categories, services) {
  // Iterates PAGE_KEYS and LOCALE_CODES rather than Object.keys(paths): GROQ
  // returns documents alphabetically, so keying off the response would silently
  // reorder the sitemap depending on whether the CMS or the fallback answered.
  const urls = PAGE_KEYS.flatMap((page) =>
    LOCALE_CODES.map((code) => urlBlock(paths, page, code))
  );

  // The two collections, after the fixed pages. Both come from the same response
  // as `paths`, so a category or service added in the Studio is in the sitemap
  // on the next request rather than at the next deploy.
  urls.push(
    ...categories.flatMap((category) =>
      LOCALE_CODES.map((code) => urlBlock(paths, "gallery", code, category))
    ),
    ...services.flatMap((service) =>
      LOCALE_CODES.map((code) => urlBlock(paths, "services", code, service))
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
  return new Response(
    sitemapXml(content.paths, content.products ?? [], content.services ?? []),
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
