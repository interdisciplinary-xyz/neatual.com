import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

/*
  The self-hosted webfonts, and the two mistakes that are invisible on the page.

  Both of these render perfectly. The site looks right, the fonts are correct,
  and the only symptom is bytes on a connection the developer is not using:

  1. The same file committed under several names. Roboto is a variable font and
     Google serves one file per subset for every weight, so naming the local
     copies after the weight — the obvious thing to do, and what the first
     version of scripts/fetch-fonts.mjs did — wrote it three times and made the
     browser download it twice on a single page view. 72 KiB, silently.
  2. A rule pointing at a file that is not there. `font-display: swap` means the
     text stays visible in the fallback, so a 404 on a webfont looks like a
     styling choice rather than a fault.
*/

const FONT_DIR = join(process.cwd(), "public", "fonts");
const CSS = readFileSync(join(process.cwd(), "app", "fonts.css"), "utf8");

const files = readdirSync(FONT_DIR).filter((f) => f.endsWith(".woff2"));
const referenced = [...CSS.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map(
  (m) => m[1]
);

describe("self-hosted fonts", () => {
  it("ships at least one face", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(referenced.length).toBeGreaterThan(0);
  });

  it("has a file on disk for every rule in fonts.css", () => {
    const missing = [...new Set(referenced)].filter(
      (name) => !files.includes(name)
    );
    expect(
      missing,
      "referenced by app/fonts.css but not in public/fonts"
    ).toEqual([]);
  });

  it("has no file on disk that no rule uses", () => {
    const orphans = files.filter((name) => !referenced.includes(name));
    expect(orphans, "in public/fonts but referenced by nothing").toEqual([]);
  });

  it("stores no font twice under different names", () => {
    const byHash = new Map();
    for (const name of files) {
      const hash = createHash("sha256")
        .update(readFileSync(join(FONT_DIR, name)))
        .digest("hex");
      byHash.set(hash, [...(byHash.get(hash) ?? []), name]);
    }
    const duplicated = [...byHash.values()].filter((names) => names.length > 1);
    expect(
      duplicated,
      "identical bytes under several names — the browser downloads each one. " +
        "A variable font serving several weights needs one file and several " +
        "@font-face rules pointing at it, not one file per weight."
    ).toEqual([]);
  });

  it("declares every rule with a swap policy and a unicode range", () => {
    const faces = CSS.split("@font-face").slice(1);
    for (const face of faces) {
      // Without `swap` the text is invisible while the font downloads, which
      // is a worse first paint than the fallback it replaces.
      expect(face).toContain("font-display: swap");
      // Without a range the browser fetches latin-ext for an English page that
      // contains no Polish character at all.
      expect(face).toMatch(/unicode-range:/);
    }
  });

  it("stays small enough to sit on the critical path", () => {
    const total = files.reduce(
      (sum, name) => sum + statSync(join(FONT_DIR, name)).size,
      0
    );
    // Measured 128 KiB across four files. The ceiling is a tripwire for a
    // subset or a weight being added without anybody looking at the cost, not
    // a target — fonts are the largest non-image category on every page here.
    expect(total).toBeLessThan(200 * 1024);
  });
});
