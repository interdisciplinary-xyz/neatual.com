/** Collapses the indentation of the template literals in locales.js. */
export const tidy = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

/**
 * Converts the `<br><br>`-separated HTML copy in locales.js into Portable Text.
 *
 * Shared by two callers that must agree exactly: scripts/seed-sanity.mjs, which
 * writes this shape into Sanity, and the fallback path in content.server.js,
 * which produces it from locales.js when Sanity is unreachable. If they drifted,
 * the page would render differently depending on which source answered.
 */
export function htmlToBlocks(html, keyPrefix) {
  return tidy(html)
    .split(/(?:<br\s*\/?>\s*){2,}/)
    .map((paragraph) => tidy(paragraph.replace(/<[^>]+>/g, " ")))
    .filter(Boolean)
    .map((text, index) => ({
      _type: "block",
      _key: `${keyPrefix}-${index}`,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `${keyPrefix}-${index}-0`, text, marks: [] }],
    }));
}
