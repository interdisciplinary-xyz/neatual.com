import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, it, expect } from "vitest";

import { buildDocuments } from "../scripts/seed-documents.mjs";
import { PAGE_KEYS } from "../app/lib/seo.js";
import { SERVICES, PRODUCTS } from "../app/lib/inlineCopy.js";

/**
 * The probe's census compares the live dataset against `buildDocuments()` and
 * reports whatever the seed would write that is not there.
 *
 * Issue #26 is what these guard. The dataset was missing eight of eighteen
 * documents — two pages and every one of the six `service` documents — and the
 * alert said `missing pages: services, pricing` and nothing else, because
 * `cmsResponseProblem` returns on the first fault and the alert issue quoted a
 * static template rather than the run's own output. Both halves of that are
 * now load-bearing, so both are pinned here.
 */

const fromRoot = (name) => readFileSync(join(process.cwd(), name), "utf8");

describe("the seed is a usable yardstick for the census", () => {
  const ids = buildDocuments().map((doc) => doc._id);

  // A duplicate id would make `expected` overcount and the census would claim
  // a document is missing that a re-seed never writes separately.
  it("gives every document a distinct id", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The census can only report a document type it knows the seed writes. A
  // page key added to the app but not to the seed would be invisible to it —
  // which is exactly how six services went unreported for a month.
  it("writes one document per page key", () => {
    for (const key of PAGE_KEYS) expect(ids).toContain(`page-${key}`);
  });

  it("writes one document per service and per product", () => {
    expect(ids.filter((id) => id.startsWith("service-"))).toHaveLength(
      SERVICES.length
    );
    expect(ids.filter((id) => id.startsWith("product-"))).toHaveLength(
      PRODUCTS.length
    );
  });

  it("writes siteSettings", () => {
    expect(ids).toContain("siteSettings");
  });

  // byType() in the probe groups ids by the segment before the first hyphen.
  // That is only a readable grouping if the ids are actually shaped that way.
  it("names documents <type>-<slug>, which is what the census groups on", () => {
    for (const id of ids) {
      if (id === "siteSettings") continue;
      expect(id).toMatch(/^(page|product|service)-[a-z0-9-]+$/);
    }
  });
});

describe("scripts/probe-cms.mjs", () => {
  const source = fromRoot("scripts/probe-cms.mjs");

  // The whole point of the file's existing rationale: a probe with its own
  // idea of "complete" drifts from the thing it is checking. That applies to
  // the census as much as to cmsResponseProblem.
  it("derives the expected documents from the seed rather than listing them", () => {
    expect(source).toContain('from "./seed-documents.mjs"');
    expect(source).toContain("buildDocuments()");
    expect(source).not.toContain("page-services");
    expect(source).not.toContain("service-montaz");
  });

  it("still uses the app's own fallback predicate for the verdict", () => {
    expect(source).toContain("cmsResponseProblem");
    expect(source).toContain('from "../app/lib/content.server.js"');
  });

  // An unpublished draft is not content the site can read, so `drafts.x`
  // must not be counted as `x` being present.
  it("does not count a draft as a published document", () => {
    expect(source).toContain('"drafts."');
  });

  // The failure the old probe could not report at all: services fall back
  // per-field, so the response stays "usable" while six pages are served from
  // bundled copy.
  it("fails on an incomplete dataset even when the response is usable", () => {
    expect(source).toContain(
      "Sanity answered and the site will use it, but the dataset is incomplete"
    );
  });

  it("says what to run to fix it", () => {
    expect(source).toContain("seed:sanity:import");
  });
});

describe(".github/workflows/cms-probe.yml", () => {
  const workflow = fromRoot(".github/workflows/cms-probe.yml");

  // Without this the census output dies in the run log and the issue says
  // only "something failed" — which is what #26 said.
  it("captures both checks' output", () => {
    expect(workflow).toContain("tee probe.log");
    expect(workflow).toContain("tee content-check.log");
  });

  // `tee` returns 0 even when the probe exits 1, so without pipefail a failing
  // probe would be reported as a passing step.
  it("keeps the probe's exit status through the pipe", () => {
    const teeLines = workflow
      .split("\n")
      .filter((line) => line.includes("tee "));
    expect(teeLines.length).toBeGreaterThan(0);
    expect(workflow.match(/set -o pipefail/g) ?? []).toHaveLength(2);
  });

  it("quotes both captures into the alert issue", () => {
    expect(workflow).toContain("section probe.log");
    expect(workflow).toContain("section content-check.log");
  });

  // content:check can emit hundreds of lines; an unbounded body would push the
  // recovery command out of sight, and GitHub caps issue bodies at 65536.
  it("caps how much it pastes", () => {
    expect(workflow).toMatch(/head -c \d+/);
  });
});
