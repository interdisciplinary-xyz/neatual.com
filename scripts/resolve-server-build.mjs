// Finds the built server entry, wherever this build put it.
//
// Remix emitted `build/server/index.js`, and server.js, deploy.sh and the CI
// artifact assertion all hardcoded that path. The Vercel preset builds one
// bundle per configured runtime and names the directory after a base64 of the
// runtime options, so the same file is now at
// `build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/index.js` — a path nothing
// should be typing out, and one that would change if the runtime config did.
//
// So it is resolved rather than written down, in one place, by everything that
// needs it. Returns an absolute path and throws with a useful message if the
// build is missing, which is the failure the CI assertion exists to catch.

import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const SERVER_DIR = "build/server";

export function resolveServerBuild(root = process.cwd()) {
  const dir = resolve(root, SERVER_DIR);

  // The flat layout, in case the preset is ever dropped.
  const flat = join(dir, "index.js");
  if (existsSync(flat)) return flat;

  if (!existsSync(dir)) {
    throw new Error(
      `No server build: ${SERVER_DIR} does not exist. Run \`pnpm build\`.`
    );
  }

  const nested = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name, "index.js"))
    .filter(existsSync);

  if (nested.length === 1) return nested[0];
  if (nested.length === 0) {
    throw new Error(
      `No server build: nothing matching ${SERVER_DIR}/*/index.js. Run \`pnpm build\`.`
    );
  }
  // More than one runtime configured. Nothing does that today, and picking one
  // silently would mean booting a bundle built for somewhere else.
  throw new Error(
    `Ambiguous server build — ${nested.length} runtimes present:\n  ${nested.join("\n  ")}\n` +
      "server.js can only boot one. Name it explicitly rather than guessing."
  );
}

// `node scripts/resolve-server-build.mjs` prints the path, which is how the
// shell callers (deploy.sh, the CI assertion) use it.
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(resolveServerBuild());
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
