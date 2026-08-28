/**
 * The site's security headers, in one place, because they now have to be
 * applied twice.
 *
 * ## Why twice
 *
 * `server.js` sets these through Express, and for the whole life of this repo
 * that looked like the end of the story: the CI smoke job boots `node
 * ./server.js` and asserts every one of them is present, and it passed.
 *
 * Vercel does not run `server.js`. The project's framework preset builds the
 * Remix app and serves it through Vercel's own adapter, so the Express app —
 * and every header it sets — is dead code in production. Measured on
 * 28 August 2026 against https://www.neatual.com/: no Content-Security-Policy,
 * no X-Content-Type-Options, no Referrer-Policy, no X-Frame-Options, and an
 * HSTS header of `max-age=63072000` with neither `includeSubDomains` nor
 * `preload` — Vercel's own default, not the one below. The smoke job was green
 * on headers the live site had never served.
 *
 * So the values live here, `server.js` imports them, and `vercel.json`
 * restates them for the platform that actually serves traffic. Two mechanisms,
 * necessarily — Vercel's header table is static JSON and cannot express the
 * `isProduction`/`req.secure` conditions Express can. A test asserts the two
 * agree, so the copy in `vercel.json` cannot drift from the copy here without
 * failing CI.
 */

/**
 * One style origin, one font origin, no third-party scripts, no XHR targets.
 *
 * `script-src` keeps 'unsafe-inline' because Remix serializes its hydration
 * payload into an inline <script>; moving that to a nonce means threading one
 * through entry.server and <Scripts nonce>. The policy still blocks every
 * third-party script origin, which is where the actual risk lives on a site
 * with no user input. Recorded rather than silently relaxed — see
 * docs/audits/2026-08-10-security-dependency-audit.md.
 *
 * No fonts.googleapis.com / fonts.gstatic.com: the webfonts are served from
 * public/fonts by scripts/fetch-fonts.mjs, so nothing on the critical path is
 * third-party and the two exceptions this policy used to carry are gone.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

/**
 * Two years, subdomains included, preload-eligible.
 *
 * Express sends this only when `req.secure`, because Chrome treats localhost
 * as a trustworthy origin and a local production build would otherwise pin
 * *localhost* to https in the developer's browser for two years — breaking
 * every other local project on the machine, and not undone by removing the
 * header. Vercel terminates TLS itself and never serves the site over plain
 * http, so `vercel.json` can state it unconditionally.
 */
export const STRICT_TRANSPORT_SECURITY =
  "max-age=63072000; includeSubDomains; preload";

/** Sent on every response, in every environment, by both mechanisms. */
export const UNCONDITIONAL_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};
