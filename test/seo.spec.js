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
  galleryCategoryPath,
} from "../app/lib/seo";
import { loader as sitemapLoader } from "../app/routes/sitemap[.]xml.js";
import { PRODUCTS } from "../app/lib/inlineCopy";

// The gallery categories, as the sitemap sees them when Sanity is unreachable
// and the bundled copy answers — which is the case in this suite.
const CATEGORY_SLUGS = PRODUCTS.map((product) => product.slug);

// Vitest serves these modules through Vite, so `import.meta.url` is not a file:
// URL and cannot be resolved against. The suite runs from the project root.
const fromRoot = (...parts) => join(process.cwd(), ...parts);
const URL_COUNT =
  LOCALE_CODES.length * (PAGE_KEYS.length + CATEGORY_SLUGS.length);

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
      ...CATEGORY_SLUGS.flatMap((slug) =>
        LOCALE_CODES.map(
          (code) => `${SITE_URL}${galleryCategoryPath(code, slug)}`
        )
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
    means nothing to the URL, and `$slug` expands to one URL per category.
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
          return CATEGORY_SLUGS.map((slug) => `${SITE_URL}/${prefix}/${slug}`);
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
