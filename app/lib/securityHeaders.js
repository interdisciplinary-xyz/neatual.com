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
 * app and serves it through Vercel's own adapter, so the Express app —
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
 *
 * ## The CSP is the exception, as of v0.8.0
 *
 * It is no longer in either of those two places. A nonce has to be different on
 * every response or it is not a nonce, and neither a static JSON table nor an
 * Express middleware that runs before the renderer can produce one that the
 * document's own scripts will carry. `app/entry.server.jsx` sets it, on the
 * response, in the same function that renders the markup it governs — one
 * mechanism, and the drift this module exists to prevent cannot arise for it.
 */

/**
 * One style origin, one font origin, no third-party scripts, no XHR targets.
 *
 * ## script-src: a nonce, and no `'unsafe-inline'`
 *
 * This used to read `script-src 'self' 'unsafe-inline'`, because React Router
 * serializes its hydration payload into an inline `<script>` and nothing was
 * threading a nonce through to it. The 6 September 2026 pentest called that the
 * weakest CSP in the portfolio and it was right: `'unsafe-inline'` is the one
 * directive value that turns a CSP into decoration, because the injected script
 * an attacker gets to write is inline by construction.
 *
 * The plumbing turned out to be short. `<ServerRouter nonce>` puts the value on
 * React Router's `FrameworkContext`, and `<Scripts>`, `<Links>` and
 * `<ScrollRestoration>` read it from there unprompted — the framework's inline
 * scripts needed no changes at all. Only the two this repo writes by hand (the
 * JSON-LD block and the splash-suppression script in `app/root.jsx`) had to be
 * passed one, via `app/lib/nonce.js`.
 *
 * Note that a browser which honours the nonce ignores `'unsafe-inline'`
 * entirely when both are present, so there is no transition period to manage:
 * the moment a nonce appears, the old value stops meaning anything.
 *
 * ## style-src: split, because a nonce cannot reach a style attribute
 *
 * `'unsafe-inline'` is gone from `style-src` proper. That directive now takes
 * the same nonce as the scripts, so an injected `<style>` element is blocked
 * while the one legitimate inline stylesheet still loads: `<ProgressProvider>`
 * from `@bprogress/react` renders its CSS as an inline `<style>`, and takes a
 * `nonce` prop for precisely this case. Worth knowing that it does — grepping
 * `@bprogress/core` for style injection finds nothing, because the element is
 * rendered by the React wrapper and only shows up in the served HTML.
 *
 * `'unsafe-inline'` survives in `style-src-attr`, which governs `style=""`
 * attributes only — and those are not a script-execution primitive. It is a
 * split rather than a removal because two components genuinely need inline
 * style attributes: `ModalWithDetails` and `ModalSingleProduct` size themselves
 * from measurements taken in the browser, so the values do not exist until they
 * run. A nonce is no help there — nonces authorise elements, and a style
 * attribute is not an element.
 *
 * `style-src-attr` is CSP Level 3 (Chrome 75, Safari 15.4, Firefox 121). A
 * browser older than that ignores it and falls back to `style-src`, which no
 * longer admits inline — the two modals would open at their CSS default size
 * instead of their measured one. A cosmetic regression, on browsers more than
 * two years stale, in exchange for blocking injected stylesheets everywhere
 * else.
 *
 * ## What is deliberately absent
 *
 * No fonts.googleapis.com / fonts.gstatic.com: the webfonts are served from
 * public/fonts by scripts/fetch-fonts.mjs, so nothing on the critical path is
 * third-party and the two exceptions this policy used to carry are gone.
 *
 * No `'strict-dynamic'`. It would drop the `'self'` host allowlist on any
 * browser that understands it, and this app has exactly one script origin and
 * no third-party loader to trust-propagate through — it would buy nothing and
 * cost the fallback.
 *
 * @param {string} nonce Per-response, from a CSPRNG. See app/entry.server.jsx.
 * @returns {string} The policy, ready to set as a header value.
 */
export function contentSecurityPolicy(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

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
