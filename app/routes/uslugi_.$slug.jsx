import { redirect } from "@remix-run/node";
import { Link, useLocation, useParams } from "@remix-run/react";
import { getLocaleFromPath } from "../lib/locales";
import {
  findBySlug,
  findByAnySlug,
  servicePath,
  galleryCategoryPath,
} from "../lib/seo";
import { getContent } from "../lib/content.server";
import { useContent } from "../lib/useContent";
import { PageLayout } from "../components/PageLayout";

/**
 * Same three outcomes as the gallery category loader, for the same reasons:
 * render this locale's slug, 301 another locale's, 404 anything else. See the
 * note in galeria_.$slug.jsx.
 */
export async function loader({ params, request }) {
  const locale = getLocaleFromPath(new URL(request.url).pathname);
  const content = await getContent(locale);

  if (findBySlug(content.services, locale, params.slug)) return null;

  const elsewhere = findByAnySlug(content.services, params.slug);
  if (elsewhere) {
    throw redirect(servicePath(locale, elsewhere, content.paths), 301);
  }

  throw new Response(null, { status: 404, statusText: "Not Found" });
}

export default function ServicePage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const content = useContent();
  const locale = getLocaleFromPath(pathname);
  const service = findBySlug(content?.services, locale, slug);
  const labels = content?.serviceLabels;
  const services = content?.pages.services;
  const pricing = content?.pages.pricing;

  // The loader has already 404'd an unknown slug; this covers the narrow case
  // where its fetch and the root loader's disagreed about the service list.
  if (!service) return null;

  /*
    The gallery categories this service is illustrated by, resolved from ids to
    live documents at render time. Stored as references rather than copied
    links, so renaming a category in the Studio cannot leave a dead link here.
    A category that has been deleted simply drops out.
  */
  const examples = (service.categories ?? [])
    .map((id) => content?.products?.find((p) => p.slug === id))
    .filter(Boolean);

  return (
    <PageLayout srHeading={service.name} showHeading>
      <p className="text-16 text-content mb-8 max-w-prose">{service.intro}</p>

      {service.scope?.length > 0 && (
        <>
          <h2 className="uppercase font-bold text-14 mb-3">
            {labels?.scopeHeading}
          </h2>
          <ul className="text-14 text-content mb-8 flex flex-col gap-1">
            {service.scope.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      {examples.length > 0 && (
        <>
          <h2 className="uppercase font-bold text-14 mb-3">
            {labels?.galleryHeading}
          </h2>
          {/*
            `min-h-[24px]` and inline-flex on the anchor, not padding on the
            <li>: WCAG 2.5.8 measures the target, and a taller list item with
            the same 17px link inside it is the same 17px target.

            Caught by the Lighthouse gate the moment it was widened to cover
            this template — `target-size` scored 0 here, taking the page's
            accessibility category to 0.95. Four category links at a 17px line
            height with a 4px gap: too short to hit, and too close together for
            the spacing exemption to apply. Same idiom as the back link below,
            which already carried it.
          */}
          <ul className="text-14 mb-8 flex flex-col gap-1">
            {examples.map((category) => (
              <li key={category.slug}>
                <Link
                  to={galleryCategoryPath(locale, category, content?.paths)}
                  className="inline-flex items-center min-h-[24px] underline hover:no-underline"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/*
        Down to the price list, then back up to the hub. The pricing link is the
        one a visitor who has read this far actually wants, so it comes first
        and is not styled as a back link.
      */}
      <p className="text-14 mb-8">
        <Link
          to={pricing?.path ?? "/"}
          className="underline hover:no-underline"
        >
          {labels?.pricingLink}
        </Link>
      </p>

      <Link
        to={services?.path ?? "/"}
        className="inline-flex items-center min-h-[24px] uppercase text-14 text-gray-accessible hover:text-black mb-8"
      >
        <span aria-hidden="true" className="mr-2">
          ←
        </span>
        {labels?.backToServices}
      </Link>
    </PageLayout>
  );
}
