// Fails when `pnpm audit --prod` reports more advisories at any severity than
// the recorded baseline.
//
// The baseline used to tolerate four advisories that could not be fixed: they
// were all in React Router, all patched only in react-router >= 7.18.0, and
// Remix 2 pinned the 6.x line. A gate that can never pass gets disabled, and
// then nothing checks dependencies at all — which is the state the first audit
// found. Tolerating exactly the known set was the way to keep the gate alive.
//
// The React Router 7 migration has landed, so the baseline is zeros, as the
// note here always said it should become. It is now an absolute gate: any
// advisory at any severity fails the build.
//
// Run: pnpm audit:check

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Zero, on react-router 7.18.3. The four advisories cleared by three separate
// mechanisms, none of which was a version bump on the vulnerable package:
//   high     turbo-stream DoS — turbo-stream stopped being a react-router
//            dependency at 7.9.0 and is no longer in the tree at all
//   moderate react-router open redirect (x2) and deserializeErrors constructor
//            injection — patched in 7.18.0
//   moderate react-router-dom open redirect, which had no patched release —
//            react-router-dom was collapsed into react-router in 7.0.0, so the
//            package left the tree rather than being fixed
const BASELINE = { critical: 0, high: 0, moderate: 0, low: 0 };

const { stdout } = await run("pnpm", ["audit", "--prod", "--json"], {
  maxBuffer: 32 * 1024 * 1024,
  // pnpm exits non-zero when advisories exist, which is the normal case here.
}).catch((error) => ({ stdout: error.stdout ?? "" }));

let counts;
try {
  counts = JSON.parse(stdout).metadata.vulnerabilities;
} catch {
  console.error("Could not parse `pnpm audit --prod --json` output.");
  process.exit(1);
}

const severities = Object.keys(BASELINE);
const regressions = severities.filter((s) => (counts[s] ?? 0) > BASELINE[s]);

for (const severity of severities) {
  const found = counts[severity] ?? 0;
  const allowed = BASELINE[severity];
  const verdict =
    found > allowed ? "REGRESSION" : found < allowed ? "improved" : "ok";
  console.log(
    `  ${severity.padEnd(9)} ${String(found).padStart(3)}  (baseline ${allowed})  ${verdict}`
  );
}

if (regressions.length > 0) {
  console.error(
    `\nNew advisories above baseline: ${regressions.join(", ")}.\n` +
      "Triage with `pnpm audit --prod` and `pnpm why <package>`. If the new " +
      "advisory is genuinely unfixable, raise the baseline in this file in the " +
      "same commit that explains why."
  );
  process.exit(1);
}

const improved = severities.filter((s) => (counts[s] ?? 0) < BASELINE[s]);
if (improved.length > 0) {
  console.log(
    `\nFewer advisories than baseline (${improved.join(", ")}). ` +
      "Lower the baseline in this file so the gate keeps its teeth."
  );
}

console.log("\nDependency audit within baseline.");
