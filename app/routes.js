import { flatRoutes } from "@react-router/fs-routes";

// Route discovery was implicit in Remix; React Router 7 makes it a file you
// opt into. `flatRoutes()` is the same convention the 22 modules in app/routes
// are already named for — `de.galerie_.$slug.jsx`, `sitemap[.]xml.js`, the
// `_index` suffix — so nothing in that directory changes.
//
// The alternative is listing every route by hand in this file. That would be a
// second place for a route to exist, and the sitemap already derives its URLs
// from app/lib/seo.js; a third source would be one more thing to keep in step.
export default flatRoutes();
