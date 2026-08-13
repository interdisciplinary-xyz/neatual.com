/**
 * Downloads the site's webfonts from Google Fonts into public/fonts, and writes
 * the @font-face rules that point at them.
 *
 *   pnpm fonts:fetch
 *
 * ## Why the fonts are self-hosted
 *
 * The stylesheet at fonts.googleapis.com was a render-blocking request on every
 * page: Lighthouse measured it at 865 ms, against 308 ms for the site's own CSS.
 * Nothing paints until it resolves, and on /galeria the LCP element is the first
 * gallery photograph, which cannot start downloading until then either. It cost
 * roughly ten points of performance score and was the only reason the budget in
 * lighthouserc.cjs was ever close.
 *
 * Self-hosting also removes two preconnects, a third-party dependency on the
 * critical path, and the fonts.googleapis.com / fonts.gstatic.com exceptions
 * from the CSP in server.js.
 *
 * ## Why only two subsets
 *
 * Google serves 32 faces across cyrillic, greek, vietnamese, math and symbol
 * ranges. This site is Polish, English and German: `latin` covers English and
 * the German umlauts, `latin-ext` covers ą ć ę ł ń ó ś ź ż. The rest would be
 * bytes nobody on this site can read. The `unicode-range` descriptors are kept
 * exactly as Google wrote them, so a browser still downloads latin-ext only
 * when a page actually contains those characters.
 *
 * Re-run this when a weight is added to tailwind.config.js. The generated CSS
 * is committed, so a build never depends on Google being reachable.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// The same family and weight set the <link> used to request. `logo` is
// Montserrat 500, `sans` is Roboto — see fontFamily in tailwind.config.js.
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@500&family=Roboto:wght@400;700;900&display=swap";

// Asking as a current Chrome is what gets woff2 back rather than ttf.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const WANTED_SUBSETS = new Set(["latin", "latin-ext"]);

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const CSS_OUT = path.join(process.cwd(), "app", "fonts.css");

/** Splits the Google stylesheet into `{ subset, block }` per @font-face. */
function parseFaces(css) {
  const faces = [];
  // Each face is preceded by a `/* subset */` comment naming its range.
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    faces.push({ subset: match[1], block: match[2] });
  }
  return faces;
}

const field = (block, name) =>
  block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]?.trim();

async function main() {
  const res = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Google Fonts returned ${res.status}`);
  const css = await res.text();

  const faces = parseFaces(css).filter((f) => WANTED_SUBSETS.has(f.subset));
  if (faces.length === 0)
    throw new Error("No matching faces — did the CSS format change?");

  await mkdir(FONT_DIR, { recursive: true });

  /*
    Group by source URL before downloading anything.

    Roboto is a variable font, and Google serves one file per subset for every
    weight — the URLs for wght 400, 700 and 900 are byte-identical. Naming the
    local copies after the weight, the obvious thing to do, writes that file
    three times and makes the browser download it three times: measured at
    164 KiB of fonts on /galeria, of which 72 KiB was the same two files
    fetched twice. Google's own stylesheet points all three weights at one URL,
    and this reproduces that.
  */
  const byUrl = new Map();
  for (const { subset, block } of faces) {
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) continue;
    const entry = byUrl.get(url) ?? {
      subset,
      family: field(block, "font-family").replace(/['"]/g, ""),
      style: field(block, "font-style") ?? "normal",
      range: field(block, "unicode-range"),
      weights: [],
    };
    entry.weights.push(field(block, "font-weight"));
    byUrl.set(url, entry);
  }

  const rules = [];
  for (const [url, { subset, family, style, range, weights }] of byUrl) {
    // A file serving more than one weight is a variable font, so the weight
    // does not belong in its name.
    const stem = family.toLowerCase();
    const name =
      weights.length > 1
        ? `${stem}-${subset}.woff2`
        : `${stem}-${weights[0]}-${subset}.woff2`;

    const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
    await writeFile(path.join(FONT_DIR, name), bytes);
    console.log(
      `  ✓ ${name} (${(bytes.length / 1024).toFixed(1)} KiB, weight ${weights.join("/")})`
    );

    // One rule per weight, all pointing at the one file — exactly the shape
    // Google emits. The browser instances the variable font per rule.
    for (const weight of weights) {
      rules.push(
        [
          "@font-face {",
          `  font-family: "${family}";`,
          `  font-style: ${style};`,
          `  font-weight: ${weight};`,
          // Matches the `&display=swap` the <link> carried: text paints in the
          // fallback immediately and is swapped when the webfont arrives,
          // rather than being invisible while it downloads.
          "  font-display: swap;",
          `  src: url("/fonts/${name}") format("woff2");`,
          `  unicode-range: ${range};`,
          "}",
        ].join("\n")
      );
    }
  }

  const header = [
    "/*",
    " * GENERATED by scripts/fetch-fonts.mjs — do not edit by hand.",
    " *",
    " * Self-hosted so the critical path holds no third-party request. See the",
    " * comment at the top of that script for why, and re-run `pnpm fonts:fetch`",
    " * after changing the weights in tailwind.config.js.",
    " */",
    "",
  ].join("\n");

  await writeFile(CSS_OUT, `${header}${rules.join("\n\n")}\n`);
  console.log(`\nWrote ${faces.length} faces to app/fonts.css`);
}

await main();
