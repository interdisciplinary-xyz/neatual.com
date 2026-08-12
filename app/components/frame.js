/**
 * The horizontal frame of the site, in one place.
 *
 * It used to be written out five times — the header bar, the mobile menu panel,
 * the footer, PageLayout and the ErrorBoundary's article — in two different
 * shapes, so the bars sat 48px from the edge while page content sat wherever a
 * 260px max-width happened to centre it. On a 390px phone that put the wordmark
 * at 48px and the text under it at 65px, which is the misalignment these two
 * constants exist to make impossible.
 *
 * Mobile is 32px on both. Tablet and desktop are unchanged.
 */

/**
 * Header, footer and the mobile menu panel. Full-bleed — no max-width — which is
 * deliberate: the bars span the viewport and do not line up with the article's
 * centred measure at tablet and above. See the note in Header.jsx.
 */
export const CHROME_FRAME = "px-[32px] tablet:px-[48px]";

/**
 * The page article: PageLayout, and the ErrorBoundary's own copy of it.
 *
 * There is no mobile max-width. A 260px cap used to sit here, applying from
 * 260px right up to the tablet breakpoint — so on any real phone the gutter was
 * half the leftover viewport rather than the padding, and setting a padding here
 * would have changed nothing you could see. The 32px is the gutter now. The
 * tablet and desktop caps stay.
 *
 * (Written out rather than named: Tailwind scans comments, and spelling the old
 * class here would generate the rule this file exists to remove.)
 */
export const PAGE_FRAME =
  "w-full tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-[32px] tablet:px-4";
