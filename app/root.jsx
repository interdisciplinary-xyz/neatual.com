import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LOCALES, getLocaleFromPath } from "./lib/locales";
import "./tailwind.css";

const SITE_URL = "https://neatual.com";

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

const HREFLANG_URLS = {
  pl: { home: "/", gallery: "/galeria", contact: "/kontakt" },
  en: { home: "/en", gallery: "/en/gallery", contact: "/en/contact" },
  de: { home: "/de", gallery: "/de/galerie", contact: "/de/kontakte" },
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
    { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}${HREFLANG_URLS.pl[page]}` },
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
        <main id="main-content" className="pb-24 tablet:pb-36" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
