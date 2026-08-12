import { describe, it, expect } from "vitest";
import { fromLocales } from "../app/lib/content.server";
import { PRICING } from "../app/lib/inlineCopy";
import { LOCALE_CODES, PAGE_KEYS, HREFLANG_URLS } from "../app/lib/seo";

describe("pricing content", () => {
  it("resolves in every locale", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      expect(pricing, `${code} pricing missing`).toBeTruthy();
      expect(pricing.rows.length).toBe(PRICING.rows.length);
      for (const row of pricing.rows) {
        expect(row.label, `${code} row label`).toBeTypeOf("string");
        expect(row.label.trim()).not.toBe("");
        expect(row.price.trim()).not.toBe("");
      }
    }
  });

  /*
    The guard that matters most on this page. Placeholder rates on a real
    business's site are only defensible while something on the page says so, and
    while search engines are kept off it (see the robots meta in root.jsx). If
    `isPlaceholder` ever defaults to false without real numbers being entered,
    both protections vanish silently — which is the failure this pins.
  */
  it("declares itself provisional while the rates are placeholders", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      expect(pricing.isPlaceholder).toBe(true);
      expect(pricing.placeholderNotice).toBeTypeOf("string");
      expect(pricing.placeholderNotice.trim()).not.toBe("");
    }
  });

  it("carries no digit that could be read as a real rate", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      for (const row of pricing.rows) {
        expect(
          row.price,
          `${code}/${row.key} looks like a real price`
        ).not.toMatch(/\d/);
      }
    }
  });

  it("is a full page in the nav, sitemap and hreflang map", () => {
    expect(PAGE_KEYS).toContain("pricing");
    for (const code of LOCALE_CODES) {
      expect(HREFLANG_URLS[code].pricing).toBeTypeOf("string");
      const { pages } = fromLocales(code);
      expect(pages.pricing.path).toBe(HREFLANG_URLS[code].pricing);
      expect(pages.pricing.navLabel.trim()).not.toBe("");
      expect(pages.pricing.srHeading.trim()).not.toBe("");
      expect(pages.pricing.metaTitle).toContain("—");
      expect(pages.pricing.metaDescription.trim()).not.toBe("");
    }
  });
});
