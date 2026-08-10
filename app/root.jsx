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
import { LOCALES, getLocaleFromPath } from "./lib/locales";
import { SITE_URL, HREFLANG_URLS, DEFAULT_LOCALE } from "./lib/seo";
import "./tailwind.css";

function getPageMeta(pathname) {
  const locale = getLocaleFromPath(pathname);
  const config = LOCALES[locale];
  const isGallery =
    pathname.includes("/galeria") ||
    pathname.includes("/gallery") ||
    pathname.includes("/galerie");
  const isContact =
    pathname.includes("/kontakt") ||
    pathname.includes("/contact") ||
    pathname.includes("/kontakte");

  let title = config.title;
  let description = config.description;
  if (isGallery) {
    title = `${config.title} — ${locale === "pl" ? "Galeria" : locale === "en" ? "Gallery" : "Galerie"}`;
    description =
      locale === "pl"
        ? "Galeria produktów Neatual - uniformy szyte w Polsce z polskich materiałów."
        : locale === "en"
          ? "Neatual product gallery - uniforms made in Poland from Polish materials."
          : "Neatual Produktgalerie - in Polen aus polnischen Materialien gefertigte Uniformen.";
  } else if (isContact) {
    title = `${config.title} — ${locale === "pl" ? "Kontakt" : locale === "en" ? "Contact" : "Kontakt"}`;
    description =
      locale === "pl"
        ? "Skontaktuj się z Neatual - ul. Siedlecka 172, Żelków-Kolonia. Tel. +48 739 903 148."
        : locale === "en"
          ? "Contact Neatual - ul. Siedlecka 172, Żelków-Kolonia. Phone +48 739 903 148."
          : "Kontakt Neatual - ul. Siedlecka 172, Żelków-Kolonia. Tel. +48 739 903 148.";
  }

  const canonicalPath = pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname || "/";
  const canonical = `${SITE_URL}${canonicalPath}`;

  return { title, description, canonical, locale: config.lang };
}

export const meta = ({ location }) => {
  const { title, description, canonical, locale } = getPageMeta(
    location?.pathname || "/"
  );
  return [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1.0" },
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonical },
    { property: "og:locale", content: locale },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
};

function getAlternatePaths(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  const isGallery =
    path.includes("/galeria") ||
    path.includes("/gallery") ||
    path.includes("/galerie");
  const isContact =
    path.includes("/kontakt") ||
    path.includes("/contact") ||
    path.includes("/kontakte");
  const page = isGallery ? "gallery" : isContact ? "contact" : "home";
  return [
    { rel: "alternate", hreflang: "pl", href: `${SITE_URL}${HREFLANG_URLS.pl[page]}` },
    { rel: "alternate", hreflang: "en", href: `${SITE_URL}${HREFLANG_URLS.en[page]}` },
    { rel: "alternate", hreflang: "de", href: `${SITE_URL}${HREFLANG_URLS.de[page]}` },
    { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}${HREFLANG_URLS[DEFAULT_LOCALE][page]}` },
  ];
}

export const links = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500&family=Roboto:wght@400;700;900&display=swap",
  },
];

export async function loader({ request }) {
  const url = new URL(request.url);
  return { pathname: url.pathname };
}

export default function App() {
  const { pathname } = useLoaderData() ?? { pathname: "/" };
  const locale = getLocaleFromPath(pathname);
  const htmlLang = locale === "pl" ? "pl" : locale === "en" ? "en" : "de";
  const { canonical } = getPageMeta(pathname);
  const alternates = getAlternatePaths(pathname);

  return (
    <html lang={htmlLang} className="font-sans">
      <head>
        <Meta />
        <Links />
        <link rel="canonical" href={canonical} />
        {alternates.map((alt) => (
          <link key={alt.hreflang} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Neatual",
              url: SITE_URL,
              logo: `${SITE_URL}/favicon.svg`,
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+48-739-903-148",
                email: "info@neatual.com",
                contactType: "customer service",
                areaServed: "PL",
              },
              address: {
                "@type": "PostalAddress",
                streetAddress: "ul. Siedlecka 172",
                addressLocality: "Żelków-Kolonia",
                postalCode: "08-110",
                addressCountry: "PL",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-black">
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
          className="flex-1 min-w-0 pb-24 tablet:pb-36"
          tabIndex={-1}
        >
          <Outlet />
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
  const body = isNotFound
    ? config.error.notFoundBody
    : config.error.errorBody;

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
          className="flex-1 min-w-0 pb-24 tablet:pb-36"
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
