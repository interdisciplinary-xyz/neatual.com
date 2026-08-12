import { LogoIcon } from "./icons";
import { PAGE_FRAME } from "./frame";

/**
 * The shell every route renders into: logo mark beside page content, two columns
 * at desktop and one stacked column below it.
 *
 * Each page used to bring its own layout — the home page a flex row of 1/3 and
 * 2/3, the gallery a different flex row of 1/3 and 2/3, the price list a single
 * centred measure, the contact page a three-column grid. They are one layout
 * now, on the home page's 1:2 proportion.
 *
 * Consequences worth knowing:
 *
 * - The logo mark renders at every breakpoint. It was desktop-only on the
 *   contact page and absent from the gallery and the price list.
 * - `items-start` matters: without it the mark stretches to the height of the
 *   content column, which on the gallery is most of a screen.
 */
export function PageLayout({ srHeading, showHeading = false, children }) {
  return (
    <article className={`${PAGE_FRAME} pt-48 pb-12 desktop:pt-80`}>
      {/*
        `[1fr_2fr]` rather than two equal halves. The mark is decorative and the
        content is not, and at half of 1114px the mark alone would be 527px —
        wider than it has ever rendered on this site. At a third it is ~335px and
        the content column gets ~670px.

        `gap-x-36` is 90px, up from the 40px this ran at first — the same gutter
        the contact page used before it moved onto this shell. Both columns give
        up ~17px to it, which the mark absorbs without notice and the price table
        has room for.
      */}
      <div className="desktop:grid desktop:grid-cols-[1fr_2fr] desktop:gap-x-36 desktop:items-start">
        <figure className="mb-12 tablet:mb-24 desktop:mb-0">
          <LogoIcon
            className="w-32 h-auto tablet:mx-auto tablet:w-56 desktop:w-full"
            aria-hidden="true"
          />
        </figure>

        {/*
          `min-w-0` because the price table's wrapper is `overflow-x-auto`: a
          grid item's default `min-width: auto` would let the table's min-content
          width push the column — and so the whole grid — wider than the page
          instead of scrolling inside it.
        */}
        <div className="min-w-0">
          {/*
            The design carries no visible page title on the four fixed pages, so
            their <h1> is visually hidden. It lives here rather than in each page
            so the document cannot end up without one — which is how /galeria and
            /kontakt shipped with no heading of any level.

            `showHeading` is for the gallery category pages, the one place that
            convention breaks down: six pages of photographs that differ only by
            subject, where a visitor who followed a link needs to be told which
            one they landed on. Same element either way, so the name is never
            announced twice — and it sits in the content column rather than above
            the grid, so a visible one reads as the head of the page's content
            rather than a banner over the logo.
          */}
          <h1 className={showHeading ? "font-bold text-18 mb-8" : "sr-only"}>
            {srHeading}
          </h1>
          {children}
        </div>
      </div>

      {/*
        No call to action under the columns. ContactCta used to render here — and
        before that in root.jsx — putting the same "Napisz / Zadzwoń" pair at the
        foot of all four pages. It is gone from the site; the two links live in
        the footer now, and /kontakt carries them as its content. The `cta` field
        is still fetched in content.server.js and still editable in the Studio,
        so bringing it back is one component, not a content migration.
      */}
    </article>
  );
}
