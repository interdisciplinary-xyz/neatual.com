import { createRequestHandler } from "@remix-run/express";

import {
  CONTENT_SECURITY_POLICY,
  STRICT_TRANSPORT_SECURITY,
  UNCONDITIONAL_HEADERS,
} from "./app/lib/securityHeaders.js";
import compression from "compression";
import express from "express";

const isProduction = process.env.NODE_ENV === "production";

const viteDevServer = isProduction
  ? null
  : await import("vite").then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
      })
    );

// Applies to `pnpm start`, the CI smoke job and the Lighthouse run — every
// place the Express server actually serves the app. It does NOT apply in
// production: Vercel serves the built Remix app through its own adapter and
// never loads this file, so the same headers are restated in vercel.json. See
// the note at the top of app/lib/securityHeaders.js.
function securityHeaders(req, res, next) {
  for (const [name, value] of Object.entries(UNCONDITIONAL_HEADERS)) {
    res.setHeader(name, value);
  }

  // Production-only: Vite's dev server needs eval and an HMR websocket, both
  // of which this policy blocks.
  if (isProduction) {
    res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }

  // HSTS only over a genuinely secure request. Chrome treats localhost as a
  // trustworthy origin, so sending this from a local production build can pin
  // *localhost* to https in the developer's browser for two years — which
  // breaks every other local project on the machine, and is not undone by
  // removing the header.
  //
  // `req.secure` alone, deliberately: it already accounts for
  // `x-forwarded-proto`, but only from a hop Express has been told to trust
  // (see the trust-proxy block below). Reading the raw header here instead
  // would honour it from any direct client, which is what makes the check
  // spoofable.
  if (isProduction && req.secure) {
    res.setHeader("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  }

  next();
}

const app = express();

// A proxy that terminates TLS upstream leaves `req.secure` false, so the HSTS
// check in securityHeaders cannot fire without this.
//
// The Railway arm is gone: Vercel is the deploy target (see
// docs/deploy.md), and Railway was one of three hosts this repo used to hedge
// across. Kept in some form anyway, rather than deleted outright, because
// `pnpm start` behind a local reverse proxy is a real way to run this file —
// that case opts in with TRUST_PROXY=1.
//
// NOT `true`, which trusts X-Forwarded-* from any client: a direct request
// could then claim `x-forwarded-proto: https` and pull back an HSTS header —
// the localhost-pinning hazard securityHeaders exists to avoid — and it would
// also make req.ip attacker-controlled for anything added later that reads it.
// Enabled only when a platform known to sit in front of us is detected, or
// when a deployment opts in explicitly, and then for exactly one hop.
const TRUST_PROXY_HOPS = 1;
const isBehindKnownProxy =
  process.env.TRUST_PROXY === "1" || Boolean(process.env.VERCEL);

if (isBehindKnownProxy) {
  app.set("trust proxy", TRUST_PROXY_HOPS);
}

// Version disclosure; nothing downstream reads it.
app.disable("x-powered-by");

// Nothing compressed responses before this: the 187 kB client chunk went out
// at full size on every load. ~200 kB per page load, per Lighthouse.
app.use(compression());

app.use(securityHeaders);

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite content-hashes everything under /assets, so those URLs are immutable
  // by construction and safe to cache for a year. Everything else in
  // build/client — favicon, gallery images, robots.txt — keeps a stable URL
  // across deploys, so it gets a short TTL it can actually revalidate against.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  // The webfonts are versioned by filename (family-weight-subset) and their
  // bytes only change when scripts/fetch-fonts.mjs is re-run against a new
  // release of the family — at which point the filename is what an editor
  // would change. Treating them like /assets rather than like the gallery
  // photographs, which keep a stable URL while their contents are replaced.
  app.use(
    "/fonts",
    express.static("build/client/fonts", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : await import("./build/server/index.js");

app.all("*", createRequestHandler({ build }));

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT}`);
});
