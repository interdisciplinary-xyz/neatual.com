import { execFileSync } from "node:child_process";

import { describe, it, expect } from "vitest";

import { OG_CARD_LINES } from "../app/lib/inlineCopy.js";

/**
 * Neatual used to make uniforms. Everything user-facing was rewritten for the
 * wallpaper business in v0.1.0 — titles, headings, body copy, alt text, meta
 * descriptions, in all three locales — and `.claude/CLAUDE.md` has carried a
 * standing warning ever since that any copy mentioning uniforms or 25 years is
 * stale.
 *
 * The 17 August audit grepped for it and reported zero matches, and proposed
 * retiring the warning as having done its job. It had searched `app/` and
 * `sanity/`. The Open Graph card is drawn by a script in `scripts/`, and it had
 * been rendering "Produkcja i dystrybucja uniformów / od ponad 25 lat" into
 * public/og-image.jpg on every deploy the whole time — so every share of the
 * site on every platform advertised a business Neatual is not in, for months,
 * while the page behind the link said wallpaper.
 *
 * A warning in a markdown file is not a guard, and a grep run once by hand is
 * not either. This is the guard. It searches everywhere a sentence can hide,
 * not just where sentences are expected.
 */

/**
 * Only what ships. `docs/` records what was observed and correcting an audit
 * would falsify it; `.claude/` is agent tooling that names the old business in
 * order to forbid it, and one vendored skill mentions "uniform lists" about
 * Flutter. None of those reaches a visitor.
 */
const SHIPPED = [
  "app",
  "scripts",
  "sanity",
  "public",
  "server.js",
  "README.md",
];

/**
 * The two files that explain the fix, and so necessarily quote what was wrong.
 * Kept as an explicit list rather than a pattern: a broad exemption here is how
 * a guard quietly stops guarding.
 */
const ALLOWED = [
  "app/lib/inlineCopy.js", // the comment on OG_CARD_LINES
  "scripts/generate-og-image.mjs", // the comment on why the copy moved out
];

/**
 * git grep rather than a filesystem walk: it respects .gitignore for free, so
 * node_modules and build output cannot produce a false positive, and it only
 * ever sees files that are actually committed.
 */
function search(pattern) {
  let out = "";
  try {
    out = execFileSync("git", ["grep", "-rniI", pattern, "--", ...SHIPPED], {
      encoding: "utf8",
    });
  } catch (error) {
    // git grep exits 1 with no output when there are no matches.
    if (error.status === 1 && !error.stdout) return [];
    throw error;
  }
  return out
    .split("\n")
    .filter(Boolean)
    .filter(
      (line) => !ALLOWED.some((allowed) => line.startsWith(`${allowed}:`))
    );
}

describe("the previous business does not appear in anything that ships", () => {
  it.each([
    ["uniforms", "uniform"],
    ["the 25-year claim (Polish)", "25 lat"],
    ["the 25-year claim (English)", "25 years"],
  ])("no reference to %s", (_label, pattern) => {
    const hits = search(pattern);
    expect(hits, `\n${hits.join("\n")}\n`).toEqual([]);
  });
});

describe("the Open Graph card", () => {
  it("says what the company actually does", () => {
    expect(OG_CARD_LINES.join(" ")).toMatch(/tapet/i);
  });

  it("makes no claim about how long it has been trading", () => {
    // The owner gave three facts and a duration was not one of them.
    expect(OG_CARD_LINES.join(" ")).not.toMatch(/\d+\s*(lat|years)/i);
  });

  it("fits the card — two short lines beside a 150px logo at 1200px wide", () => {
    expect(OG_CARD_LINES).toHaveLength(2);
    for (const line of OG_CARD_LINES)
      expect(line.length).toBeLessThanOrEqual(40);
  });
});
