import { describe, it, expect } from "vitest";
import { fromLocales } from "../app/lib/content.server";
import { LOCALE_CODES, DEFAULT_LOCALE } from "../app/lib/seo";

/*
  Translation completeness, checked against the resolved payload rather than the
  constants behind it.

  Walking `fromLocales(locale)` for all three languages in parallel is what makes
  this hold as the site grows: a field added to inlineCopy.js, locales.js or the
  CMS shape is covered the moment it reaches a page, with nothing to remember to
  add here. Checking the constants instead would test the source of one of three
  spellings of the same content.

  The failure this exists for is the one the copy rules call the worst kind: a
  field translated in one locale and not the others. `localized()` silently
  returns Polish for a missing translation, so the German page renders, looks
  finished, and is wrong — there is no error and no empty space to notice.
*/

const PAYLOADS = Object.fromEntries(
  LOCALE_CODES.map((code) => [code, fromLocales(code)])
);

/**
 * Paths whose value is legitimately the same in all three languages.
 *
 * Each is a thing rather than a piece of prose: a name, an address, a URL, an
 * identifier, a unit of measurement. Anything not listed here that reads
 * identically in Polish, English and German is untranslated until proven
 * otherwise — which is the right default, because that is what an untranslated
 * field looks like.
 */
const SAME_IN_EVERY_LANGUAGE = [
  /^source$/,
  /^settings\.(wordmark|brandName|phone|email|addressLine)$/,
  /^settings\.address\./,
  // URLs. Localised addresses are asserted separately in seo.spec.js; here they
  // would only report the parts that are shared by design (/en, /de prefixes).
  /^paths\./,
  /^pages\.[a-z]+\.(path|pageKey)$/,
  // Identifiers and filesystem names, not copy.
  /^(products|services)\.\d+\.(slug|imageBase|pricingKey)$/,
  /^services\.\d+\.categories\./,
  /^pricing\.rows\.\d+\.key$/,
  // "m²" is a unit; it is the same symbol in all three languages.
  /^pricing\.rows\.\d+\.unit$/,
  // The full `{pl, en, de}` slug map, carried unresolved on every payload so
  // hreflang can ask for a locale other than the one being rendered. It is the
  // same object in all three by construction — the *addresses* it holds are
  // asserted to differ in seo.spec.js.
  /\.slugs\./,
  // Portable Text structure: block types, styles and mark arrays are the schema
  // the body is stored in, not words anybody translates.
  /(^|\.)(_type|_key|style|marks|markDefs|listItem|level)$/,
];

const isShared = (path) => SAME_IN_EVERY_LANGUAGE.some((re) => re.test(path));

/**
 * Polish proper nouns that stay Polish in English and German.
 *
 * The company's street, town and region are not translated — a German visitor
 * still posts a letter to Żelków-Kolonia — so their diacritics are correct
 * wherever they appear. Removed from the string before it is checked, rather
 * than skipping the whole field, so a Polish *sentence* wrapped around the
 * address is still caught.
 */
const POLISH_PROPER_NOUNS =
  /Żelków-Kolonia|Siedlec\w*|Siedlc\w*|Siedleck\w*|Polsk\w*/g;

/** Every leaf in one payload, as `path → value`, arrays keyed by index. */
function flatten(value, path = "", out = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${path}${path && "."}${i}`, out));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      flatten(item, `${path}${path && "."}${key}`, out);
    }
  } else {
    out.set(path, value);
  }
  return out;
}

const FLAT = Object.fromEntries(
  LOCALE_CODES.map((code) => [code, flatten(PAYLOADS[code])])
);

describe("every locale is complete", () => {
  // `locale` is the payload's own name for itself, so it differs by definition
  // and would otherwise be reported as a structural difference.
  const paths = [...FLAT[DEFAULT_LOCALE].keys()].filter((p) => p !== "locale");

  it("renders the same set of fields in all three languages", () => {
    for (const code of LOCALE_CODES) {
      const missing = paths.filter((path) => !FLAT[code].has(path));
      const extra = [...FLAT[code].keys()].filter(
        (path) => path !== "locale" && !FLAT[DEFAULT_LOCALE].has(path)
      );
      expect(missing, `${code} is missing fields`).toEqual([]);
      expect(extra, `${code} has fields Polish does not`).toEqual([]);
    }
  });

  it("has no empty or whitespace-only string anywhere", () => {
    const empty = [];
    for (const code of LOCALE_CODES) {
      for (const [path, value] of FLAT[code]) {
        if (typeof value === "string" && value.trim() === "") {
          empty.push(`${code}: ${path}`);
        }
      }
    }
    expect(empty).toEqual([]);
  });

  it("has no null where another language has text", () => {
    const holes = [];
    for (const path of paths) {
      const values = LOCALE_CODES.map((code) => FLAT[code].get(path));
      const anyText = values.some((v) => typeof v === "string" && v.trim());
      const anyBlank = values.some((v) => v === null || v === undefined);
      if (anyText && anyBlank) holes.push(path);
    }
    expect(holes).toEqual([]);
  });
});

describe("nothing is left untranslated", () => {
  /*
    The core assertion: a string that is byte-identical in Polish, English and
    German is a string somebody wrote once, unless it is on the list above.

    Reported as a list rather than one failure at a time so a translation pass
    can see everything it has to fix in one run.
  */
  it("has no prose that is identical in all three languages", () => {
    const untranslated = [];
    for (const path of [...FLAT[DEFAULT_LOCALE].keys()]) {
      if (isShared(path)) continue;
      const values = LOCALE_CODES.map((code) => FLAT[code].get(path));
      if (typeof values[0] !== "string") continue;
      if (values.every((value) => value === values[0])) {
        untranslated.push(`${path} = ${JSON.stringify(values[0])}`);
      }
    }
    expect(untranslated).toEqual([]);
  });

  /*
    Polish-only characters in an English or German string. A weaker signal than
    the check above — it cannot see a Polish sentence that happens to use no
    diacritics — but it catches the common half-finished case, where a field was
    copied across and partly reworded.

    German is checked for the Polish-specific set only: ó is Polish and also
    appears in no German word this site uses, but ä/ö/ü/ß are German and must
    not be flagged.
  */
  it("has no Polish diacritics in the English or German copy", () => {
    const POLISH_ONLY = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/;
    const leaked = [];
    for (const code of ["en", "de"]) {
      for (const [path, value] of FLAT[code]) {
        if (isShared(path) || typeof value !== "string") continue;
        if (POLISH_ONLY.test(value.replace(POLISH_PROPER_NOUNS, ""))) {
          leaked.push(`${code}: ${path} = ${JSON.stringify(value)}`);
        }
      }
    }
    expect(leaked).toEqual([]);
  });
});
