// Asks, from outside the request path, whether the CMS can still answer.
//
// ## Why this exists
//
// getContent() never throws. A Sanity outage degrades to the bundled copy in
// app/lib/locales.js and the site keeps serving correct-looking pages — which
// is the right behaviour for a visitor and the worst possible behaviour for
// whoever is editing, because every change in the Studio silently does
// nothing. The only signal was one `console.warn` per process, to a stdout
// nobody tails, on a platform whose logs are not shipped anywhere.
//
// The failure mode is measured in days, not minutes: nothing breaks, nothing
// 500s, no budget moves. So the check has to be a schedule, not an alert on an
// error that never surfaces.
//
// ## Why it imports the app rather than reimplementing the check
//
// `cmsResponseProblem` is the exact predicate getContent() uses to decide
// whether to fall back. A probe with its own idea of "complete" would drift
// from it and start passing while the site fell back — a broken smoke detector
// is worse than none, because it is also an assurance.
//
// Deliberately NOT checking that a known string appears on the live page: the
// CMS and the bundled fallback are kept byte-identical on purpose (`pnpm
// content:check` fails on drift), so there is no string whose presence
// distinguishes them. What distinguishes them is whether Sanity answered.
//
// ## Why it also takes a census
//
// `cmsResponseProblem` answers one question — will getContent() fall back? —
// and it is the right question, because that is the switch that makes the
// Studio stop mattering. But it returns on the FIRST fault it finds, and one
// class of fault it cannot report at all: `fromSanity` falls back to the
// bundled set per-field when the `service` documents are absent, precisely so a
// dataset predating them does not serve six empty URLs. That is the correct
// render, and it means six pages can be driven by bundled copy while the
// predicate says everything is fine.
//
// So the probe additionally compares the dataset against `buildDocuments()` —
// the same builder `pnpm seed:sanity` writes from, imported rather than
// restated for the reason given above. Anything it would write that is not
// there is content the Studio is not driving, whoever falls back for it.
//
// Run: node --env-file-if-exists=.env scripts/probe-cms.mjs
//      node scripts/probe-cms.mjs --simulate-failure   (proves the alert path)

import {
  CONTENT_QUERY,
  cmsResponseProblem,
} from "../app/lib/content.server.js";
import { sanityClient, isSanityConfigured } from "../app/lib/sanity.js";
import { buildDocuments } from "./seed-documents.mjs";

const SIMULATE = process.argv.includes("--simulate-failure");

/**
 * Which documents the seed would write that the dataset does not have.
 *
 * Draft ids (`drafts.<id>`) are normalised away: an unpublished draft is not
 * content the site can read, so a document that exists only as a draft counts
 * as missing — which is exactly how it behaves.
 */
async function census() {
  const expected = buildDocuments().map((doc) => doc._id);
  const present = new Set(
    (await sanityClient.fetch(`*[]._id`)).map((id) =>
      id.startsWith("drafts.") ? id.slice("drafts.".length) : id
    )
  );
  return {
    expected: expected.length,
    present: present.size,
    missing: expected.filter((id) => !present.has(id)),
  };
}

/** Groups `page-home, service-x, service-y` into `page (1), service (2)`. */
const byType = (ids) =>
  Object.entries(
    ids.reduce((acc, id) => {
      const type = id.split("-")[0];
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, n]) => `${type} (${n})`)
    .join(", ");

/**
 * Exits non-zero, which is the whole alerting mechanism — see the workflow.
 *
 * `detail` carries the census when there is one. The point is that the issue
 * this opens should say what to do, not just that something is wrong: the
 * previous version reported `missing pages: services, pricing` against a
 * dataset that was in fact missing eight of eighteen documents, including
 * every `service`. Two of those are the ones that trip the fallback; all eight
 * are the ones a re-seed has to restore.
 */
function fail(reason, detail = "") {
  console.error(`FAIL  ${reason}`);
  if (detail) console.error(detail);
  console.error(
    "\nThe site is still up. It is serving the bundled copy from " +
      "app/lib/locales.js, so every edit made in the Studio since this " +
      "started is not visible to anyone.\n" +
      "Check https://www.sanity.io/manage/project/kyyf7nu9 and the Vercel " +
      "runtime logs for `[content] Falling back`."
  );
  process.exit(1);
}

if (SIMULATE) {
  console.log("Simulating a failed CMS fetch to exercise the alert path.\n");
  fail("simulated failure (--simulate-failure)");
}

if (!isSanityConfigured) {
  fail("SANITY_STUDIO_PROJECT_ID is not set — the probe cannot reach Sanity");
}

const started = Date.now();
let data;
try {
  data = await sanityClient.fetch(CONTENT_QUERY);
} catch (error) {
  fail(`Sanity request failed: ${error.message}`);
}

const elapsed = Date.now() - started;
const problem = cmsResponseProblem(data);

let counted;
try {
  counted = await census();
} catch (error) {
  // The census is diagnosis, not the check. If it cannot run, the probe still
  // has to report the verdict it came for.
  counted = null;
  console.error(`warn  could not take a document census: ${error.message}`);
}

const shortfall =
  counted && counted.missing.length
    ? `\n${counted.missing.length} of ${counted.expected} documents the seed ` +
      `would write are not in the dataset — ${byType(counted.missing)}:\n` +
      counted.missing.map((id) => `  - ${id}`).join("\n") +
      "\n\nRestore them with `pnpm exec sanity login && pnpm " +
      "seed:sanity:import`, then `pnpm content:check` to confirm the fields " +
      "match the code."
    : "";

if (problem) {
  fail(`Sanity answered, but the response is unusable — ${problem}`, shortfall);
}

// Reached only when getContent() would use Sanity. A shortfall here is the
// quieter failure: the site renders correctly, from bundled copy, for content
// an editor believes they are editing in the Studio.
if (shortfall) {
  fail(
    "Sanity answered and the site will use it, but the dataset is incomplete",
    shortfall
  );
}

console.log(
  `ok    CMS answered in ${elapsed} ms: ` +
    `${data.pages.length} pages, ${data.products.length} products, ` +
    `${data.services?.length ?? 0} services, siteSettings present` +
    (counted ? `; ${counted.present} documents, none missing.` : ".")
);
