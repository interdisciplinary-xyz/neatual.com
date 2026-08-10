import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { IMAGE_WIDTHS, imageSources } from "../app/lib/images";

// Pins §2.1: the gallery served 4000x6000 masters, 1.3-2.2 MB each, into
// 400x400 / 600x600 / 80x80 slots — 9.57 MiB on /galeria with a 44.1 s LCP.
describe("imageSources", () => {
  const base = "/gallery/produkt-1/produkt-1-1";
  const { webpSrcSet, fallbackSrc } = imageSources(base);

  it("offers one WebP candidate per width, with w descriptors", () => {
    const candidates = webpSrcSet.split(", ");
    expect(candidates).toHaveLength(IMAGE_WIDTHS.length);

    candidates.forEach((candidate, i) => {
      const [url, descriptor] = candidate.split(" ");
      expect(url).toBe(`${base}-${IMAGE_WIDTHS[i]}.webp`);
      expect(descriptor).toBe(`${IMAGE_WIDTHS[i]}w`);
    });
  });

  it("lists widths in ascending order", () => {
    expect(IMAGE_WIDTHS).toEqual([...IMAGE_WIDTHS].sort((a, b) => a - b));
  });

  it("falls back to a JPEG, never to a master", () => {
    expect(fallbackSrc).toMatch(/-\d+\.jpg$/);
    expect(fallbackSrc).not.toContain("gallery-originals");
  });

  // The ladder is declared twice — once for the browser, once for the
  // generator. If they drift, the markup points at files that were never
  // produced and the browser silently falls back to the JPEG floor.
  it("stays in sync with the generator script", () => {
    const script = readFileSync(
      path.resolve(process.cwd(), "scripts/generate-gallery-images.mjs"),
      "utf8"
    );
    const declared = script.match(/export const WIDTHS = \[([^\]]+)\]/);
    expect(declared, "WIDTHS not found in the generator").toBeTruthy();

    const generatorWidths = declared[1]
      .split(",")
      .map((n) => Number(n.trim()))
      .filter(Number.isFinite);

    expect(generatorWidths).toEqual(IMAGE_WIDTHS);
  });
});
