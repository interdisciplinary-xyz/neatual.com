import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({
      // Remix 2 is in maintenance; React Router 7 is the continuation, and it
      // is the only thing that clears the four open advisories in
      // docs/audits/2026-08-10-security-dependency-audit.md — they are all
      // patched in react-router >= 7.18.0, which Remix 2 cannot use. Opting
      // into the future flags now de-risks that migration and silences five
      // build warnings nobody had triaged.
      //
      // Verified safe for this codebase before enabling: no useFetcher
      // anywhere (v3_fetcherPersist), no splat routes (v3_relativeSplatPath),
      // nine static routes and no dynamic discovery (v3_lazyRouteDiscovery).
      future: {
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,

        // v3_singleFetch is deliberately NOT enabled yet. It changes how
        // loader data is serialised and revalidated, and the root loader is
        // being rewritten to fetch CMS content as this lands. Turning both
        // over at once would make any breakage ambiguous. Enable it as its
        // own change once the CMS loader is settled — it is the last
        // remaining build warning.
      },
    }),
  ],
});
