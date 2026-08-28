/**
 * Validators for the two siteSettings fields that get concatenated straight
 * into a URL — `phone` becomes a `tel:` and `email` a `mailto:` in
 * app/routes/kontakt.jsx.
 *
 * ## Why they live here and not inline in the schema
 *
 * Written as plain predicates rather than as `Rule.regex(...).email(...)`
 * chains so they can be run by the test suite. A validation rule expressed only
 * through Sanity's builder can be exercised only by booting Sanity's validation
 * runtime, which needs `@sanity/schema` — a transitive dependency of `sanity`,
 * not a direct one, so importing it would resolve locally and fail in CI under
 * pnpm's strict node_modules layout. A rule nothing can run is a rule nobody
 * knows is wrong.
 *
 * ## Why they reject rather than repair
 *
 * Sanity validators cannot rewrite the value being validated. A predicate that
 * trimmed its input would report "valid" and leave the untrimmed original in
 * the document — correct-looking in the Studio and still broken on the page.
 * Each returns `true`, or the sentence an editor sees under the field.
 */

/** Enough digits to be dialable. Polish mobiles are 9, plus a country code. */
const MIN_PHONE_DIGITS = 7;

/**
 * Whitespace a single-line Studio input cannot produce but an API write can.
 * The Studio is not the only writer: scripts/seed-sanity.mjs, `pnpm
 * content:push` and the HTTP API all reach this document, and none of them is
 * a text box.
 */
export function singleLine(value) {
  if (typeof value !== "string") return true; // required() owns the empty case
  if (/[\r\n\t]/.test(value)) return "Must be a single line.";
  if (value !== value.trim()) return "Remove the leading or trailing spaces.";
  return true;
}

/**
 * Deliberately permissive about grouping. The stored value is
 * "+ 48 739 903 148", with a space after the +, and reformatting a real
 * business's phone number is not this field's job — kontakt.jsx strips the
 * spaces before building the `tel:`. What this refuses is anything that is not
 * a phone number at all: letters, a second +, or punctuation that would end up
 * in the URL.
 */
export function phoneShape(value) {
  const line = singleLine(value);
  if (line !== true) return line;
  if (typeof value !== "string") return true;
  if (!/^\+?[\d ]+$/.test(value)) {
    return "Digits, spaces and one leading + only.";
  }
  if (value.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
    return "Too few digits to be a dialable number.";
  }
  return true;
}

/**
 * One plain address. The two shapes that matter are the two that produce a
 * `mailto:` which looks fine and is not: "Neatual <info@…>", whose angle
 * brackets are not a display name once concatenated into an href, and
 * "info@…?subject=x", which smuggles a query string into the address half of
 * the URL.
 *
 * Not an RFC 5322 implementation, and not trying to be — the full grammar
 * admits addresses no business would use and rejecting a valid exotic address
 * is a worse failure here than accepting one.
 */
export function emailShape(value) {
  const line = singleLine(value);
  if (line !== true) return line;
  if (typeof value !== "string") return true;
  if (/[<>]/.test(value))
    return "Just the address — no name in angle brackets.";
  if (/[?&]/.test(value))
    return "Just the address — no ?subject= or other parameters.";
  if (!/^[^\s@,;:"]+@[^\s@,;:"]+\.[a-z]{2,}$/i.test(value)) {
    return "Does not look like an email address.";
  }
  return true;
}
