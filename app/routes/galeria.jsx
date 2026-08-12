import { useMemo } from "react";
import { Link, useLocation } from "@remix-run/react";
import { getLocaleFromPath } from "../lib/locales";
import { galleryCategoryPath } from "../lib/seo";
import { useContent } from "../lib/useContent";
import { PageLayout } from "../components/PageLayout";
import { ProductImage } from "../components/ProductImage";

// Measured rendered widths, not guesses: ~290px in the 2-col tablet grid and
// ~216px in the 3-col desktop content column.
//
// Mobile is a calc rather than a number because the page no longer caps its
// content at 260px — the column is the viewport less the 32px gutters, and the
// two tiles split it around a 10px gap. A flat "120px" here was right for the
// old 260px frame and would now pick a 400px-wide variant for a tile rendered
// at 158 CSS px on a 390px phone, i.e. a visibly soft image at 3x.
const TILE_SIZES =
  "(min-width: 1114px) 220px, (min-width: 608px) 290px, calc(50vw - 37px)";

/**
 * The gallery index: one tile per category, each linking to its own page.
 *
 * It used to be the whole gallery — a tile column beside a detail panel, with
 * the selected product's photos swapped in place and a modal standing in for the
 * panel below 1114px. Nothing about which product you were looking at was in the
 * URL, so no category could be linked to, shared, or indexed; the six of them
 * were one page as far as search was concerned.
 */
export default function GalleryPage() {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const content = useContent();
  const page = content?.pages.gallery;

  // Thumbnail paths are derived, not stored: the responsive variants are
  // generated from art/gallery-originals by scripts/generate-gallery-images.mjs,
  // so the CMS holds the folder name and the count rather than a URL per photo.
  const categories = useMemo(
    () =>
      (content?.products ?? []).map((product) => ({
        ...product,
        // `slug` addresses the page, `imageBase` addresses the folder. They hold
        // the same word today and are separate fields on purpose — see
        // categoryFrom() in content.server.js.
        to: galleryCategoryPath(locale, product.slug, content?.paths),
        thumbnailBase: `/gallery/${product.imageBase}/${product.imageBase}-1`,
      })),
    [content, locale]
  );

  return (
    <PageLayout srHeading={page?.srHeading}>
      <ul className="grid grid-cols-2 gap-4 desktop:grid-cols-3">
        {categories.map((category, index) => (
          <li key={category.slug}>
            {/*
              The whole tile is one link, with the category name as its text —
              so it needs no aria-label, and the accessible name is the visible
              one (WCAG 2.5.3). The tiles used to be image-only buttons whose
              only name was an aria-label nobody could see.
            */}
            <Link
              to={category.to}
              className="block group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <span className="block aspect-square overflow-hidden rounded-2xl border-2 border-transparent relative group-hover:border-black">
                {/*
                  Was `index < 4 ? "eager" : "lazy"` with exactly 4 products, so
                  nothing was ever lazy. Only the first tile is above the fold on
                  every viewport, so only it is eager.
                */}
                <ProductImage
                  base={category.thumbnailBase}
                  alt=""
                  width={400}
                  height={400}
                  sizes={TILE_SIZES}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : undefined}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
                />
              </span>
              {/*
                `alt=""` above, and the name here as real text. The photograph is
                decorative once the link is named — describing it as well would
                announce the same tile twice, once as prose and once as a link.
              */}
              <span className="block uppercase font-bold text-14 mt-3">
                {category.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}
