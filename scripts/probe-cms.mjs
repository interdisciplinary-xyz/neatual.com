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
// Run: node --env-file-if-exists=.env scripts/probe-cms.mjs
//      node scripts/probe-cms.mjs --simulate-failure   (proves the alert path)

import {
  CONTENT_QUERY,
  cmsResponseProblem,
} from "../app/lib/content.server.js";
import { sanityClient, isSanityConfigured } from "../app/lib/sanity.js";

const SIMULATE = process.argv.includes("--simulate-failure");

/** Exits non-zero, which is the whole alerting mechanism — see the workflow. */
function fail(reason) {
  console.error(`FAIL  ${reason}`);
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

const problem = cmsResponseProblem(data);
if (problem) fail(`Sanity answered, but the response is unusable — ${problem}`);

console.log(
  `ok    CMS answered in ${Date.now() - started} ms: ` +
    `${data.pages.length} pages, ${data.products.length} products, ` +
    `${data.services?.length ?? 0} services, siteSettings present.`
);
