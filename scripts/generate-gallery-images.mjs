// Generates the responsive gallery derivatives that ship in public/gallery/
// from the masters in art/gallery-originals/.
//
// Why this exists: the masters are 3456x5184 to 4000x6000 JPEGs, 1.3-2.2 MB
// each, and they were being served byte-for-byte into 400x400, 600x600 and
// 80x80 slots — 9.57 MiB on /galeria alone, with Lighthouse reporting 9,554
// KiB of "properly size images" savings. See
// docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md §2.1.
//
// The derivatives are square because every slot that renders them is square
// with `object-fit: cover` (the CSS default object-position is center, which
// is what sharp's `position: 'center'` matches), so cropping here produces
// pixel-identical output to cropping in the browser — at a fraction of the
// bytes.
//
// Run: pnpm images:generate

import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT, "art", "gallery-originals");
const OUT_DIR = path.join(ROOT, "public", "gallery");

// Rendered slots are 80px (photo strip), 112-289px (grid tile) and 600px
// (desktop detail). Doubled for 2x displays, that tops out around 1200.
//
// 300 exists for one specific case that turned out to be the common one: the
// gallery tile on a phone. At the 412x823 / DPR 1.75 viewport the performance
// budget measures, `calc(50vw - 37px)` is 169 CSS px, so the browser needs
// 295 device px — and with candidates at 200 and 400 it has to take the 400,
// which is 1.8x the pixels it will draw. That is both the `uses-responsive-
// images` finding and, because the first tile is the LCP element on /galeria,
// a direct cost to the metric the budget is built around. A 300 candidate is
// the smallest one that still covers 295 without upscaling.
export const WIDTHS = [200, 300, 400, 800, 1200];

// The `src` fallback for browsers without WebP. One size only — it is never
// chosen when srcset is understood, so it exists purely as a floor.
const FALLBACK_WIDTH = 800;

async function listJpegs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listJpegs(full)));
    else if (/\.jpe?g$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`No masters at ${path.relative(ROOT, SRC_DIR)}`);
    process.exit(1);
  }

  const sources = (await listJpegs(SRC_DIR)).sort();
  if (sources.length === 0) {
    console.error(`No JPEGs found under ${path.relative(ROOT, SRC_DIR)}`);
    process.exit(1);
  }

  let srcBytes = 0;
  let outBytes = 0;
  let written = 0;

  for (const src of sources) {
    srcBytes += (await stat(src)).size;

    const rel = path.relative(SRC_DIR, src);
    const outSubdir = path.join(OUT_DIR, path.dirname(rel));
    await mkdir(outSubdir, { recursive: true });

    const base = path.basename(rel, path.extname(rel));

    for (const width of WIDTHS) {
      const buf = await sharp(src)
        .resize(width, width, { fit: "cover", position: "center" })
        .webp({ quality: 78 })
        .toBuffer();
      const dest = path.join(outSubdir, `${base}-${width}.webp`);
      await writeFile(dest, buf);
      outBytes += buf.length;
      written += 1;
    }

    const fallback = await sharp(src)
      .resize(FALLBACK_WIDTH, FALLBACK_WIDTH, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();
    await writeFile(
      path.join(outSubdir, `${base}-${FALLBACK_WIDTH}.jpg`),
      fallback
    );
    outBytes += fallback.length;
    written += 1;
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(2);
  console.log(
    `${sources.length} masters (${mb(srcBytes)} MB) -> ${written} derivatives (${mb(outBytes)} MB)`
  );
}

await main();
