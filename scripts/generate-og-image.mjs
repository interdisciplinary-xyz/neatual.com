// Renders public/og-image.jpg, the Open Graph / Twitter card.
//
// The site had no og:image at all, so every share of it — the whole
// social-referral surface for a B2B manufacturer — rendered as a bare text
// card. See §1.1 of docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md.
//
// Built from the same logo geometry as app/components/icons/LogoIcon.jsx on
// the brand background from tailwind.config.js. Run: pnpm og:generate

import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "og-image.jpg");

const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = "#EDEDED";

// Verbatim from LogoIcon.jsx (44x55 viewBox).
const LOGO_PATHS = [
  "M0 11.105v43.307h3.378V15.18a3.404 3.404 0 00-1.041-2.457A8.857 8.857 0 000 11.105z",
  "M0 5.578V9.22c.51.178 1.415.653 2.261 1.207.709.46 1.496 1.28 2.102 2.062.97 1.246.705 4.767.705 4.767v37.156h3.38V16.999c0-5.25-1.374-6.782-3.051-8.502C3.72 6.777 0 5.577 0 5.577z",
  "M0 .025v3.657c1.526.314 4.515 1.583 6.498 3.343.853.753 2.427 2.044 3.177 4.254.568 1.69.461 3.601.461 3.967v39.168h3.377V40.103h.003V16.592c0-3.465.488-6.77-3.38-11.051C6.268 1.261 0 .025 0 .025zM15.225 13.474v40.938h.144c7.406-.04 13.394-6.047 13.394-13.449V.025h-.145C21.216.062 15.225 6.07 15.225 13.474zM44 13.449v40.938h-.144c-7.406-.041-13.394-6.048-13.394-13.45V0h.144C38.01.037 44 6.044 44 13.449z",
];

const LOGO_SCALE = 3.4; // 44x55 -> ~150x187
const logoW = 44 * LOGO_SCALE;
const logoH = 55 * LOGO_SCALE;
const logoX = 110;
const logoY = (HEIGHT - logoH) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>
  <g transform="translate(${logoX} ${logoY}) scale(${LOGO_SCALE})">
    ${LOGO_PATHS.map((d) => `<path d="${d}" fill="#000"/>`).join("\n    ")}
  </g>
  <text x="${logoX + logoW + 90}" y="${HEIGHT / 2 - 26}"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="72" font-weight="500" fill="#000">neatual.com</text>
  <text x="${logoX + logoW + 90}" y="${HEIGHT / 2 + 34}"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="32" fill="#393939">Produkcja i dystrybucja uniformów</text>
  <text x="${logoX + logoW + 90}" y="${HEIGHT / 2 + 80}"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="32" fill="#393939">od ponad 25 lat</text>
</svg>`;

const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
await writeFile(OUT, buf);
console.log(
  `${path.relative(ROOT, OUT)} — ${WIDTH}x${HEIGHT}, ${(buf.length / 1024).toFixed(1)} KB`
);
