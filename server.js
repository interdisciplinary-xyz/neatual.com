import { createRequestHandler } from "@remix-run/express";
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

// One style origin, one font origin, no third-party scripts, no XHR targets.
//
// `script-src` keeps 'unsafe-inline' because Remix serializes its hydration
// payload into an inline <script>; moving that to a nonce means threading one
// through entry.server and <Scripts nonce>. The policy still blocks every
// third-party script origin, which is where the actual risk lives on a site
// with no user input. Recorded rather than silently relaxed — see
// docs/audits/2026-08-10-security-dependency-audit.md.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Production-only: Vite's dev server needs eval and an HMR websocket, both
  // of which this policy blocks.
  if (isProduction) {
    res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }

  // HSTS only over a genuinely secure request. Chrome treats localhost as a
  // trustworthy origin, so sending this from a local production build can pin
  // *localhost* to https in the developer's browser for two years — which
  // breaks every other local project on the machine, and is not undone by
  // removing the header. Behind a proxy (Vercel, Railway, nginx) the TLS
  // terminates upstream, so trust the forwarded header there.
  const isSecure =
    req.secure || req.headers["x-forwarded-proto"] === "https";
  if (isProduction && isSecure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  next();
}

const app = express();

// Vercel/Railway/nginx terminate TLS upstream; without this req.secure is
// always false and the HSTS check in securityHeaders cannot fire.
app.set("trust proxy", true);

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
