import { LogoIcon } from "./icons";
import { BRAND } from "../lib/inlineCopy";

/**
 * The first-visit splash, shown once per session.
 *
 * Server-rendered as the first child of <body> rather than injected from an
 * effect: a JS-mounted overlay appears *after* the page it is meant to cover,
 * which reads as a flash of content followed by a grey sheet — worse than no
 * splash at all.
 *
 * Nothing dismisses it from JavaScript. The exit is a pure CSS keyframe (see
 * `.splash` in tailwind.css), so a script error, a blocked bundle or a failed
 * hydration cannot strand a visitor under an opaque layer. The only JS involved
 * is the inline <head> script in root.jsx, and its sole job is to *suppress*
 * this on later navigations — if it never runs, the splash still self-dismisses.
 *
 * `aria-hidden` because it is decorative. The real page is already in the
 * accessibility tree behind it, so screen-reader and keyboard users are never
 * gated on the animation finishing, and there is nothing focusable in here to
 * trap a tab.
 *
 * The wordmark arrives as a prop rather than through useContent(): this renders
 * before anything else on the page and must not depend on a router context, and
 * the default keeps it rendering in isolation — which is how the spec exercises
 * it. root.jsx passes the CMS value.
 */
export function SplashScreen({ wordmark = BRAND.wordmark }) {
  return (
    <div className="splash" aria-hidden="true">
      <LogoIcon className="splash-mark" />
      <span className="splash-wordmark font-logo">{wordmark}</span>
    </div>
  );
}
