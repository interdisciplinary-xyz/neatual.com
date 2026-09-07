import { randomBytes } from "node:crypto";
import { PassThrough } from "node:stream";

import { createElement } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";

import { NonceProvider } from "./lib/nonce";
import { contentSecurityPolicy } from "./lib/securityHeaders.js";

/**
 * This file exists for one reason: the Content-Security-Policy needs a fresh
 * nonce on every response, and a nonce cannot be expressed anywhere else.
 *
 * ## Why not vercel.json, where the rest of the headers live
 *
 * `vercel.json`'s header table is static JSON evaluated once at deploy time. It
 * has no per-request anything, so it can state `'unsafe-inline'` or it can state
 * a fixed nonce that is the same for every visitor and therefore worth nothing.
 * Neither is a policy. The CSP has moved out of that table and is set here, on
 * the response, by the code that renders the document the policy governs.
 *
 * That is a real narrowing and worth stating plainly: `vercel.json` applied its
 * headers to `/(.*)`, and this applies the CSP only to responses React Router
 * renders. Static assets under `/assets`, `/fonts` and `/gallery` are served by
 * the CDN and no longer carry one. CSP is a document-scoped policy — it governs
 * what a *page* may load and execute, and a stylesheet or a jpeg is not a
 * document — so nothing that was being enforced has stopped being enforced.
 * `frame-ancestors` was the one directive with a claim on non-documents, and
 * `X-Frame-Options: DENY` still covers every path from `vercel.json`.
 *
 * ## Why the render below is a copy
 *
 * `@vercel/react-router` ships a `handleRequest` and this app used it, by way
 * of the default entry the preset injects when no `app/entry.server.jsx`
 * exists. It builds the `<ServerRouter>` element itself, which leaves no seam
 * to wrap `NonceProvider` around. The body of this function is that adapter's
 * implementation, verbatim apart from the nonce — the isbot/`onAllReady` split
 * and the `streamTimeout + 1000` abort are theirs and should be re-synced with
 * it on upgrade, not re-derived.
 */

// Theirs, and the reason the abort below is +1000: the stream gets 5s to render
// and one more second to flush its rejected boundaries.
export const streamTimeout = 5_000;

/**
 * Dev serves through Vite's middleware, which needs `eval` and an HMR
 * websocket — both of which this policy blocks. Express has always gated the
 * CSP the same way (on `NODE_ENV`); this is the same gate, read at build time.
 */
const isProduction = import.meta.env.PROD;

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
  _loadContext,
  options
) {
  // 128 bits, base64. The only property that matters is that an attacker who
  // can inject markup cannot predict it, so this must be a CSPRNG — not
  // Math.random, and not anything derived from the request.
  const nonce = randomBytes(16).toString("base64");

  if (isProduction) {
    responseHeaders.set(
      "Content-Security-Policy",
      contentSecurityPolicy(nonce)
    );
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");
    // Ensure requests from bots and SPA Mode renders wait for all content to
    // load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    const readyOption =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      createElement(
        NonceProvider,
        { value: nonce },
        createElement(ServerRouter, {
          context: routerContext,
          url: request.url,
          // Read by <Scripts>, <Links> and <ScrollRestoration> off
          // FrameworkContext, without them being passed anything.
          nonce,
        })
      ),
      {
        ...options,
        nonce,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}
