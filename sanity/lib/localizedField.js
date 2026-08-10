import { LOCALE_CODES } from "../../app/lib/seo.js";

export const LOCALE_LABELS = {
  pl: "Polski",
  en: "English",
  de: "Deutsch",
};

// Field-level localization: every translatable field becomes an object with one
// sub-field per locale. LOCALE_CODES is the same list the sitemap and hreflang
// tags read from, so adding a language is a one-line change in app/lib/seo.js.
export function localizedField({
  name,
  title,
  of = { type: "string" },
  description,
}) {
  return {
    name,
    title,
    type: "object",
    description,
    options: { collapsible: true, collapsed: false },
    fields: LOCALE_CODES.map((code) => ({
      ...of,
      name: code,
      title: LOCALE_LABELS[code],
    })),
  };
}
