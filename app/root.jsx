import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { ProgressProvider } from "@bprogress/remix";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SplashScreen } from "./components/SplashScreen";
import { PAGE_FRAME } from "./components/frame";
import { LOCALES, getLocaleFromPath } from "./lib/locales";
import {
  SITE_URL,
  HREFLANG_URLS,
  DEFAULT_LOCALE,
  getPageKey,
  getGalleryCategorySlug,
  getServiceSlug,
  galleryCategoryPath,
  servicePath,
  findBySlug,
} from "./lib/seo";
import { getContent } from "./lib/content.server";
import { useContent } from "./lib/useContent";
import "./tailwind.css";

/**
 * Vite inlines this at build time, identically for the server and client
 * bundles, so branching render output on it cannot produce a hydration
 * mismatch.
 *
 * The splash's once-per-session gate is production-only on purpose. In dev the
 * gate is the thing you are trying to look at, and a once-per-session animation
 * that suppresses itself after the first reload is one you tune blind.
 */
const isProduction = import.meta.env.PROD;

function canonicalFor(pathname) {
  const canonicalPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname || "/";
  return `${SITE_URL}${canonicalPath}`;
}

/** The category a gallery path points at, or null. */
function categoryFor(pathname, content) {
  const segment = getGalleryCategorySlug(pathname);
  if (!segment) return null;
  // Matched against this locale's slug: /de/galerie/montage-blumen-fototapeten
  // is the German address, and the Polish one is a different string entirely.
  return findBySlug(content?.products, getLocaleFromPath(pathname), segment);
}

/** The service a services path points at, or null for the hub. */
function serviceFor(pathname, content) {
  const segment = getServiceSlug(pathname);
  if (!segment) return null;
  return findBySlug(content?.services, getLocaleFromPath(pathname), segment);
}

/**
 * Title and description now come from the CMS. `content` is absent only when the
 * root loader itself failed — Remix still renders meta for the ErrorBoundary —
 * so fall back to the bundled copy rather than emitting an empty <title>.
 *
 * Category and service pages take their section's `page` key — "gallery" and
 * "services" — but not its title and description. Both come from the category
 * or service document in Sanity, which composes them from the name and the
 * intro when an editor has not written them — see categoryFrom() and
 * serviceFrom() in content.server.js, so the composition happens once for the
 * page, the sitemap and anything else that asks.
 *
 * `entry` is that document, returned rather than its slug because the hreflang
 * links need to ask it for a *different* locale's address than the one being
 * rendered. A slug string could not answer that.
 */
function getPageMeta(pathname, content) {
  const locale = getLocaleFromPath(pathname);
  const page = getPageKey(pathname);
  const cmsPage = content?.pages?.[page];
  const entry = categoryFor(pathname, content) ?? serviceFor(pathname, content);

  const title = entry
    ? entry.metaTitle
    : (cmsPage?.metaTitle ?? LOCALES[locale].title);
  const description = entry
    ? entry.metaDescription
    : (cmsPage?.metaDescription ?? LOCALES[locale].description);

  return {
    title,
    description,
    canonical: canonicalFor(pathname),
    locale: LOCALES[locale].lang,
    page,
    entry: entry ?? null,
  };
}

// Open Graph wants pl_PL, not the BCP-47 pl-PL that `lang` uses; Facebook and
// LinkedIn ignore the hyphenated form outright.
const toOgLocale = (bcp47) => bcp47.replace("-", "_");

const OG_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: "1200",
  height: "630",
};

const ORGANISATION_ID = `${SITE_URL}/#organization`;

/**
 * A @graph rather than a single node: the organisation is the same entity on
 * every page and is referenced by @id, while the page node varies by route.
 *
 * Typed as both Organization and LocalBusiness — Neatual manufactures and
 * distributes, and has a street address, so both apply and the pair is what
 * feeds the local results. Deliberately omits openingHours, geo, sameAs,
 * priceRange and foundingDate: none of them exist anywhere in this codebase
 * and inventing them is worse than leaving them out.
 */
function structuredData(pathname, content) {
  const locale = getLocaleFromPath(pathname);
  const config = LOCALES[locale];
  const { canonical, title, description, page, entry } = getPageMeta(
    pathname,
    content
  );
  const settings = content?.settings;

  // schema.org wants a dialable string, and the CMS stores the display form
  // ("+ 48 739 903 148"), so strip the spaces rather than storing it twice.
  const telephone = (settings?.phone ?? "+48 739 903 148").replace(/\s/g, "");
  const email = settings?.email ?? "info@neatual.com";

  const organisation = {
    "@type": ["Organization", "LocalBusiness"],
    "@id": ORGANISATION_ID,
    name: "Neatual",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    image: OG_IMAGE.url,
    description: config.description,
    telephone,
    email,
    areaServed: "PL",
    contactPoint: {
      "@type": "ContactPoint",
      telephone,
      email,
      contactType: "customer service",
      areaServed: "PL",
      availableLanguage: ["pl", "en", "de"],
    },
    // Same source as the address rendered on the contact page. Hardcoding it
    // here meant a move would update the visible address and leave the
    // structured data pointing at the old premises.
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.address?.streetAddress,
      addressLocality: settings?.address?.addressLocality,
      postalCode: settings?.address?.postalCode,
      addressCountry: settings?.address?.addressCountry,
    },
  };

  // The gallery index and its category pages are both collections of
  // photographs. The services hub is a collection of services; a single service
  // page is not a collection of anything, so it is a WebPage carrying the
  // `Service` node below.
  //
  // `pricing` deliberately falls through to WebPage. schema.org has no pricing
  // page type, and the tempting alternative — emitting Offer/PriceSpecification
  // nodes — would publish the rate table as machine-readable structured data.
  // While those rates are placeholders that is precisely how a fabricated price
  // ends up quoted in a search result. Revisit once real rates are entered.
  const pageType =
    page === "gallery" || (page === "services" && !entry)
      ? "CollectionPage"
      : page === "contact"
        ? "ContactPage"
        : "WebPage";

  /*
    A `Service` node on the six service pages, and only there.

    It carries what is actually known — the name, the description already
    written for the page, who provides it and where — and deliberately no
    `offers` or `priceSpecification`. The rates are placeholders (see PRICING in
    inlineCopy.js), and structured data is precisely the route by which a
    fabricated price ends up quoted in a search result. Revisit alongside the
    noindex on /cennik, once real numbers are entered.
  */
  const service =
    page === "services" && entry
      ? [
          {
            "@type": "Service",
            "@id": `${canonical}#service`,
            name: entry.name,
            description: entry.metaDescription,
            serviceType: entry.name,
            provider: { "@id": ORGANISATION_ID },
            areaServed: "PL",
          },
        ]
      : [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      organisation,
      ...service,
      {
        "@type": pageType,
        "@id": `${canonical}#page`,
        url: canonical,
        name: title,
        description,
        inLanguage: config.lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": ORGANISATION_ID },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Neatual",
        publisher: { "@id": ORGANISATION_ID },
        inLanguage: ["pl-PL", "en-US", "de-DE"],
      },
    ],
  };
}

export const meta = ({ data, location }) => {
  const pathname = location?.pathname || "/";
  const { title, description, canonical, locale, page } = getPageMeta(
    pathname,
    data?.content
  );
  const activeLocale = getLocaleFromPath(pathname);

  // The pricing page carries placeholder rates until someone turns
  // `pricingIsPlaceholder` off in the Studio. Indexing it in that state would
  // put invented prices for a real business into search results, where they
  // outlive the page — so the page stays out of the index until the numbers are
  // real. The flag lifts this by itself; there is nothing to remember to undo.
  const noindexPlaceholderPricing =
    page === "pricing" && data?.content?.pricing?.isPlaceholder !== false;

  return [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { title },
    ...(noindexPlaceholderPricing
      ? [{ name: "robots", content: "noindex, follow" }]
      : []),
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: "Neatual" },
    { property: "og:locale", content: toOgLocale(locale) },
    // Tells crawlers the same page exists in the other two languages; pairs
    // with the hreflang links in <head>.
    ...Object.keys(HREFLANG_URLS)
      .filter((code) => code !== activeLocale)
      .map((code) => ({
        property: "og:locale:alternate",
        content: toOgLocale(LOCALES[code].lang),
      })),
    { property: "og:image", content: OG_IMAGE.url },
    { property: "og:image:width", content: OG_IMAGE.width },
    { property: "og:image:height", content: OG_IMAGE.height },
    { property: "og:image:alt", content: title },
    // summary_large_image rather than summary: there is a real 1200x630 card
    // to show now.
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE.url },
  ];
};

/**
 * Paths come from the CMS so a slug edited in the Studio updates the hreflang
 * tags without a deploy. `HREFLANG_URLS` remains the fallback for the case where
 * the loader could not reach Sanity.
 *
 * On a category or service page the alternates are that same document in the
 * other two locales, not the section index. Pointing them at the index would
 * tell Google the Polish floral page and the German gallery listing are
 * translations of each other, and reciprocity would fail in both directions.
 *
 * Now that the slugs are translated, each alternate is a different string —
 * /galeria/montaz-fototapet-kwiatowych against
 * /de/galerie/montage-blumen-fototapeten — which is exactly why `entry` is the
 * whole document rather than one locale's slug.
 */
function getAlternatePaths(pathname, paths = HREFLANG_URLS, entry = null) {
  const page = getPageKey(pathname);
  const pathFor = page === "services" ? servicePath : galleryCategoryPath;
  const hrefFor = (code) =>
    entry
      ? `${SITE_URL}${pathFor(code, entry, paths)}`
      : `${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}`;
  return [
    { rel: "alternate", hreflang: "pl", href: hrefFor("pl") },
    { rel: "alternate", hreflang: "en", href: hrefFor("en") },
    { rel: "alternate", hreflang: "de", href: hrefFor("de") },
    { rel: "alternate", hreflang: "x-default", href: hrefFor(DEFAULT_LOCALE) },
  ];
}

export const links = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500&family=Roboto:wght@400;700;900&display=swap",
  },
];

export async function loader({ request }) {
  const url = new URL(request.url);
  const locale = getLocaleFromPath(url.pathname);
  // One query for the whole site. Every route and both chrome components read
  // this via useRouteLoaderData("root"), so there is exactly one CMS round-trip
  // per request and the locale re-export routes need no loader of their own.
  const content = await getContent(locale);
  return { pathname: url.pathname, content };
}

export default function App() {
  const { pathname, content } = useLoaderData() ?? { pathname: "/" };
  const locale = getLocaleFromPath(pathname);
  const htmlLang = locale === "pl" ? "pl" : locale === "en" ? "en" : "de";
  const { canonical, entry } = getPageMeta(pathname, content);
  const alternates = getAlternatePaths(pathname, content?.paths, entry);

  return (
    <html lang={htmlLang} className="font-sans">
      <head>
        <Meta />
        <Links />
        <link rel="canonical" href={canonical} />
        {alternates.map((alt) => (
          <link
            key={alt.hreflang}
            rel="alternate"
            hrefLang={alt.hreflang}
            href={alt.href}
          />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData(pathname, content)),
          }}
        />
        {/*
          Blocking, and in <head> on purpose: it has to run before the body
          paints, or a visitor who has already seen the splash this session gets
          a frame of it before the attribute lands. ~200 bytes inline, and the
          CSP at server.js:25 already allows 'unsafe-inline' for scripts, so
          this needs no nonce plumbing.

          The flag is written on the way *in* rather than on unload, because the
          case being suppressed is exactly a hard navigation to another page.

          `?splash` forces it to play and deliberately does NOT record the flag,
          so it can be replayed as many times as you like. Without an escape
          hatch this is a once-per-session animation that nobody — designer,
          reviewer, or the person tuning the timing — can watch twice without
          hand-clearing sessionStorage, which is how animations end up shipped
          having been looked at exactly once.

          try/catch is not defensive padding: Safari in Lockdown/private mode
          throws on sessionStorage access rather than returning null, and an
          uncaught throw here would take the rest of this script with it. If it
          does throw, the splash simply shows again — the CSS still dismisses it.
        */}
        {isProduction && (
          <script
            dangerouslySetInnerHTML={{
              __html:
                "try{if(location.search.indexOf('splash')<0){if(sessionStorage.getItem('neatual:splash')){document.documentElement.dataset.splash='seen'}else{sessionStorage.setItem('neatual:splash','1')}}}catch(e){}",
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-background text-black">
        {/*
          A GitHub-style bar across the top of the viewport while a client-side
          navigation is in flight. Remix has no built-in pending indicator, so
          between the click and the next route's loader resolving the page just
          sits there — on a slow connection that reads as a dead link, and the
          visitor clicks again.

          `color` and `height` are props rather than CSS because BProgress emits
          its stylesheet from them; overriding it from tailwind.css would mean
          fighting an inline <style> this component renders itself. Black to
          match the chrome — the library's default is a bright blue that belongs
          to no palette on this site.

          The default template is a bar, a "peg" (a transparent block whose only
          job is a 10px glow in the bar colour) and a corner spinner. Both are
          nprogress-era decoration: the glow reads as a smudge in black, and a
          spinner on a site that already opens with the splash is one loading
          signal too many. The template here is the bar alone, `aria-hidden`
          because its width is animated by script and carries no aria-valuenow —
          a progressbar role that never reports a value is worse than none.

          Anchor clicks are how it starts: BProgress attaches to every <a> in
          the document, which covers the CMS-driven nav and any Link a route
          renders, without either having to know this exists. It skips tel: and
          mailto: — both of which the contact page has — target="_blank", and
          modified clicks, so the bar does not run for a navigation that never
          happens. It stops on the location change, which is why this sits
          inside the route tree rather than beside it.
        */}
        <ProgressProvider
          color="#000000"
          height="3px"
          options={{
            showSpinner: false,
            template: '<div class="bar" aria-hidden="true"></div>',
          }}
        >
          <SplashScreen wordmark={content?.settings.wordmark} />
          {/*
            The skip link is the first thing a keyboard user reaches, and it is
            page copy like any other — it comes from the CMS now rather than from
            a three-way ternary here. content.server.js supplies the bundled text
            if Sanity is unreachable, so it is never empty.
          */}
          <a href="#main-content" className="skip-link">
            {content?.settings.skipLink}
          </a>
          <Header />
          {/*
            `flex-1 min-w-0` is load-bearing on this wrapper. `body` is a flex
            *row* (`display: flex` with no direction, tailwind.css), so its
            in-flow children are columns; without a grow value each one
            shrink-to-fits its max-content width. On text-heavy routes that
            happens to fill the viewport, but on /galeria — where every visible
            element is either absolutely positioned or gated behind `desktop:` —
            max-content was 38px, collapsing the product grid to 0-width columns
            and rendering the tiles as their 4px borders alone on every viewport
            under 1114px. See docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md §2.4.

            The wrapper exists so <main> and <footer> stack vertically. Dropped
            straight into `body` they would sit side by side as two columns of
            that row. `flex-1` on <main> inside it is what pins the footer to the
            bottom of a short page.

            ProgressProvider adds no element of its own here beyond a <style>,
            which `display: none` keeps out of that row — the wrapper is still
            the only grow-able column.
          */}
          <div className="flex-1 min-w-0 flex flex-col">
            <main
              id="main-content"
              className="flex-1 min-w-0 flex flex-col pb-16 tablet:pb-24"
              tabIndex={-1}
            >
              {/*
                The CTA used to render here, under every route. It is now the
                third column of PageLayout, which every route renders into —
                still one place, but inside the page grid rather than in a band
                beneath it. /kontakt no longer shows the two buttons twice,
                because its own pair *was* that column and has gone.
              */}
              <Outlet />
            </main>
            <Footer />
          </div>
        </ProgressProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Replaces Remix's built-in fallback, which shipped an unstyled English page
// titled "Unhandled Thrown Response!" with a console.log addressed to the
// developer. Renders the site chrome, the right `lang`, and a way out.
// `noindex` because an error page should never be indexed — the 404 *status*
// is what tells crawlers to drop the URL, and this belt-and-braces guards the
// soft-error case where the status is 500.
export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();
  const locale = getLocaleFromPath(location?.pathname || "/");
  const config = LOCALES[locale];
  /*
    The CMS copy when the root loader ran — which is the ordinary case, a 404
    thrown by a child route — and the bundled copy when it did not. useContent()
    reads root's loader data and returns undefined rather than throwing when that
    loader is the thing that failed, which is exactly the distinction needed.
  */
  const content = useContent();
  const copy = content?.error ?? config.error;
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const heading = isNotFound ? copy.notFoundHeading : copy.errorHeading;
  const body = isNotFound ? copy.notFoundBody : copy.errorBody;

  return (
    <html lang={locale} className="font-sans">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{`${heading} — Neatual.com`}</title>
        <Links />
      </head>
      <body className="min-h-screen bg-background text-black">
        <Header />
        <main
          id="main-content"
          className="flex-1 min-w-0 flex flex-col pb-16 tablet:pb-24"
          tabIndex={-1}
        >
          <article className={`${PAGE_FRAME} pt-48 tablet:pt-80`}>
            <p className="text-14 text-gray-accessible mb-4">{status}</p>
            <h1 className="font-bold text-18 mb-6">{heading}</h1>
            <p className="text-16 text-content mb-10 max-w-prose">{body}</p>
            <Link
              to={content?.pages?.home?.path ?? HREFLANG_URLS[locale].home}
              className="inline-block border-2 border-black uppercase text-16 text-center px-8 py-3 rounded-full font-bold hover:bg-black hover:text-white"
            >
              {copy.backHome}
            </Link>
          </article>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
