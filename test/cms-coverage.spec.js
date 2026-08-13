import { describe, it, expect } from "vitest";
import { buildDocuments } from "../scripts/seed-documents.mjs";
import { fromSanity, fromLocales } from "../app/lib/content.server";
import { LOCALE_CODES } from "../app/lib/seo";

/*
  Proves that every word the site renders can be changed in the Studio.

  The method is a substitution: take the documents the seeder writes, replace
  every localized string in them with a sentinel, resolve the result through the
  real `fromSanity`, and look at what came out. Anything still showing the
  bundled wording is a string an editor cannot reach — it renders from
  app/lib/inlineCopy.js no matter what the CMS says, and the only way to change
  it is a deploy.

  Checking the schema files instead would prove a field *exists* in the Studio,
  not that the site reads it. Two of the gaps this found — the service page
  headings and the price table's column headings — had exactly that shape: a
  perfectly good bundled constant that no CMS field was ever wired to.
*/

const SENTINEL = "cms-value";

/**
 * Replaces every leaf string with a sentinel, leaving structure intact.
 *
 * Skips `_id`, `_type` and `_key`: they address the document rather than
 * appearing on the page, and rewriting them produces a response Sanity could
 * never return. `pricingIsPlaceholder` is a boolean and is left alone — it
 * drives the noindex, and flipping it here would test something else.
 */
function sentinelise(value, key = "") {
  if (typeof value === "string") {
    return /^(_id|_type|_key|pageKey|slug|imageBase|pricingKey|key)$/.test(key)
      ? value
      : `${SENTINEL}:${key}`;
  }
  if (Array.isArray(value)) return value.map((item) => sentinelise(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sentinelise(v, k)])
    );
  }
  return value;
}

/** The seeded documents, in the shape CONTENT_QUERY returns them. */
function asQueryResult(documents) {
  return {
    pages: documents.filter((doc) => doc._type === "page"),
    products: documents.filter((doc) => doc._type === "product"),
    services: documents.filter((doc) => doc._type === "service"),
    settings: documents.find((doc) => doc._type === "siteSettings"),
  };
}

/** Every leaf string in a payload, as `path → value`. */
function flatten(value, path = "", out = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${path}${path && "."}${i}`, out));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      flatten(item, `${path}${path && "."}${key}`, out);
    }
  } else if (typeof value === "string") {
    out.set(path, value);
  }
  return out;
}

/**
 * Values that are correctly NOT editable, each for a stated reason.
 *
 * This list is the point of the test as much as the assertion is: every entry
 * is a deliberate decision, and anything arriving here without one is a bug.
 */
const NOT_EDITABLE = [
  {
    pattern: /(^|\.)(_type|_key)$/,
    why: "Sanity's own structural keys on Portable Text blocks and array items. They describe the shape of the document, not its words, and are excluded from the substitution above because rewriting them would produce a response Sanity could never return.",
  },
  {
    pattern: /^pricing\.placeholderNotice$/,
    why: "The notice that says the rates are not real. A field whose entire job is to declare the numbers fabricated must not be clearable from the Studio, or a live page shows invented prices with nothing marking them as invented. See pricingFrom() in content.server.js.",
  },
  {
    pattern: /^(source|locale)$/,
    why: "Which resolver answered, and for which locale. Diagnostics, not copy.",
  },
  {
    pattern: /^products\.\d+\.imageBase$/,
    why: "A folder name under public/gallery. Editable in the Studio, but it addresses a file rather than being rendered, so a sentinel is not expected to survive as text.",
  },
  {
    pattern: /^(products|services)\.\d+\.slug$/,
    why: "The reference id other documents point at. Editable, but deliberately excluded from the substitution above so the cross-links still resolve.",
  },
  {
    pattern: /^services\.\d+\.pricingKey$/,
    why: "Names a row in the price table. An identifier, not copy.",
  },
  {
    pattern: /^pricing\.rows\.\d+\.key$/,
    why: "Row identifier, used to match a row to its service page.",
  },
  {
    pattern: /^pages\.\w+\.pageKey$/,
    why: "Which of the five pages this is. Structural.",
  },
];

const exemption = (path) =>
  NOT_EDITABLE.find((entry) => entry.pattern.test(path));

describe("everything on the page is editable in Sanity", () => {
  for (const locale of LOCALE_CODES) {
    it(`has no bundled string surviving a full CMS override (${locale})`, () => {
      const documents = buildDocuments();
      const overridden = fromSanity(
        asQueryResult(sentinelise(documents)),
        locale
      );

      const stuck = [];
      for (const [path, value] of flatten(overridden)) {
        if (value.startsWith(SENTINEL)) continue;
        if (exemption(path)) continue;
        stuck.push(`${path} = ${JSON.stringify(value)}`);
      }

      expect(
        stuck,
        "These render from app/lib and ignore the CMS. Either wire them to a " +
          "schema field, or add them to NOT_EDITABLE with a reason."
      ).toEqual([]);
    });
  }

  /*
    The other half: the seeded documents have to actually carry the bundled copy,
    or the seed would write an incomplete dataset and the fallback would be the
    only place the real words exist. Resolving the *unmodified* seed output has
    to reproduce the bundled payload exactly.
  */
  for (const locale of LOCALE_CODES) {
    it(`seeds every field the fallback renders (${locale})`, () => {
      const seeded = fromSanity(asQueryResult(buildDocuments()), locale);
      const bundled = fromLocales(locale);

      const differing = [];
      for (const [path, value] of flatten(bundled)) {
        if (path === "source") continue;
        const other = flatten(seeded).get(path);
        if (other !== value) {
          differing.push(
            `${path}\n    seeded  : ${JSON.stringify(other)}\n    bundled : ${JSON.stringify(value)}`
          );
        }
      }

      expect(
        differing,
        "The seeder and the fallback disagree, so the page would render " +
          "different words depending on whether Sanity answered."
      ).toEqual([]);
    });
  }
});
