import { useRouteLoaderData } from "react-router";
import { PAGE_KEYS } from "./seo";

/**
 * CMS content for the current request. Fetched once in the root loader, so
 * components read it from there rather than each fetching their own copy —
 * which also means the locale re-export routes need no loader of their own.
 */
export function useContent() {
  return useRouteLoaderData("root")?.content;
}

/** Nav in authored order (home, gallery, contact), not whatever order GROQ returned. */
export function navItemsFrom(content) {
  if (!content) return [];
  return PAGE_KEYS.map((pageKey) => ({
    link: content.pages[pageKey].path,
    label: content.pages[pageKey].navLabel,
  }));
}
