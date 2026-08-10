// Fails when `pnpm audit --prod` reports more advisories at any severity than
// the recorded baseline.
//
// A plain `--audit-level high` gate would be permanently red: the four open
// advisories are all in React Router, all patched only in react-router >=
// 7.18.0, and Remix 2 pins the 6.x line. See §1 of
// docs/audits/2026-08-10-security-dependency-audit.md. A gate that can never
// pass gets disabled, and then nothing checks dependencies at all — which is
// the state the audit found.
//
// So this tolerates exactly the known set and fails on anything new. When the
// React Router 7 migration lands, drop the baseline to zeros.
//
// Run: pnpm audit:check

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

// Recorded 10 August 2026 on Remix 2.17.5 / react-router 6.30.4:
//   high     1 — turbo-stream DoS via reflected user input
//   moderate 3 — react-router open redirect (x2) and deserializeErrors
//                constructor injection
const BASELINE = { critical: 0, high: 1, moderate: 3, low: 0 };

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
