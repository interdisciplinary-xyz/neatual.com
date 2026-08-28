import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// The four v3_* future flags this file used to carry are gone, not disabled:
// they were Remix 2's opt-in preview of React Router 7's behaviour, and in
// React Router 7 that behaviour is simply how it works. Enabling them before
// the migration is what made the migration small.
//
// v3_singleFetch was the one deliberately left off, on the grounds that
// changing loader serialisation while the root loader was being rewritten
// would make any breakage ambiguous. Single fetch is not optional in React
// Router 7, so that decision expires here rather than being reversed. It cost
// nothing to give up: the root loader already returns a plain object, no route
// exports `headers`, and nothing in the app called `json()` or `defer()` —
// which is what single fetch would have broken.
export default defineConfig({
  plugins: [reactRouter()],

  build: {
    rollupOptions: {
      // `sitemap[.]xml.js` is a resource route: it exports a loader and no
      // component, so it has nothing to send to the browser and Rollup emits
      // "Generated an empty chunk: sitemap_._xml" plus a 0.00 kB asset on
      // every build.
      //
      // Nothing is wrong — a resource route having no client bundle is the
      // point of a resource route — but a warning that is always there is a
      // warning nobody reads, and this build has real ones (the React Router
      // v8 future flags) worth being able to see. Silenced by name rather than
      // by turning the whole EMPTY_BUNDLE class off, so a genuinely empty
      // component route would still say so.
      onwarn(warning, warn) {
        if (
          warning.code === "EMPTY_BUNDLE" &&
          warning.names?.every((name) => name === "sitemap_._xml")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
