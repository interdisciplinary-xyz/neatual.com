import { Link, redirect, useLocation, useParams } from "react-router";
import { getLocaleFromPath } from "../lib/locales";
import { fillTemplate } from "../lib/inlineCopy";
import {
  findBySlug,
  findByAnySlug,
  galleryCategoryPath,
  servicePath,
} from "../lib/seo";
import { getContent } from "../lib/content.server";
import { useContent } from "../lib/useContent";
import { PageLayout } from "../components/PageLayout";
import { ProductImage } from "../components/ProductImage";

// Two columns of photographs: ~330px each in the 670px desktop content column,
// ~295px at tablet, and on mobile the viewport less the 32px gutters and the
// 10px gap between them — see the note on TILE_SIZES in galeria.jsx.
const PHOTO_SIZES =
  "(min-width: 1114px) 330px, (min-width: 608px) 295px, calc(50vw - 37px)";

/**
 * Resolves the slug against *this locale's* addresses, and decides between
 * rendering, redirecting and 404ing.
 *
 * Three outcomes, in order:
 *
 * 1. The segment is this locale's slug for a category — render it.
 * 2. The segment is some other locale's slug, or the pre-translation slug the
 *    page shipped with (/galeria/kwiatowe) — 301 to the right address. Both are
 *    real links that existed or could exist; a 404 would throw away a visitor
 *    and, for the second case, an indexed URL.
 * 3. Neither — 404, so an invented category does not answer 200 with an empty
 *    page. A soft 404 is the version search engines index and keep.
 *
 * This is a second CMS round-trip on top of the root loader's, which is the
 * price of the check: loaders cannot read each other's data, and validating
 * against the bundled product list instead would 404 any category added in the
 * Studio until the next deploy. Six pages, and getContent never throws.
 */
export async function loader({ params, request }) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const content = await getContent(locale);

  if (findBySlug(content.products, locale, params.slug)) return null;

  const elsewhere = findByAnySlug(content.products, params.slug);
  if (elsewhere) {
    throw redirect(galleryCategoryPath(locale, elsewhere, content.paths), 301);
  }

  throw new Response(null, { status: 404, statusText: "Not Found" });
}

export default function GalleryCategoryPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const content = useContent();
  const locale = getLocaleFromPath(pathname);
  // Matched the same way the loader matched it — against this locale's slug,
  // not the canonical id, which no longer appears in any URL.
  const category = findBySlug(content?.products, locale, slug);
  const a11y = content?.settings.a11y;
  const gallery = content?.pages.gallery;

  // The first service that lists this category, with its path in this locale.
  // First rather than all: one contextual link reads as a route onward, four
  // read as a link farm.
  const related = content?.services?.find((s) =>
    s.categories?.includes(category?.slug)
  );
  const service = related
    ? { name: related.name, path: servicePath(locale, related, content?.paths) }
    : null;

  // The loader has already 404'd an unknown slug. This guards the narrow case
  // where the two fetches disagreed — the loader got a CMS response listing this
  // category and the root loader fell back to the bundled copy, or the reverse.
  if (!category) return null;

  // Photo paths come from `imageBase`, the folder under public/gallery — not
  // from the slug in the URL, so renaming a category's address in the Studio
  // does not break every image on its page.
  const folder = category.imageBase;
  const photos = Array.from({ length: category.photoCount }, (_, i) => ({
    base: `/gallery/${folder}/${folder}-${i + 1}`,
    n: i + 1,
  }));

  return (
    <PageLayout srHeading={category.name} showHeading>
      {/* Optional per-category paragraph; most categories leave it empty. */}
      {category.intro && (
        <p className="text-16 text-content mb-6 max-w-prose">
          {category.intro}
        </p>
      )}
      <p className="text-14 text-content mb-2">
        {category.descriptionLines?.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className="font-bold text-16 mb-8">{category.price}</p>

      {/*
        The link up to the service this category illustrates — the spoke half of
        the hub and spoke. Without it these six pages linked only to the gallery
        index and to nothing that ranks, which is most of why they had no
        standing of their own. Resolved by reference rather than stored per
        category, so a service that adds this category to its list picks up the
        inbound link here with no edit to this page.
      */}
      {service && (
        <p className="text-14 mb-4">
          <Link to={service.path} className="underline hover:no-underline">
            {service.name}
          </Link>
        </p>
      )}

      {/*
        Back to the index, in the current locale — `gallery.path` rather than a
        hardcoded "/galeria", so the German page returns to /de/galerie. The
        label is the nav's own, which is already translated three ways; a "back"
        string would have been new copy in three languages for no gain.
      */}
      <Link
        to={gallery?.path ?? "/"}
        className="inline-flex items-center min-h-[24px] uppercase text-14 text-gray-accessible hover:text-black mb-8"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        {gallery?.navLabel}
      </Link>

      <ul className="grid grid-cols-2 gap-4">
        {photos.map((photo, index) => (
          <li
            key={photo.base}
            className="aspect-square overflow-hidden rounded-2xl relative"
          >
            {/*
              The first photograph is this page's LCP element on every viewport,
              so it is the one that loads eagerly; the rest are below the fold at
              260px and only just above it at 1114px.
            */}
            <ProductImage
              base={photo.base}
              alt={fillTemplate(a11y?.photoAlt, {
                name: category.name,
                n: photo.n,
              })}
              width={800}
              height={800}
              sizes={PHOTO_SIZES}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : undefined}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
            />
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}
