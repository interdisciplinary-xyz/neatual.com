import { createClient } from "@sanity/client";
import { DEFAULT_LOCALE } from "./seo.js";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const apiVersion = process.env.SANITY_STUDIO_API_VERSION || "2026-08-10";

// Until a Sanity project exists the site keeps rendering from app/lib/locales.js.
// Every caller must handle a null client rather than assume content is available.
export const isSanityConfigured = Boolean(projectId);

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === "production",
      perspective: "published",
    })
  : null;

// Field-level localization stores each translatable field as { pl, en, de }.
// Falls back to Polish so a half-translated document renders rather than blanks.
export function localized(field, locale) {
  if (!field) return undefined;
  return field[locale] ?? field[DEFAULT_LOCALE];
}

export const PAGE_QUERY = `*[_type == "page" && pageKey == $pageKey][0]{
  pageKey, path, navLabel, metaTitle, metaDescription, heading, shortDescription, body
}`;

export const ALL_PAGES_QUERY = `*[_type == "page"]{ pageKey, path }`;

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  phone, email, address, messageCta, callCta
}`;
