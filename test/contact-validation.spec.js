import { describe, it, expect } from "vitest";

import {
  singleLine,
  phoneShape,
  emailShape,
} from "../sanity/lib/contactValidation.js";
import { siteSettings } from "../sanity/schemas/siteSettings.js";
import { LOCALES } from "../app/lib/locales.js";

/**
 * kontakt.jsx builds `tel:` and `mailto:` hrefs by concatenating two CMS
 * fields. These rules are what stops a value that cannot survive that.
 *
 * The seeded-value cases are the point of the file: a validator that rejects
 * the content already in production is not a safety net, it is an outage, and
 * "existing content still passes" is a claim worth measuring rather than
 * asserting.
 */

/** Every phone/email pair in the bundled fallback — the values actually shipped. */
const seeded = Object.values(LOCALES).map((config) => config.contact);

describe("singleLine", () => {
  it("accepts an ordinary single-line value", () => {
    expect(singleLine("+ 48 739 903 148")).toBe(true);
  });

  it.each([
    ["newline", "+48 739\n903 148"],
    ["carriage return", "+48 739\r903 148"],
    ["tab", "+48\t739 903 148"],
    ["leading space", " +48 739 903 148"],
    ["trailing space", "+48 739 903 148 "],
  ])("rejects a %s", (_label, value) => {
    expect(singleLine(value)).toMatch(/single line|leading or trailing/);
  });

  it("defers the empty case to required()", () => {
    expect(singleLine(undefined)).toBe(true);
  });
});

describe("phoneShape", () => {
  it("accepts every phone number in the bundled fallback", () => {
    for (const settings of seeded) {
      expect(phoneShape(settings.phone), settings.phone).toBe(true);
    }
  });

  it.each([
    "+ 48 739 903 148", // the seeded form, space after the +
    "+48 739 903 148",
    "48 739 903 148",
    "739903148",
  ])("accepts %s", (value) => {
    expect(phoneShape(value)).toBe(true);
  });

  it.each([
    ["letters", "+48 CALL NOW"],
    ["a second plus", "+48+739903148"],
    ["parentheses", "+48 (739) 903 148"],
    ["a dash", "+48-739-903-148"],
    ["too few digits", "+48 12"],
    ["a newline", "+48 739\n903 148"],
    ["a trailing space", "+48 739 903 148 "],
  ])("rejects %s", (_label, value) => {
    expect(phoneShape(value)).toEqual(expect.any(String));
  });

  it("still accepts a number once its spaces are stripped, the way kontakt.jsx does", () => {
    const [{ phone }] = seeded;
    expect(phone.replace(/\s/g, "")).toMatch(/^\+?\d+$/);
  });
});

describe("emailShape", () => {
  it("accepts every email address in the bundled fallback", () => {
    for (const settings of seeded) {
      expect(emailShape(settings.email), settings.email).toBe(true);
    }
  });

  it.each(["info@neatual.com", "biuro+tapety@neatual.com.pl", "a.b@c.co"])(
    "accepts %s",
    (value) => {
      expect(emailShape(value)).toBe(true);
    }
  );

  it.each([
    ["a display name", "Neatual <info@neatual.com>"],
    ["a smuggled subject", "info@neatual.com?subject=hello"],
    ["a smuggled parameter", "info@neatual.com&cc=x@y.com"],
    ["a second address", "info@neatual.com, biuro@neatual.com"],
    ["no @", "info.neatual.com"],
    ["no TLD", "info@neatual"],
    ["a newline", "info@neatual.com\n"],
    ["a trailing space", "info@neatual.com "],
  ])("rejects %s", (_label, value) => {
    expect(emailShape(value)).toEqual(expect.any(String));
  });
});

describe("siteSettings schema wiring", () => {
  /**
   * Sanity's Rule builder, reduced to the two methods these fields use. The
   * real one needs @sanity/schema, which is a transitive dependency of `sanity`
   * rather than a direct one — importing it resolves locally and fails in CI
   * under pnpm's strict layout. What this checks is the wiring: that each field
   * is required and carries the predicate the tests above exercise.
   */
  const fakeRule = () => {
    const calls = { required: false, custom: [] };
    const rule = {
      required() {
        calls.required = true;
        return rule;
      },
      custom(fn) {
        calls.custom.push(fn);
        return rule;
      },
    };
    return [rule, calls];
  };

  const field = (name) => siteSettings.fields.find((f) => f.name === name);

  it.each([
    ["phone", phoneShape],
    ["email", emailShape],
  ])("%s is required and validated by its predicate", (name, predicate) => {
    const [rule, calls] = fakeRule();
    field(name).validation(rule);
    expect(calls.required).toBe(true);
    expect(calls.custom).toContain(predicate);
  });
});
