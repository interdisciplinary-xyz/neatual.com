import { Link, useLocation } from "@remix-run/react";
import { LogoIcon } from "./icons";
import { getLocaleFromPath } from "../lib/locales";
import { useContent, navItemsFrom } from "../lib/useContent";

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
    if (normalizedPath === "/pricing" || normalizedPath === "/preise")
      return "/cennik";
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
      normalizedPath === "/cennik" ||
      normalizedPath === "/pricing" ||
      normalizedPath === "/preise"
    )
      return "/en/pricing";
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
      normalizedPath === "/cennik" ||
      normalizedPath === "/pricing" ||
      normalizedPath === "/preise"
    )
      return "/de/preise";
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

/*
  `getRouteName` used to live here, mapping the path to HOME/GALLERY/PRICING/
  CONTACT purely so the header could render itself differently per page. With
  one header on every route there is nothing left to branch on, so it is gone
  rather than left as a function nobody calls. Page identity is available from
  getPageKey() in app/lib/seo.js if it is ever needed again.
*/

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const locale = getLocaleFromPath(pathname);
  const content = useContent();
  const settings = content?.settings;

  /*
    One header on every route, and now identical at every viewport. It used to
    vary by page: the gallery swapped the wordmark for the logo mark at desktop,
    every non-home page swapped it below desktop, and the contact page hid the
    phone and email entirely. The result was four different headers depending on
    where you stood.

    The phone number and email have moved to the Footer. They only ever rendered
    from `desktop:` (1114px) up, because that is the only width this row had room
    for them at — down in the footer every visitor gets them.
  */
  const navItems = navItemsFrom(content);
  // Trailing slash stripped so `/galeria/` still marks the gallery as current.
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  return (
    /*
      `bg-background` unconditionally, not `tablet:bg-background`. The header
      used to be transparent below tablet, which was survivable when it held
      only a wordmark; now that the main nav lives here, page content scrolling
      under a transparent bar would run straight through the nav labels.
    */
    <header className="fixed top-0 left-0 py-8 w-full bg-background tablet:py-12 z-10">
      {/*
        Full-bleed, unlike every other block on the site. The max-width ladder
        that used to be here (260 / 608 / 1114px, centred) is what aligns page
        content with the wordmark; dropping it means the header now spans the
        viewport and no longer lines up with the article below it. That is the
        intended look here, not an oversight.

        `px-[48px]` as an arbitrary value rather than a scale step: the spacing
        scale in tailwind.config.js is built on 1rem = 10px, so it has no 4.8rem
        entry, and rounding to `px-12` (30px) or `px-16` (40px) would not be the
        48px asked for.
      */}
      <div className="px-[48px]">
        {/*
          One row: wordmark, main nav, language switcher.

          `flex-wrap` rather than a hard single line. At desktop everything fits
          on one row, which is the point; at 260px the same groups cannot share a
          line at any font size, so they wrap instead of overflowing. `gap-y-4`
          is what keeps the wrapped case legible.
        */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          {/*
            `mr-auto` lives on the wordmark, not on the nav: it is the single
            gap in the row, so everything after it — main nav, language switcher
            — is pushed to the right edge together while the wordmark stays at
            the left.
          */}
          <div className="shrink-0 mr-auto">
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
              {/*
              aria-hidden, and no alt text: the wordmark beside it already
              names the link, so announcing the mark as well would read the
              brand twice. `shrink-0` because the link is a flex row — without
              it the mark squashes before the text wraps on a narrow viewport.
            */}
              <LogoIcon
                className="w-8 h-auto mr-3 shrink-0"
                aria-hidden="true"
              />
              <span className="font-logo text-18 mr-auto">
                {settings?.wordmark}
              </span>
              <span className="sr-only">
                {`— ${settings?.a11y.homeLink ?? ""}`}
              </span>
            </Link>
          </div>

          {/*
            The main nav, moved up from the footer and sitting on the right of
            the row with the contact details and the language switcher.
          */}
          <nav aria-label={settings?.a11y.mainNav}>
            {/*
              `flex-wrap` here too, not just on the row above. At the 260px
              mobile width the four labels come to roughly 253px before gaps,
              against about 240px of usable space — without wrapping they push
              the page into a horizontal scroll, which is the one thing this
              layout must never do.
            */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 tablet:gap-x-8">
              {navItems.map((item) => {
                const itemPath = item.link.replace(/\/$/, "") || "/";
                // Also active for anything under the item — /galeria/kwiatowe
                // keeps GALERIA marked. The `itemPath !== "/"` guard is what
                // stops the home link claiming every page on the site.
                const isActive =
                  normalizedPathname === itemPath ||
                  (itemPath !== "/" &&
                    normalizedPathname.startsWith(`${itemPath}/`));

                return (
                  <li key={item.link}>
                    <Link
                      to={item.link}
                      className={`text-center uppercase text-14 pb-2 inline-flex items-center min-h-[24px] hover:text-black ${
                        isActive
                          ? "text-black border-b-2 border-black"
                          : "text-gray-accessible"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav className="flex shrink-0" aria-label={settings?.a11y.langNav}>
            {/*
              These links were 17x12, 18x12 and 12x12 px — under the WCAG
              2.5.8 minimum of 24x24 — because they carried no `text-*` class
              and so inherited the 10px root size. They are the only way to
              change language on the site. The "|" separators used to sit
              *inside* the anchors, making them part of the link text and
              target; they are now aria-hidden siblings.
            */}
            {/*
              `pb-2` on the links and the separators, mirroring the `pb-2` the
              main nav links carry to hold their active underline clear of the
              text. Without it the two groups sit in boxes the row centres
              identically, but the nav labels are lifted 5px inside theirs and
              these are not, so the language switcher reads as sitting low.
              Padding, not a margin or a translate, so the 24x24 target stays.
            */}
            <ul className="flex ml-auto items-center">
              {LANGUAGES.map((lang, index) => (
                <li key={lang.code} className="flex items-center">
                  <Link
                    to={getLocalizedPath(pathname, lang.code)}
                    hrefLang={lang.code}
                    aria-current={locale === lang.code ? "true" : undefined}
                    className={`text-14 inline-flex items-center justify-center min-w-[24px] min-h-[24px] px-1 pb-2 ${
                      locale === lang.code ? "font-black" : ""
                    }`}
                  >
                    {lang.label}
                  </Link>
                  {index < LANGUAGES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="text-14 text-gray-accessible pb-2"
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
