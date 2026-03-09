import { Link, useLocation } from "@remix-run/react";
import { LOCALES, getLocaleFromPath } from "../lib/locales";

export function Footer() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/";
  const locale = getLocaleFromPath(pathname);
  const config = LOCALES[locale];

  return (
    <footer className="fixed bottom-0 left-0 py-8 w-full bg-background tablet:pb-20 z-10">
      <nav className="tablet:mx-auto tablet:max-w-lg mobile:max-w-[260px] tablet:max-w-[608px] mx-auto px-4" aria-label={locale === "pl" ? "Nawigacja główna" : locale === "en" ? "Main navigation" : "Hauptnavigation"}>
        <ul className="flex mobile:justify-around">
          {config.navItems.map((item) => {
            const itemPath = item.link.replace(/\/$/, "") || "/";
            const isActive = pathname === itemPath;

            return (
              <li key={item.link}>
                <Link
                  to={item.link}
                  className={`text-center uppercase text-14 px-2 pb-2 hover:text-black ${
                    isActive ? "text-black border-b-2 border-black" : "text-gray-accessible"
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
    </footer>
  );
}
