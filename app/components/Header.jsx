import { Link, useLocation } from "@remix-run/react";
import { LogoIcon, PlayIcon, StopIcon } from "./icons";
import { useDeviceType } from "./DisplayMedia";
import { LOCALES, getLocaleFromPath } from "../lib/locales";

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
  if (pathname === "/" || pathname === "/en" || pathname === "/de") return "HOME";
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
  const config = LOCALES[locale];
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
          <Link
            to={locale === "pl" ? "/" : `/${locale}`}
            aria-label={locale === "pl" ? "Neatual - strona główna" : locale === "en" ? "Neatual - home" : "Neatual - Startseite"}
          >
            {showTextLogo && (
              <span className="font-logo text-18 mr-auto">netual.com</span>
            )}
            {showSvgLogo && (
              <LogoIcon className="mr-auto tablet:h-auto tablet:w-36 w-32" aria-hidden="true" />
            )}
          </Link>
        </div>
        <div className="desktop:w-2/3 desktop:flex desktop:px-36">
          {showContact && (
            <ul className="hidden desktop:flex w-2/3">
              <li className="w-1/2">
                <a
                  className="flex"
                  href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
                  aria-label={locale === "pl" ? "Zadzwoń" : locale === "en" ? "Call" : "Anrufen"}
                >
                  <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
                  <span className="text-14">{config.contact.phone}</span>
                </a>
              </li>
              <li className="w-1/2">
                <a
                  className="flex"
                  href={`mailto:${config.contact.email}`}
                  aria-label={locale === "pl" ? "Napisz e-mail" : locale === "en" ? "Send email" : "E-Mail senden"}
                >
                  <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
                  <span className="text-14">{config.contact.email}</span>
                </a>
              </li>
            </ul>
          )}
          <nav className="desktop:w-1/3 flex ml-auto" aria-label={locale === "pl" ? "Wybierz język" : locale === "en" ? "Language selector" : "Sprachauswahl"}>
            <ul className="flex ml-auto gap-1">
              {LANGUAGES.map((lang, index) => (
                <li key={lang.code}>
                  <Link
                    to={getLocalizedPath(pathname, lang.code)}
                    className={locale === lang.code ? "font-black" : ""}
                  >
                    {lang.label}
                    {index < LANGUAGES.length - 1 ? " | " : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
