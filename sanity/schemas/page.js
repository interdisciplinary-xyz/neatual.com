import { localizedField } from "../lib/localizedField.js";
import { PAGE_KEYS } from "../../app/lib/seo.js";

export const page = {
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    {
      name: "pageKey",
      title: "Page",
      type: "string",
      description:
        "Identifies which page this is. Must match a key in app/lib/seo.js — the sitemap and hreflang tags are built from these.",
      options: {
        list: PAGE_KEYS.map((key) => ({ title: key, value: key })),
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    },
    localizedField({
      name: "path",
      title: "URL path",
      description:
        "Full path for each language, e.g. /galeria, /en/gallery, /de/galerie. Leading slash, no trailing slash.",
      of: {
        type: "string",
        validation: (Rule) =>
          Rule.required()
            .regex(/^\/($|[^\s]*[^/])$/, { name: "path" })
            .error("Must start with / and must not end with a trailing slash."),
      },
    }),
    localizedField({ name: "navLabel", title: "Navigation label" }),
    localizedField({
      name: "srHeading",
      title: "Screen-reader heading",
      description:
        "The visually hidden <h1>. Every page needs one even where the design shows no heading.",
    }),
    localizedField({
      name: "metaTitle",
      title: "Meta title",
      description: "Used for <title>, og:title and twitter:title.",
    }),
    localizedField({
      name: "metaDescription",
      title: "Meta description",
      of: { type: "text", rows: 3 },
    }),
    localizedField({ name: "heading", title: "Page heading", of: { type: "text", rows: 3 } }),
    localizedField({
      name: "shortDescription",
      title: "Short description",
      description: "The collapsed teaser shown before the full text is expanded.",
      of: { type: "text", rows: 4 },
    }),
    localizedField({
      name: "body",
      title: "Body",
      of: { type: "array", of: [{ type: "block" }] },
    }),
  ],
  preview: {
    select: { title: "metaTitle.pl", subtitle: "path.pl" },
  },
};
