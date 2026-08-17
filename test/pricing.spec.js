import { describe, it, expect } from "vitest";
import { fromLocales } from "../app/lib/content.server";
import { PRICING, RATE_NUMBERS } from "../app/lib/inlineCopy";
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
    The inverse of the guard this file used to carry. While the rates were fake,
    `isPlaceholder` had to be true — the notice and the `noindex` in root.jsx both
    hang off it. The rates are real as of 2026-08-17, so the failure worth pinning
    has flipped: a regression to `true` would quietly `noindex` a page that is now
    the site's highest-intent entry point, and label genuine rates as invented.

    The notice itself is still asserted, because the flag has to stay usable — it
    is the lever to pull if the rates ever go stale.
  */
  it("does not label real rates as placeholders", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      expect(pricing.isPlaceholder).toBe(false);
      expect(pricing.placeholderNotice).toBeTypeOf("string");
      expect(pricing.placeholderNotice.trim()).not.toBe("");
    }
  });

  /*
    Replaces "carries no digit that could be read as a real rate". Every row in the
    table is now one of the business's own four categories and every one of them
    has an amount, so a row without a digit is a row that lost its rate — and the
    em-dash placeholder reappearing means one went live empty, which the flag no
    longer covers for.
  */
  it("puts an amount on every row", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      expect(pricing.rows.length).toBe(4);
      for (const row of pricing.rows) {
        expect(
          row.price,
          `${code}/${row.key} is still a placeholder`
        ).not.toMatch(/—{2,}/);
        expect(row.price, `${code}/${row.key} has no amount`).toMatch(/\d/);
      }
    }
  });

  /*
    The line that replaces the placeholder notice as the page's permanent
    qualifier. It is bundled rather than CMS-driven precisely so it cannot be
    cleared, so a missing value here means somebody deleted it in code.
  */
  it("says the rates are not a binding offer, in every locale", () => {
    for (const code of LOCALE_CODES) {
      const { pricing } = fromLocales(code);
      expect(pricing.notAnOffer).toBeTypeOf("string");
      expect(pricing.notAnOffer.trim()).not.toBe("");
    }
  });

  /*
    The amounts exist twice — as the display string a visitor reads, and as the
    numbers root.jsx puts in the Offer node. This is the assertion that makes the
    duplication safe: raise a rate in the table and forget the JSON-LD, and the
    search result keeps quoting the old number until this fails.
  */
  describe("the numbers behind the structured data", () => {
    it("names only rows that exist", () => {
      const keys = new Set(PRICING.rows.map((row) => row.key));
      for (const key of Object.keys(RATE_NUMBERS)) {
        expect(keys.has(key), `RATE_NUMBERS.${key} has no row`).toBe(true);
      }
    });

    it("agrees with the rate printed in the table", () => {
      for (const [key, { min, max }] of Object.entries(RATE_NUMBERS)) {
        const row = PRICING.rows.find((r) => r.key === key);
        for (const code of LOCALE_CODES) {
          const printed = row.price[code];
          expect(printed, `${code}/${key} is missing ${min}`).toContain(
            String(min)
          );
          expect(printed, `${code}/${key} is missing ${max}`).toContain(
            String(max)
          );
        }
      }
    });

    it("gives a number to every row that shows one, and no others", () => {
      for (const row of PRICING.rows) {
        const showsAmount = /\d/.test(row.price.pl);
        expect(
          Object.hasOwn(RATE_NUMBERS, row.key),
          `${row.key} prints "${row.price.pl}" but ${showsAmount ? "has no" : "has a"} number for the Offer node`
        ).toBe(showsAmount);
      }
    });
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
