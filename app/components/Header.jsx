import { Link, useLocation } from "@remix-run/react";
import { LogoIcon, PlayIcon, StopIcon } from "./icons";
import { useDeviceType } from "./DisplayMedia";
import { getLocaleFromPath } from "../lib/locales";
import { useContent } from "../lib/useContent";

const LANGUAGES = [
  { code: "pl", label: "PL" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

function getLocalizedPath(pathname, lang) {
  const path = pathname.replace(/^\/(en|de)/, "") || "/";
  const normalizedPath = path === "" ? "/" : path;
  if (lang === "pl") {
    if (normalizedPath === "/") return "/";
    if (normalizedPath === "/gallery" || normalizedPath === "/galerie")
      return "/galeria";
    if (normalizedPath === "/contact" || normalizedPath === "/kontakte")
      return "/kontakt";
    return normalizedPath;
  }
  if (lang === "en") {
    if (normalizedPath === "/") return "/en";
    if (
      normalizedPath === "/galeria" ||
      normalizedPath === "/gallery" ||
      normalizedPath === "/galerie"
    )
      return "/en/gallery";
    if (
      normalizedPath === "/kontakt" ||
      normalizedPath === "/contact" ||
      normalizedPath === "/kontakte"
    )
      return "/en/contact";
    return `/en${normalizedPath}`;
  }
  if (lang === "de") {
    if (normalizedPath === "/") return "/de";
    if (
      normalizedPath === "/galeria" ||
      normalizedPath === "/gallery" ||
      normalizedPath === "/galerie"
    )
      return "/de/galerie";
    if (
      normalizedPath === "/kontakt" ||
      normalizedPath === "/contact" ||
      normalizedPath === "/kontakte"
    )
      return "/de/kontakte";
    return `/de${normalizedPath}`;
  }
  return normalizedPath;
}

function getRouteName(pathname) {
  if (pathname === "/" || pathname === "/en" || pathname === "/de")
    return "HOME";
  if (
    pathname.includes("/galeria") ||
    pathname.includes("/gallery") ||
    pathname.includes("/galerie")
  )
    return "GALLERY";
  if (
    pathname.includes("/kontakt") ||
    pathname.includes("/contact") ||
    pathname.includes("/kontakte")
  )
    return "CONTACT";
  return "HOME";
}

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const locale = getLocaleFromPath(pathname);
  const content = useContent();
  const settings = content?.settings;
  const routeName = getRouteName(pathname);
  const deviceType = useDeviceType();
  const isContactPage = routeName === "CONTACT";
  const isGalleryPage = routeName === "GALLERY";
  const isHomePage = routeName === "HOME";
  const isDesktop = deviceType === "desktop";

  const showContact = isDesktop && !isContactPage;
  const showTextLogo =
    (deviceType === "mobile" && isHomePage) ||
    (deviceType === "tablet" && isHomePage) ||
    (isDesktop && !isGalleryPage);
  const showSvgLogo =
    (deviceType === "mobile" && !isHomePage) ||
    (deviceType === "tablet" && !isHomePage) ||
    (isDesktop && isGalleryPage);

  return (
    <header className="fixed top-0 left-0 pt-12 w-full tablet:bg-background tablet:pt-20 z-10">
      <div className="flex justify-between mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4">
        <div className="desktop:w-1/3">
          {/*
            No aria-label here. It used to read "Neatual - strona główna"
            while the visible text read "neatual.com", so the accessible name
            did not contain the visible label — a WCAG 2.5.3 (Label in Name)
            failure that Lighthouse flagged as label-content-name-mismatch,
            and which breaks voice control ("click neatual dot com").
            The visible text now contributes to the name, and the sr-only
            span only appends the destination.
          */}
          <Link
            to={locale === "pl" ? "/" : `/${locale}`}
            className="inline-flex items-center"
          >
            {showTextLogo && (
              <span className="font-logo text-18 mr-auto">neatual.com</span>
            )}
            {showSvgLogo && (
              <LogoIcon
                className="mr-auto tablet:h-auto tablet:w-36 w-32"
                aria-hidden="true"
              />
            )}
            <span className="sr-only">
              {showSvgLogo
                ? `Neatual — ${settings?.a11y.homeLink ?? ""}`
                : `— ${settings?.a11y.homeLink ?? ""}`}
            </span>
          </Link>
        </div>
        <div className="desktop:w-2/3 desktop:flex desktop:px-36">
          {showContact && (
            <ul className="hidden desktop:flex w-2/3">
              {/*
                sr-only verb rather than aria-label, so the accessible name
                contains the visible phone number and address (WCAG 2.5.3).
                These render only at >=1114px, which is why the mobile
                Lighthouse run never flagged them — same defect as kontakt.jsx.
              */}
              <li className="w-1/2">
                <a
                  className="flex"
                  href={`tel:${(settings?.phone ?? "").replace(/\s/g, "")}`}
                >
                  <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
                  <span className="sr-only">{settings?.a11y.call}</span>
                  <span className="text-14">{settings?.phone}</span>
                </a>
              </li>
              <li className="w-1/2">
                <a className="flex" href={`mailto:${settings?.email ?? ""}`}>
                  <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
                  <span className="sr-only">{settings?.a11y.email}</span>
                  <span className="text-14">{settings?.email}</span>
                </a>
              </li>
            </ul>
          )}
          <nav
            className="desktop:w-1/3 flex ml-auto"
            aria-label={settings?.a11y.langNav}
          >
            {/*
              These links were 17x12, 18x12 and 12x12 px — under the WCAG
              2.5.8 minimum of 24x24 — because they carried no `text-*` class
              and so inherited the 10px root size. They are the only way to
              change language on the site. The "|" separators used to sit
              *inside* the anchors, making them part of the link text and
              target; they are now aria-hidden siblings.
            */}
            <ul className="flex ml-auto items-center">
              {LANGUAGES.map((lang, index) => (
                <li key={lang.code} className="flex items-center">
                  <Link
                    to={getLocalizedPath(pathname, lang.code)}
                    hrefLang={lang.code}
                    aria-current={locale === lang.code ? "true" : undefined}
                    className={`text-14 inline-flex items-center justify-center min-w-[24px] min-h-[24px] px-1 ${
                      locale === lang.code ? "font-black" : ""
                    }`}
                  >
                    {lang.label}
                  </Link>
                  {index < LANGUAGES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="text-14 text-gray-accessible"
                    >
                      |
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
