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
});
