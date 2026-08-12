import { describe, it, expect } from "vitest";
import {
  SITE_URL,
  LOCALE_CODES,
  PAGE_KEYS,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
  getPageKey,
} from "../app/lib/seo";
import { loader as sitemapLoader } from "../app/routes/sitemap[.]xml.js";

// These pin the finding fixed in 6943874: the sitemap emitted only the three
// Polish paths as <loc>, with the English and German URLs present solely as
// hreflang alternates — which annotate a URL but do not submit it. Six of the
// nine pages were never in the sitemap.
describe("sitemap.xml", () => {
  it("emits one <loc> per page per locale", async () => {
    const body = await (await sitemapLoader()).text();
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    expect(locs).toHaveLength(LOCALE_CODES.length * PAGE_KEYS.length);

    const expected = PAGE_KEYS.flatMap((page) =>
      LOCALE_CODES.map((code) => `${SITE_URL}${HREFLANG_URLS[code][page]}`)
    );
    expect(new Set(locs)).toEqual(new Set(expected));
  });

  it("gives every URL the full reciprocal hreflang set plus x-default", async () => {
    const body = await (await sitemapLoader()).text();
    const urlBlocks = [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
      (m) => m[1]
    );

    expect(urlBlocks).toHaveLength(LOCALE_CODES.length * PAGE_KEYS.length);

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
});
