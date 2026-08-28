import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect } from "vitest";

import {
  CONTENT_SECURITY_POLICY,
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

  it("serves the same Content-Security-Policy as server.js", () => {
    expect(applied["Content-Security-Policy"]).toBe(CONTENT_SECURITY_POLICY);
  });

  it("serves the same Strict-Transport-Security as server.js", () => {
    expect(applied["Strict-Transport-Security"]).toBe(
      STRICT_TRANSPORT_SECURITY
    );
  });

  it("leaves nothing in the table that server.js does not also set", () => {
    const known = [
      ...Object.keys(UNCONDITIONAL_HEADERS),
      "Content-Security-Policy",
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

  it("trusts exactly one proxy hop, and only on Vercel or an explicit opt-in", () => {
    expect(source).toContain("const TRUST_PROXY_HOPS = 1;");
    expect(source).toContain('process.env.TRUST_PROXY === "1"');
    expect(source).toContain("process.env.VERCEL");
    // Railway stopped being a candidate host when the target was pinned.
    expect(source).not.toContain("RAILWAY_ENVIRONMENT");
  });
});
