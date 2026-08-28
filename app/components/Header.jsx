import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { CloseIcon, LogoIcon, MenuIcon } from "./icons";
import { useModalBehaviour } from "./useModalBehaviour";
import { CHROME_FRAME } from "./frame";
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

/**
 * The wordmark link, rendered in the header row and again at the top of the
 * mobile panel.
 *
 * No aria-label. It used to read "Neatual - strona główna" while the visible
 * text read "neatual.com", so the accessible name did not contain the visible
 * label — a WCAG 2.5.3 (Label in Name) failure that Lighthouse flagged as
 * label-content-name-mismatch, and which breaks voice control ("click neatual
 * dot com"). The visible text now contributes to the name, and the sr-only span
 * only appends the destination.
 */
function HomeLink({ locale, settings }) {
  return (
    <Link
      to={locale === "pl" ? "/" : `/${locale}`}
      className="inline-flex items-center"
    >
      {/*
        aria-hidden, and no alt text: the wordmark beside it already names the
        link, so announcing the mark as well would read the brand twice.
        `shrink-0` because the link is a flex row — without it the mark squashes
        before the text wraps on a narrow viewport.
      */}
      <LogoIcon className="w-8 h-auto mr-3 shrink-0" aria-hidden="true" />
      <span className="font-logo text-18 mr-auto">{settings?.wordmark}</span>
      <span className="sr-only">{`— ${settings?.a11y.homeLink ?? ""}`}</span>
    </Link>
  );
}

/**
 * The four main links, in the header row at tablet and up and in the panel
 * below it. One component rather than two lists: the active-state rule is the
 * subtle part, and two copies of it drift.
 */
function NavLinks({
  items,
  currentPath,
  listClassName,
  linkClassName,
  onNavigate,
}) {
  return (
    <ul className={listClassName}>
      {items.map((item) => {
        const itemPath = item.link.replace(/\/$/, "") || "/";
        // Also active for anything under the item — /galeria/kwiatowe keeps
        // GALERIA marked. The `itemPath !== "/"` guard is what stops the home
        // link claiming every page on the site.
        const isActive =
          currentPath === itemPath ||
          (itemPath !== "/" && currentPath.startsWith(`${itemPath}/`));

        return (
          <li key={item.link}>
            <Link
              to={item.link}
              onClick={onNavigate}
              className={`${linkClassName} ${
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
  );
}

/**
 * PL | EN | DE.
 *
 * These links were 17x12, 18x12 and 12x12 px — under the WCAG 2.5.8 minimum of
 * 24x24 — because they carried no `text-*` class and so inherited the 10px root
 * size. They are the only way to change language on the site. The "|"
 * separators used to sit *inside* the anchors, making them part of the link
 * text and target; they are now aria-hidden siblings.
 *
 * `linkClassName` carries `pb-2` in the header row, mirroring the `pb-2` the
 * main nav links use to hold their active underline clear of the text. Without
 * it the two groups sit in boxes the row centres identically, but the nav
 * labels are lifted 5px inside theirs and these are not, so the switcher reads
 * as sitting low. In the panel there is no row to match, so it is empty.
 */
function LanguageLinks({
  pathname,
  locale,
  listClassName,
  linkClassName,
  onNavigate,
}) {
  return (
    <ul className={listClassName}>
      {LANGUAGES.map((lang, index) => (
        <li key={lang.code} className="flex items-center">
          <Link
            to={getLocalizedPath(pathname, lang.code)}
            onClick={onNavigate}
            hrefLang={lang.code}
            aria-current={locale === lang.code ? "true" : undefined}
            className={`text-14 inline-flex items-center justify-center min-w-[24px] min-h-[24px] px-1 ${linkClassName} ${
              locale === lang.code ? "font-black" : ""
            }`}
          >
            {lang.label}
          </Link>
          {index < LANGUAGES.length - 1 && (
            <span
              aria-hidden="true"
              className={`text-14 text-gray-accessible ${linkClassName}`}
            >
              |
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const locale = getLocaleFromPath(pathname);
  const content = useContent();
  const settings = content?.settings;
  /*
    The open menu is stored as the path it was opened on, not as a boolean, so
    that "close on navigation" is derived rather than synchronised. The panel
    does not unmount by itself when a link inside it is followed — Remix swaps
    the page underneath and the menu would otherwise stay open over the new
    route — and an effect watching `pathname` to call setState is both a lint
    error here and a render-then-correct round trip. This closes on Back and
    Forward too, which a click handler alone would miss.
  */
  const [menuOpenedAt, setMenuOpenedAt] = useState(null);
  const menuOpen = menuOpenedAt === pathname;
  const closeMenu = () => setMenuOpenedAt(null);

  /*
    The panel gets Escape-to-close, a scroll lock, a focus trap and focus
    restored to the hamburger — the same hook both modals use. A navigation
    panel that Tab walks out of, behind an opaque overlay, is the version of
    this control that ships most often.
  */
  const panelRef = useModalBehaviour(menuOpen, closeMenu);

  /*
    Close it if the viewport grows past the breakpoint while it is open. The
    panel is mobile-only, and leaving it mounted at tablet width would hold the
    scroll lock and the focus trap over a layout that already shows the nav.
    Only the `change` event, never a call in the effect body: the button that
    opens this is itself hidden from 608px up, so there is no already-too-wide
    case to catch on mount.
  */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const wideEnough = window.matchMedia("(min-width: 608px)");
    const close = () => setMenuOpenedAt(null);
    wideEnough.addEventListener("change", close);
    return () => wideEnough.removeEventListener("change", close);
  }, [menuOpen]);

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

        The padding is CHROME_FRAME — 32px on mobile, 48px from tablet up, and
        the same value the footer and the menu panel use. Both are arbitrary
        values rather than scale steps: the spacing scale in tailwind.config.js
        is built on 1rem = 10px, so it has neither a 3.2rem nor a 4.8rem entry,
        and rounding to `px-12` (30px) or `px-16` (40px) would not be the number
        asked for.
      */}
      <div className={CHROME_FRAME}>
        {/*
          From 608px up: wordmark, main nav, language switcher, on one row.
          Below it: wordmark and a menu button, with the other two moved into
          the panel that button opens.

          The row is where the breakpoint had to land. At 260px this padding
          leaves 196px of usable width, and the four nav labels alone come to
          about 253px — they used to wrap onto their own lines, which worked but
          spent a third of a small screen on navigation before any content.
        */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <div className="shrink-0 mr-auto">
            <HomeLink locale={locale} settings={settings} />
          </div>

          <nav
            aria-label={settings?.a11y.mainNav}
            className="hidden tablet:block"
          >
            <NavLinks
              items={navItems}
              currentPath={normalizedPathname}
              listClassName="flex flex-wrap items-center gap-x-6 gap-y-2 tablet:gap-x-8"
              linkClassName="text-center uppercase text-14 pb-2 inline-flex items-center min-h-[24px] hover:text-black"
            />
          </nav>

          <nav
            className="hidden tablet:flex shrink-0"
            aria-label={settings?.a11y.langNav}
          >
            <LanguageLinks
              pathname={pathname}
              locale={locale}
              listClassName="flex ml-auto items-center"
              linkClassName="pb-2"
            />
          </nav>

          {/*
            Icon-only, so the sr-only span is the button's whole accessible name
            — there is no room for a visible "MENU" beside the wordmark at
            260px. `justify-end` rather than `justify-center`: the target is
            44x44 for the finger, but the bars themselves line up with the page
            padding instead of floating 13px inside it.

            `aria-haspopup="dialog"` rather than `aria-controls`: the panel does
            not exist in the DOM until it opens, and pointing at an id that is
            not there is worse than not pointing at all.
          */}
          <button
            type="button"
            onClick={() => setMenuOpenedAt(pathname)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="tablet:hidden shrink-0 inline-flex items-center justify-end min-w-[44px] min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <MenuIcon aria-hidden="true" />
            <span className="sr-only">{settings?.a11y.openMenu}</span>
          </button>
        </div>
      </div>

      {/*
        The panel. Opaque and full-screen rather than a dropdown: at 260px a
        dropdown would cover the page anyway, and an opaque sheet needs no
        scrim, no z-index race with the splash, and no guesswork about what is
        still readable behind it.

        It repeats the header row — same padding, same wordmark, the close
        button where the menu button was — so opening it reads as the button
        changing rather than the page being replaced.
      */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background"
          role="dialog"
          aria-modal="true"
          aria-label={settings?.a11y.mainNav}
        >
          <div
            ref={panelRef}
            className={`${CHROME_FRAME} flex flex-col h-full py-8`}
          >
            <div className="flex items-center gap-x-4">
              <div className="shrink-0 mr-auto">
                <HomeLink locale={locale} settings={settings} />
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="shrink-0 inline-flex items-center justify-end min-w-[44px] min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <CloseIcon aria-hidden="true" />
                <span className="sr-only">{settings?.a11y.close}</span>
              </button>
            </div>

            {/*
              No <nav> around this list. The dialog is already labelled with the
              same string, and a landmark inside a modal announces a second
              "navigation, main navigation" for one set of four links.

              `gap-y-8` is 20px between the links' 44px boxes, so the four sit on
              a 64px rhythm rather than the 49px they started at. The labels came
              down from 18 to 16 to 14 as that air went in — at 20px of spacing
              each one reads as its own target without the size doing the
              separating, and 14 is what the same four links are set in on the
              header row from 608px up.
            */}
            <NavLinks
              items={navItems}
              currentPath={normalizedPathname}
              onNavigate={closeMenu}
              listClassName="flex flex-col items-start gap-y-8 mt-16"
              linkClassName="uppercase text-14 inline-flex items-center min-h-[44px] hover:text-black"
            />

            {/*
              `mt-auto` puts the language switcher at the foot of the panel,
              away from the four links a visitor is most likely reaching for.
            */}
            <nav className="mt-auto" aria-label={settings?.a11y.langNav}>
              <LanguageLinks
                pathname={pathname}
                locale={locale}
                onNavigate={closeMenu}
                listClassName="flex items-center"
                linkClassName=""
              />
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
