import { describe, it, expect } from "vitest";
import { missingA11yLabels, fromLocales } from "../app/lib/content.server.js";
import { DEFAULT_LOCALE, LOCALE_CODES } from "../app/lib/seo.js";

// Copilot's finding on PR #2: getContent() treated a response as complete as
// long as pages, settings and products existed, while the nested a11y labels
// are optional in the Sanity schema. Deleting one produced no error and no
// visible change — just an icon-only button with no accessible name, or an
// empty alt on a content image.
describe("missingA11yLabels", () => {
  const complete = fromLocales(DEFAULT_LOCALE).settings;

  it("passes the bundled copy in every locale", () => {
    for (const locale of LOCALE_CODES) {
      expect(
        missingA11yLabels(fromLocales(locale).settings),
        `bundled copy incomplete for ${locale}`
      ).toEqual([]);
    }
  });

  it("names a deleted label", () => {
    const settings = {
      ...complete,
      a11y: { ...complete.a11y, close: undefined },
    };
    expect(missingA11yLabels(settings)).toEqual(["close"]);
  });

  it("treats an untranslated label as missing", () => {
    // localized() returns "" when the requested locale has no value, which is
    // exactly the case that renders an empty accessible name.
    const settings = {
      ...complete,
      a11y: { ...complete.a11y, photoAlt: "  " },
    };
    expect(missingA11yLabels(settings)).toEqual(["photoAlt"]);
  });

  it("reports every missing key, not just the first", () => {
    const settings = { ...complete, a11y: { close: complete.a11y.close } };
    const missing = missingA11yLabels(settings);
    expect(missing).not.toContain("close");
    expect(missing.length).toBeGreaterThan(1);
  });

  it("treats an absent a11y object as fully missing", () => {
    expect(missingA11yLabels({}).sort()).toEqual(
      Object.keys(complete.a11y).sort()
    );
    expect(missingA11yLabels(undefined).length).toBeGreaterThan(0);
  });
});
