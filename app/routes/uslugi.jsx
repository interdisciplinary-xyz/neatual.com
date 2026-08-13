import { Link, useLocation } from "@remix-run/react";
import { getLocaleFromPath } from "../lib/locales";
import { servicePath } from "../lib/seo";
import { useContent } from "../lib/useContent";
import { PageLayout } from "../components/PageLayout";

/**
 * The service hub: one entry per service, each linking to its own page.
 *
 * This is the page the site did not have. Everything here was previously said
 * only in passing — a line of the home page's body copy, a row of the price
 * table — so the queries that describe what Neatual actually does ("montaż
 * tapet", "tapetowanie ścian", "zdjęcie starej tapety") had nothing to land on.
 * The gallery was standing in for it, and the gallery is organised by what a
 * wall looks like, not by what is done to it.
 *
 * Deliberately a list of prose rather than a grid of tiles: the gallery already
 * owns the photographs, and a service is chosen by reading what it covers.
 */
export default function ServicesPage() {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const content = useContent();
  const page = content?.pages.services;
  const services = content?.services ?? [];

  return (
    <PageLayout srHeading={page?.srHeading}>
      {page?.shortDescription && (
        <p className="text-16 text-content mb-10 max-w-prose">
          {page.shortDescription}
        </p>
      )}

      <ul className="flex flex-col gap-10">
        {services.map((service) => (
          <li key={service.slug}>
            {/*
              An <h2> per service, and the link inside it rather than wrapped
              around the whole entry: the intro below is a paragraph, and a
              block link swallowing a heading and a paragraph gives the link an
              accessible name two sentences long.
            */}
            <h2 className="uppercase font-bold text-16 mb-2">
              <Link
                to={servicePath(locale, service, content?.paths)}
                className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                {service.name}
              </Link>
            </h2>
            <p className="text-14 text-content max-w-prose">{service.intro}</p>
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}
