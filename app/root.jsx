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
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SplashScreen } from "./components/SplashScreen";
import { ContactCta } from "./components/ContactCta";
import { LOCALES, getLocaleFromPath } from "./lib/locales";
import { SITE_URL, HREFLANG_URLS, DEFAULT_LOCALE, getPageKey } from "./lib/seo";
import { getContent } from "./lib/content.server";
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

/**
 * Title and description now come from the CMS. `content` is absent only when the
 * root loader itself failed — Remix still renders meta for the ErrorBoundary —
 * so fall back to the bundled copy rather than emitting an empty <title>.
 */
function getPageMeta(pathname, content) {
  const locale = getLocaleFromPath(pathname);
  const page = getPageKey(pathname);
  const cmsPage = content?.pages?.[page];

  return {
    title: cmsPage?.metaTitle ?? LOCALES[locale].title,
    description: cmsPage?.metaDescription ?? LOCALES[locale].description,
    canonical: canonicalFor(pathname),
    locale: LOCALES[locale].lang,
    page,
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
  const { canonical, title, description, page } = getPageMeta(
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

  // `pricing` deliberately falls through to WebPage. schema.org has no pricing
  // page type, and the tempting alternative — emitting Offer/PriceSpecification
  // nodes — would publish the rate table as machine-readable structured data.
  // While those rates are placeholders that is precisely how a fabricated price
  // ends up quoted in a search result. Revisit once real rates are entered.
  const pageType =
    page === "gallery"
      ? "CollectionPage"
      : page === "contact"
        ? "ContactPage"
        : "WebPage";

  return {
    "@context": "https://schema.org",
    "@graph": [
      organisation,
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
 */
function getAlternatePaths(pathname, paths = HREFLANG_URLS) {
  const page = getPageKey(pathname);
  const hrefFor = (code) =>
    `${SITE_URL}${paths[code]?.[page] ?? HREFLANG_URLS[code][page]}`;
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
  const { canonical } = getPageMeta(pathname, content);
  const alternates = getAlternatePaths(pathname, content?.paths);

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
        <SplashScreen />
        <a href="#main-content" className="skip-link">
          {locale === "pl"
            ? "Przejdź do treści"
            : locale === "en"
              ? "Skip to main content"
              : "Zum Inhalt springen"}
        </a>
        <Header />
        {/*
          `flex-1 min-w-0` is load-bearing. `body` is `display: flex`
          (tailwind.css), so <main> is a flex item; without a grow value it
          shrink-to-fits its max-content width. On text-heavy routes that
          happens to fill the viewport, but on /galeria — where every visible
          element is either absolutely positioned or gated behind `desktop:` —
          max-content was 38px, collapsing the product grid to 0-width columns
          and rendering the tiles as their 4px borders alone on every viewport
          under 1114px. See docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md §2.4.
        */}
        <main
          id="main-content"
          className="flex-1 min-w-0 flex flex-col pb-32 tablet:pb-56"
          tabIndex={-1}
        >
          <Outlet />
          {/*
            Rendered here rather than per-route so every page gets it from one
            place — including /kontakt, which therefore shows these two buttons
            twice (the contact page's own pair, then the CTA's). That duplication
            is deliberate and requested, not an oversight.
          */}
          <ContactCta />
        </main>
        <Footer />
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
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const heading = isNotFound
    ? config.error.notFoundHeading
    : config.error.errorHeading;
  const body = isNotFound ? config.error.notFoundBody : config.error.errorBody;

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
          className="flex-1 min-w-0 flex flex-col pb-32 tablet:pb-56"
          tabIndex={-1}
        >
          <article className="mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4 pt-48 tablet:pt-80">
            <p className="text-14 text-gray-accessible mb-4">{status}</p>
            <h1 className="font-bold text-18 mb-6">{heading}</h1>
            <p className="text-16 text-content mb-10 max-w-prose">{body}</p>
            <Link
              to={HREFLANG_URLS[locale].home}
              className="inline-block border-2 border-black uppercase text-16 text-center px-8 py-3 rounded-full font-bold hover:bg-black hover:text-white"
            >
              {config.error.backHome}
            </Link>
          </article>
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}
