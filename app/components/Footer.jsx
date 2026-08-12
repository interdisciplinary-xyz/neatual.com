import { Link, useLocation } from "@remix-run/react";
import { useContent, navItemsFrom } from "../lib/useContent";

export function Footer() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, "") || "/";
  const content = useContent();
  const navItems = navItemsFrom(content);

  return (
    <footer className="fixed bottom-0 left-0 py-8 w-full bg-background tablet:py-20 z-10">
      {/*
        `desktop:max-w-[800px]` is what actually spaces the items apart. The <ul>
        below is `justify-around`, so it always distributes the container's free
        space across the row — adding padding or a gap to the items just converts
        that free space into padding and the separation barely changes. Widening
        the container is the only lever that gives the row more space to hand out.

        Still narrower than the 1114px the rest of the page uses: at full page
        width four short labels drift so far apart they stop reading as one nav.

        `tablet:max-w-lg` used to sit here too, immediately overridden by
        `tablet:max-w-[608px]` on the same breakpoint. Removed — it never applied.
      */}
      <nav
        className="mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[800px] mx-auto px-4"
        aria-label={content?.settings.a11y.mainNav}
      >
        <ul className="flex mobile:justify-around">
          {navItems.map((item) => {
            const itemPath = item.link.replace(/\/$/, "") || "/";
            const isActive = pathname === itemPath;

            return (
              <li key={item.link}>
                <Link
                  to={item.link}
                  className={`text-center uppercase text-14 px-2 tablet:px-5 pb-2 hover:text-black ${
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
    </footer>
  );
}
