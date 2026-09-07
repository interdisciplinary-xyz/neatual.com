import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect } from "vitest";

import {
  contentSecurityPolicy,
  STRICT_TRANSPORT_SECURITY,
  UNCONDITIONAL_HEADERS,
} from "../app/lib/securityHeaders.js";

/**
 * The security headers are applied twice — by server.js through Express, and
 * by vercel.json on the platform that actually serves production traffic. Two
 * mechanisms is not a choice: Vercel's header table is static JSON and cannot
 * express the `isProduction` / `req.secure` conditions Express can.
 *
 * Two copies of a value is exactly the drift this repo has been bitten by
 * before (the postal address in the CMS and in JSON-LD; the price ranges and
 * RATE_NUMBERS). This is the gate that keeps them equal. If it fails, the live
 * site is about to serve a different policy from the one the smoke job checks.
 *
 * The CSP is the one header that is NOT duplicated, as of v0.8.0: it carries a
 * per-request nonce, so it can only be set by the code that renders the
 * document. The suite below therefore has two jobs — keep the duplicated
 * headers in step, and keep the un-duplicated one out of the places that would
 * silently re-introduce a second, nonceless copy.
 */

// Resolved from the working directory, not import.meta.url: the specs run
// under jsdom, where import.meta.url is not a file: URL and readFileSync
// rejects it. Vitest always runs from the repo root.
const fromRoot = (name) => readFileSync(join(process.cwd(), name), "utf8");

const vercelConfig = JSON.parse(fromRoot("vercel.json"));

/** The single `/(.*)` header rule, flattened to a plain name -> value map. */
const applied = Object.fromEntries(
  vercelConfig.headers
    .flatMap((rule) => rule.headers)
    .map(({ key, value }) => [key, value])
);

describe("vercel.json header table", () => {
  it("applies its headers to every path", () => {
    expect(vercelConfig.headers).toHaveLength(1);
    expect(vercelConfig.headers[0].source).toBe("/(.*)");
  });

  it.each(Object.entries(UNCONDITIONAL_HEADERS))(
    "serves %s exactly as server.js does",
    (name, value) => {
      expect(applied[name]).toBe(value);
    }
  );

  it("serves the same Strict-Transport-Security as server.js", () => {
    expect(applied["Strict-Transport-Security"]).toBe(
      STRICT_TRANSPORT_SECURITY
    );
  });

  // The whole point of the nonce work. A static CSP here would be a second
  // policy header on every document response, and two CSP headers are enforced
  // as an intersection — so a stale `'unsafe-inline'` copy nobody maintains
  // would quietly become a constraint on the real one.
  it("states no Content-Security-Policy, which cannot be static", () => {
    expect(applied).not.toHaveProperty("Content-Security-Policy");
    expect(fromRoot("vercel.json")).not.toContain("default-src");
  });

  it("leaves nothing in the table that server.js does not also set", () => {
    const known = [
      ...Object.keys(UNCONDITIONAL_HEADERS),
      "Strict-Transport-Security",
    ];
    expect(Object.keys(applied).sort()).toEqual(known.sort());
  });
});

describe("server.js", () => {
  const source = fromRoot("server.js");

  it("takes its header values from the shared module rather than restating them", () => {
    expect(source).toContain('from "./app/lib/securityHeaders.js"');
    // A literal `max-age=` in server.js would mean a third copy of the value.
    expect(source).not.toMatch(/max-age=\d/);
    expect(source).not.toContain("default-src");
  });

  it("no longer sets a Content-Security-Policy of its own", () => {
    expect(source).not.toContain('res.setHeader("Content-Security-Policy"');
    expect(source).not.toContain("CONTENT_SECURITY_POLICY");
  });

  it("trusts exactly one proxy hop, and only on Vercel or an explicit opt-in", () => {
    expect(source).toContain("const TRUST_PROXY_HOPS = 1;");
    expect(source).toContain('process.env.TRUST_PROXY === "1"');
    expect(source).toContain("process.env.VERCEL");
    // Railway stopped being a candidate host when the target was pinned.
    expect(source).not.toContain("RAILWAY_ENVIRONMENT");
  });
});

describe("the Content-Security-Policy itself", () => {
  const policy = contentSecurityPolicy("TEST-NONCE");

  /** "script-src 'self' 'nonce-x'" -> "'self' 'nonce-x'" */
  const directive = (name) =>
    policy
      .split("; ")
      .find((d) => d.startsWith(`${name} `))
      ?.slice(name.length + 1);

  it("carries the nonce in both directives that can hold one", () => {
    expect(directive("script-src")).toContain("'nonce-TEST-NONCE'");
    expect(directive("style-src")).toContain("'nonce-TEST-NONCE'");
  });

  // The finding this policy was rewritten to close. `'unsafe-inline'` in
  // script-src is the one value that makes a CSP decoration rather than a
  // control: the script an attacker gets to inject is inline by construction.
  it("does not allow inline script under any spelling", () => {
    expect(directive("script-src")).not.toContain("'unsafe-inline'");
    expect(directive("script-src")).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("script-src-elem");
    expect(policy).not.toContain("script-src-attr");
  });

  // Inline STYLE survives, but only as an attribute — `style=""` cannot execute
  // anything, and two modals size themselves from browser measurements. An
  // injected <style> ELEMENT is blocked, which is the half that mattered.
  it("allows inline style attributes but not inline stylesheets", () => {
    expect(directive("style-src-attr")).toBe("'unsafe-inline'");
    expect(directive("style-src")).not.toContain("'unsafe-inline'");
  });

  it("keeps the origin lockdown the pentest signed off on", () => {
    expect(directive("default-src")).toBe("'self'");
    expect(directive("connect-src")).toBe("'self'");
    expect(directive("font-src")).toBe("'self'");
    expect(directive("img-src")).toBe("'self' data:");
    expect(directive("base-uri")).toBe("'self'");
    expect(directive("form-action")).toBe("'self'");
    expect(directive("frame-ancestors")).toBe("'none'");
    expect(directive("object-src")).toBe("'none'");
  });

  // 'strict-dynamic' would drop the 'self' allowlist on every browser that
  // understands it, and this app has one script origin and no third-party
  // loader to propagate trust through.
  it("does not reach for 'strict-dynamic'", () => {
    expect(policy).not.toContain("strict-dynamic");
  });

  it("has no third-party origin anywhere in it", () => {
    expect(policy).not.toMatch(/https?:\/\//);
  });
});

describe("app/entry.server.jsx", () => {
  const source = fromRoot("app/entry.server.jsx");

  it("is where the policy is set, and only in production", () => {
    // Whitespace-insensitive: Prettier wraps this call across four lines, and
    // the assertion is about what it does, not how it happens to be laid out.
    expect(source.replace(/\s+/g, " ")).toContain(
      'responseHeaders.set( "Content-Security-Policy", contentSecurityPolicy(nonce) );'
    );
    expect(source).toContain("import.meta.env.PROD");
  });

  // A predictable nonce is not a nonce. randomBytes is the CSPRNG; Math.random
  // and anything derived from the request would both defeat the whole exercise.
  it("draws the nonce from a CSPRNG", () => {
    expect(source).toContain('from "node:crypto"');
    expect(source).toContain("randomBytes(16)");
    expect(source).not.toMatch(/Math\.random\(/);
  });

  it("hands the nonce to both consumers", () => {
    // React Router's own inline scripts, via FrameworkContext.
    expect(source).toContain("ServerRouter");
    // The app's own, via app/lib/nonce.js.
    expect(source).toContain("NonceProvider");
  });
});

describe("app/root.jsx", () => {
  const source = fromRoot("app/root.jsx");

  // Every inline script this file writes by hand needs the nonce or it will
  // not run. Counted rather than merely grepped: a new one added without a
  // nonce is precisely the regression this guards.
  it("nonces every inline script it writes itself", () => {
    const inlineScripts = source.match(/<script\b(?![^>]*\bsrc=)/g) ?? [];
    const nonced = source.match(/nonce=\{nonce\}/g) ?? [];
    expect(inlineScripts.length).toBeGreaterThan(0);
    // One per inline script, plus the one on <ProgressProvider>.
    expect(nonced.length).toBe(inlineScripts.length + 1);
  });

  // @bprogress/react renders its stylesheet as an inline <style> element. It
  // takes a nonce prop for exactly this; without it the navigation bar loses
  // its styling under `style-src 'self'`.
  it("nonces the ProgressProvider stylesheet", () => {
    expect(source).toMatch(/<ProgressProvider[\s\S]*?nonce=\{nonce\}/);
  });

  it("reads the nonce from the context rather than a prop or a loader", () => {
    expect(source).toContain('import { useNonce } from "./lib/nonce"');
    expect(source).toContain("const nonce = useNonce();");
  });
});
