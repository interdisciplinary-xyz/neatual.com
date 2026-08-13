import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
  getPageKey,
  getGalleryCategorySlug,
  getServiceSlug,
  galleryCategoryPath,
  servicePath,
  localizedSlug,
  findBySlug,
  findByAnySlug,
} from "../app/lib/seo";
import { loader as sitemapLoader } from "../app/routes/sitemap[.]xml.js";
import { PRODUCTS, SERVICES, PRICING } from "../app/lib/inlineCopy";

// Vitest serves these modules through Vite, so `import.meta.url` is not a file:
// URL and cannot be resolved against. The suite runs from the project root.
const fromRoot = (...parts) => join(process.cwd(), ...parts);
const URL_COUNT =
  LOCALE_CODES.length * (PAGE_KEYS.length + PRODUCTS.length + SERVICES.length);

/*
  The two collections keyed by the route prefix that serves them, so the
  route-derivation test below can expand a `$slug` route with the right set in
  the right language.

  This is also the table that would have caught the bug it now guards: with the
  slugs translated, every one of these 36 URLs is a different string, and a
  sitemap that emitted the Polish slug under /de/ would look perfectly valid.
*/
const COLLECTIONS = {
  galeria: { locale: "pl", entries: PRODUCTS, pathFor: galleryCategoryPath },
  "en/gallery": {
    locale: "en",
    entries: PRODUCTS,
    pathFor: galleryCategoryPath,
  },
  "de/galerie": {
    locale: "de",
    entries: PRODUCTS,
    pathFor: galleryCategoryPath,
  },
  uslugi: { locale: "pl", entries: SERVICES, pathFor: servicePath },
  "en/services": { locale: "en", entries: SERVICES, pathFor: servicePath },
  "de/leistungen": { locale: "de", entries: SERVICES, pathFor: servicePath },
};

// These pin the finding fixed in 6943874: the sitemap emitted only the three
// Polish paths as <loc>, with the English and German URLs present solely as
// hreflang alternates — which annotate a URL but do not submit it. Six of the
// nine pages were never in the sitemap.
describe("sitemap.xml", () => {
  it("emits one <loc> per page per locale, categories included", async () => {
    const body = await (await sitemapLoader()).text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    expect(locs).toHaveLength(URL_COUNT);

    const expected = [
      ...PAGE_KEYS.flatMap((page) =>
        LOCALE_CODES.map((code) => `${SITE_URL}${HREFLANG_URLS[code][page]}`)
      ),
      ...PRODUCTS.flatMap((category) =>
        LOCALE_CODES.map(
          (code) => `${SITE_URL}${galleryCategoryPath(code, category)}`
        )
      ),
      ...SERVICES.flatMap((service) =>
        LOCALE_CODES.map((code) => `${SITE_URL}${servicePath(code, service)}`)
      ),
    ];
    expect(new Set(locs)).toEqual(new Set(expected));
  });

  it("gives every URL the full reciprocal hreflang set plus x-default", async () => {
    const body = await (await sitemapLoader()).text();
    const urlBlocks = [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
      (m) => m[1]
    );

    expect(urlBlocks).toHaveLength(URL_COUNT);

    const hrefFor = (block, code) =>
      block.match(new RegExp(`hreflang="${code}" href="([^"]+)"`))?.[1];

    for (const block of urlBlocks) {
      for (const code of LOCALE_CODES) {
        expect(hrefFor(block, code), `${code} alternate missing`).toBeTypeOf(
          "string"
        );
      }
      // x-default must point at the default locale's URL for the same page,
      // not simply at the site root.
      expect(hrefFor(block, "x-default")).toBe(hrefFor(block, DEFAULT_LOCALE));
    }
  });

  /*
    The guard that makes "every page is in the sitemap" a property of the build
    rather than something remembered. It derives the URL set from the route files
    themselves, so adding app/routes/blog.jsx and forgetting the sitemap fails
    here — which is how six of the nine pages went missing once already.

    Route file → URL, in Remix's flat-route convention: dots are path separators,
    `_index` is the parent path itself, a trailing `_` opts out of nesting and
    means nothing to the URL, and `$slug` expands to one URL per document in the
    collection that prefix serves — in that prefix's language.
  */
  it("covers every route the app serves, and serves every URL it lists", async () => {
    const files = readdirSync(fromRoot("app", "routes"))
      .filter((file) => file.endsWith(".jsx"))
      .sort();

    const fromRoutes = new Set(
      files.flatMap((file) => {
        const parts = file
          .replace(/\.jsx$/, "")
          .split(".")
          .map((segment) => segment.replace(/_$/, ""))
          .filter((segment) => segment !== "_index");

        if (parts.some((segment) => segment.startsWith("$"))) {
          const prefix = parts.filter((s) => !s.startsWith("$")).join("/");
          const collection = COLLECTIONS[prefix];
          if (!collection) {
            throw new Error(
              `No collection registered for the dynamic route ${file} (prefix "${prefix}"). ` +
                `Add it to COLLECTIONS, or the sitemap check below cannot see its URLs.`
            );
          }
          const { locale, entries, pathFor } = collection;
          return entries.map((entry) => `${SITE_URL}${pathFor(locale, entry)}`);
        }
        return [`${SITE_URL}${parts.length ? `/${parts.join("/")}` : "/"}`];
      })
    );

    const body = await (await sitemapLoader()).text();
    const fromSitemap = new Set(
      [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    );

    expect(fromSitemap).toEqual(fromRoutes);
  });

  it("is well-formed XML with the right content type", async () => {
    const res = await sitemapLoader();
    const body = await res.text();
    expect(res.headers.get("Content-Type")).toContain("xml");
    expect(body.startsWith('<?xml version="1.0"')).toBe(true);
    // Every opened tag closes; a cheap structural check that catches the
    // template-string breakage this file is most likely to suffer.
    for (const tag of ["urlset", "url", "loc"]) {
      const open = (body.match(new RegExp(`<${tag}[ >]`, "g")) || []).length;
      const close = (body.match(new RegExp(`</${tag}>`, "g")) || []).length;
      expect(open, `<${tag}> open/close mismatch`).toBe(close);
    }
  });
});

describe("HREFLANG_URLS", () => {
  it("covers every locale and page with no duplicate paths", () => {
    const paths = [];
    for (const code of LOCALE_CODES) {
      for (const page of PAGE_KEYS) {
        const path = HREFLANG_URLS[code]?.[page];
        expect(path, `${code}.${page} missing`).toBeTypeOf("string");
        expect(path.startsWith("/")).toBe(true);
        paths.push(path);
      }
    }
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("getPageKey", () => {
  it("maps every localised path to its page", () => {
    for (const code of LOCALE_CODES) {
      for (const page of PAGE_KEYS) {
        expect(getPageKey(HREFLANG_URLS[code][page])).toBe(page);
      }
    }
  });

  it("tolerates a trailing slash", () => {
    expect(getPageKey("/galeria/")).toBe("gallery");
    expect(getPageKey("/en/contact/")).toBe("contact");
  });

  it("falls back to home for unknown paths", () => {
    expect(getPageKey("/nie-ma-takiej-strony")).toBe("home");
    expect(getPageKey(undefined)).toBe("home");
  });

  it("treats a category page as the gallery", () => {
    for (const code of LOCALE_CODES) {
      expect(getPageKey(galleryCategoryPath(code, "kwiatowe"))).toBe("gallery");
    }
  });
});

describe("getGalleryCategorySlug", () => {
  it("reads the slug from a category path in every locale", () => {
    for (const code of LOCALE_CODES) {
      expect(
        getGalleryCategorySlug(galleryCategoryPath(code, "kwiatowe"))
      ).toBe("kwiatowe");
      expect(
        getGalleryCategorySlug(`${galleryCategoryPath(code, "pejzaze")}/`)
      ).toBe("pejzaze");
    }
  });

  it("is null for the gallery index and for every other page", () => {
    for (const code of LOCALE_CODES) {
      for (const page of PAGE_KEYS) {
        expect(getGalleryCategorySlug(HREFLANG_URLS[code][page])).toBe(null);
      }
    }
  });

  // The pattern is anchored precisely so a deeper path cannot have its last
  // segment read as a category — /galeria/kwiatowe/cokolwiek is not a category.
  it("is null for a path below a category", () => {
    expect(getGalleryCategorySlug("/galeria/kwiatowe/cokolwiek")).toBe(null);
    expect(getPageKey("/galeria/kwiatowe/cokolwiek")).toBe("home");
  });
});

/*
  The translated slugs.

  Every one of these guards a failure that is invisible on the rendered page: the
  site looks right, and the URLs, the hreflang set or the redirects are wrong.
  The pre-translation bug this replaced — one Polish slug served under /en/ and
  /de/ — rendered perfectly for two commits.
*/
describe("translated slugs", () => {
  const ALL = [...PRODUCTS, ...SERVICES];

  it("gives every category and service a distinct slug in all three locales", () => {
    for (const entry of ALL) {
      for (const code of LOCALE_CODES) {
        const slug = localizedSlug(entry, code);
        expect(slug, `${entry.slug}.${code} missing`).toBeTypeOf("string");
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    }
  });

  // Two documents sharing a slug in one language is a collision: one of the two
  // pages becomes unreachable, and which one depends on array order.
  it("has no slug collisions within a collection and locale", () => {
    for (const entries of [PRODUCTS, SERVICES]) {
      for (const code of LOCALE_CODES) {
        const slugs = entries.map((entry) => localizedSlug(entry, code));
        expect(new Set(slugs).size, `duplicate slug in ${code}`).toBe(
          slugs.length
        );
      }
    }
  });

  it("keeps the reference id out of every published URL", () => {
    // The ids ("kwiatowe", "montaz-fototapet") are what service pages point at
    // and what public/gallery is named after. A URL that still carried one
    // would mean a document was seeded without translated slugs.
    for (const entry of PRODUCTS) {
      expect(localizedSlug(entry, "en")).not.toBe(entry.slug);
      expect(localizedSlug(entry, "de")).not.toBe(entry.slug);
    }
  });

  it("resolves a bare string slug, for a document with no translations yet", () => {
    // The shape a category added in the Studio has before somebody fills in the
    // other two languages. It must keep resolving rather than 404.
    expect(localizedSlug("kwiatowe", "de")).toBe("kwiatowe");
    expect(galleryCategoryPath("de", "kwiatowe")).toBe("/de/galerie/kwiatowe");
  });

  it("round-trips a path back to the document that owns it", () => {
    for (const code of LOCALE_CODES) {
      for (const category of PRODUCTS) {
        const segment = getGalleryCategorySlug(
          galleryCategoryPath(code, category)
        );
        expect(findBySlug(PRODUCTS, code, segment)?.slug).toBe(category.slug);
      }
      for (const service of SERVICES) {
        const segment = getServiceSlug(servicePath(code, service));
        expect(findBySlug(SERVICES, code, segment)?.slug).toBe(service.slug);
      }
    }
  });

  // The half of the lookup that stops two URLs serving one page. Without it
  // /galeria/floral-mural-installation would render the Polish page, and the
  // canonical would point somewhere the crawler did not ask for.
  it("does not resolve another locale's slug", () => {
    const floral = PRODUCTS.find((p) => p.slug === "kwiatowe");
    expect(findBySlug(PRODUCTS, "pl", floral.slugs.en)).toBe(null);
    expect(findBySlug(PRODUCTS, "de", floral.slugs.pl)).toBe(null);
  });

  // ...but the route redirects rather than 404s, and this is what it asks.
  it("finds the document behind a foreign or pre-translation slug", () => {
    const floral = PRODUCTS.find((p) => p.slug === "kwiatowe");
    expect(findByAnySlug(PRODUCTS, floral.slugs.en)?.slug).toBe("kwiatowe");
    // The address these pages shipped with, which is the one that could be
    // indexed already.
    expect(findByAnySlug(PRODUCTS, "kwiatowe")?.slug).toBe("kwiatowe");
    expect(findByAnySlug(PRODUCTS, "nie-ma-takiej-kategorii")).toBe(null);
  });

  it("routes a service path to the services page key, not the gallery", () => {
    for (const code of LOCALE_CODES) {
      for (const service of SERVICES) {
        expect(getPageKey(servicePath(code, service))).toBe("services");
      }
      expect(getPageKey(HREFLANG_URLS[code].services)).toBe("services");
      expect(getServiceSlug(HREFLANG_URLS[code].services)).toBe(null);
    }
  });

  // Every service names a row in the price table. A page describing work the
  // business has not priced is the failure mode this whole section exists to
  // avoid — see the note on SERVICES in inlineCopy.js.
  it("backs every service with a price list row", () => {
    const keys = new Set(PRICING.rows.map((row) => row.key));
    for (const service of SERVICES) {
      expect(keys.has(service.pricingKey), `${service.slug}`).toBe(true);
    }
  });

  // Cross-references are ids, not URLs, so a typo here is a link to nothing.
  it("points every service at gallery categories that exist", () => {
    const ids = new Set(PRODUCTS.map((p) => p.slug));
    for (const service of SERVICES) {
      for (const id of service.categories ?? []) {
        expect(ids.has(id), `${service.slug} → ${id}`).toBe(true);
      }
    }
  });
});

/*
  A sitemap nobody can find, or a page the sitemap lists and robots.txt blocks,
  is the same as no sitemap. These two facts live in a static file that no other
  test touches.
*/
describe("robots.txt", () => {
  const robots = readFileSync(fromRoot("public", "robots.txt"), "utf8");

  it("points crawlers at the sitemap", () => {
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it("disallows nothing", () => {
    expect(robots).toContain("Allow: /");
    expect(robots).not.toMatch(/^\s*Disallow:\s*\S/m);
  });
});
