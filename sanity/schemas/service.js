import { localizedField } from "../lib/localizedField.js";

/*
  One service — an entry on /uslugi and a page of its own beneath it.

  These pages carry the queries the site is actually looking for: somebody
  searching "montaż fototapet" or "zdjęcie starej tapety" is looking for a
  contractor, which is what Neatual is. The gallery, cut by motif, was standing
  in for them and could only ever match somebody shopping for wallpaper.

  Every service must describe work the business genuinely does. `pricingKey`
  ties each one to a row in the price table on the pricing page, which is the
  check against this list quietly growing into things nobody here performs.
*/
export const service = {
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    {
      name: "order",
      title: "Order",
      type: "number",
      description: "Position in the list on /uslugi. Lowest first.",
      validation: (Rule) => Rule.required().integer().positive(),
    },
    {
      name: "slug",
      title: "Reference id",
      type: "string",
      description:
        "Internal name for this service, e.g. 'montaz-fototapet'. Not part of any address — see the per-language slugs below.",
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "slug" })
          .error("Lowercase letters, digits and hyphens only."),
    },
    localizedField({
      name: "slugs",
      title: "URL slug, per language",
      description:
        "The last part of the address in each language. Write the phrase somebody would type into a search engine. Lowercase letters, digits and hyphens only, no accented characters.",
      of: {
        type: "string",
        validation: (Rule) =>
          Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: "slug" }).error(
            "Lowercase letters, digits and hyphens only — no accents."
          ),
      },
    }),
    {
      name: "pricingKey",
      title: "Price list row",
      type: "string",
      description:
        "Which row of the price list this page describes. The tie between what a page promises and what the business quotes for: a service with no row behind it is one nobody has priced.",
      options: {
        list: [
          { title: "Patterned wallpaper installation", value: "standard" },
          { title: "Photo mural installation", value: "mural" },
          { title: "Textured wallpaper installation", value: "textured" },
          { title: "Surface preparation", value: "preparation" },
          { title: "Removal of existing wallpaper", value: "removal" },
          { title: "Quoted per job", value: "minimum" },
        ],
      },
    },
    {
      name: "categories",
      title: "Gallery categories shown as examples",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Reference ids of the gallery categories that illustrate this service, e.g. 'kwiatowe'. Each becomes a link on this page, and this page becomes a link on the first category listed. Renaming a category's URL does not break these; changing its reference id does.",
    },

    localizedField({ name: "name", title: "Name" }),
    localizedField({
      name: "intro",
      title: "Intro",
      description:
        "One paragraph, shown under the heading here and beside the name on /uslugi. Say what is actually different about this work. Claim no material, price, timescale or certification that has not been confirmed.",
      of: { type: "text", rows: 4 },
    }),
    localizedField({
      name: "scope",
      title: "What the work covers",
      description:
        "One line per entry. An array rather than rich text so the page can render it as a list without raw HTML.",
      of: { type: "array", of: [{ type: "string" }] },
    }),

    localizedField({
      name: "metaTitle",
      title: "Meta title",
      description:
        "Used for <title>, og:title and twitter:title. Aim for about 55 characters. Left empty: the site title followed by the service name.",
    }),
    localizedField({
      name: "metaDescription",
      title: "Meta description",
      description:
        "The search result snippet. Aim for about 150 characters. Left empty: the intro paragraph.",
      of: { type: "text", rows: 3 },
    }),
  ],
  orderings: [
    {
      title: "List order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name.pl", subtitle: "slugs.pl", order: "order" },
    prepare: ({ title, subtitle, order }) => ({
      title: `${order}. ${title ?? "Untitled"}`,
      subtitle,
    }),
  },
};
