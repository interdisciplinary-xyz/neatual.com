// The config used to extend `eslint:recommended` alone — no react, no
// react-hooks, no jsx-a11y. `pnpm lint` passed with zero output while the site
// shipped `<li role="button">`, click-only list items and an aria-label that
// contradicted its own visible text. Every §3 finding in
// docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md was structurally out of its
// reach. jsx-a11y alone would have caught the tile-role defect.
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // This codebase does not use PropTypes anywhere; it is plain JS with no
    // type layer. Turning the rule on would mean ~40 annotations that check
    // nothing at runtime in production builds.
    "react/prop-types": "off",
  },
  ignorePatterns: ["build", "node_modules", "public"],
};
