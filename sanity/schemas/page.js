import { localizedField, LOCALE_LABELS } from "../lib/localizedField.js";
import { PAGE_KEYS, LOCALE_CODES } from "../../app/lib/seo.js";

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
    localizedField({
      name: "heading",
      title: "Page heading",
      of: { type: "text", rows: 3 },
    }),
    localizedField({
      name: "shortDescription",
      title: "Short description",
      description:
        "The collapsed teaser shown before the full text is expanded.",
      of: { type: "text", rows: 4 },
    }),
    localizedField({
      name: "body",
      title: "Body",
      of: { type: "array", of: [{ type: "block" }] },
    }),

    /*
      Pricing fields. They live on `page` rather than in a document of their own
      so that adding them introduces no new way for getContent() to decide the
      CMS response is incomplete — that check iterates PAGE_KEYS and a missing
      document takes the whole site to fallback copy. Only the `pricing` page
      fills these in; every other page leaves them empty.
    */
    {
      name: "pricingIsPlaceholder",
      title: "Rates are placeholders",
      type: "boolean",
      initialValue: true,
      description:
        "While this is on, the pricing page shows a 'not an offer' notice and is excluded from search engines. Turn it off once the real rates below are filled in — both guards lift automatically.",
      hidden: ({ document }) => document?.pageKey !== "pricing",
    },
    localizedField({
      name: "pricingIntro",
      title: "Pricing intro",
      of: { type: "text", rows: 3 },
    }),
    {
      name: "pricingRows",
      title: "Price rows",
      type: "object",
      options: { collapsible: true, collapsed: false },
      hidden: ({ document }) => document?.pageKey !== "pricing",
      fields: LOCALE_CODES.map((code) => ({
        name: code,
        title: LOCALE_LABELS[code],
        type: "array",
        of: [
          {
            type: "object",
            fields: [
              { name: "key", title: "Key", type: "string" },
              { name: "label", title: "Service", type: "string" },
              { name: "unit", title: "Unit", type: "string" },
              { name: "price", title: "Rate", type: "string" },
            ],
            preview: {
              select: { title: "label", subtitle: "price" },
            },
          },
        ],
      })),
    },
    {
      name: "pricingNotes",
      title: "Pricing notes",
      type: "object",
      options: { collapsible: true, collapsed: false },
      hidden: ({ document }) => document?.pageKey !== "pricing",
      fields: LOCALE_CODES.map((code) => ({
        name: code,
        title: LOCALE_LABELS[code],
        type: "array",
        of: [{ type: "string" }],
      })),
    },
  ],
  preview: {
    select: { title: "metaTitle.pl", subtitle: "path.pl" },
  },
};
