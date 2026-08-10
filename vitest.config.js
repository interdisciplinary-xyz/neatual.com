import { defineConfig } from "vitest/config";

// Deliberately does NOT load the Remix vite plugin. The plugin owns route
// discovery and the server build; pulling it into the test run makes every
// component spec depend on the whole framework pipeline. These are component
// and unit tests, so plain React + jsdom is the right surface.
export default defineConfig({
  // Without this, esbuild compiles JSX to React.createElement and every
  // component spec dies with "React is not defined" — the app itself never
  // imports React because the Remix plugin already uses the automatic runtime.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.js"],
    include: ["app/**/*.spec.{js,jsx}", "test/**/*.spec.{js,jsx}"],
    coverage: {
      provider: "v8",
      include: ["app/lib/**", "app/components/**"],
    },
  },
});
