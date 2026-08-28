import { localizedField } from "../lib/localizedField.js";
import { phoneShape, emailShape } from "../lib/contactValidation.js";

export const siteSettings = {
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  // Singleton — the structure resolver pins this to a single document.
  fields: [
    {
      name: "wordmark",
      title: "Wordmark",
      type: "string",
      description:
        "The brand as written in the header and on the splash screen — 'neatual.com'. A name, not a translation, so it is the same in all three languages.",
    },
    {
      name: "brandName",
      title: "Brand name",
      type: "string",
      description:
        "The brand without the domain — 'neatual'. Used for the large wordmark on the home page and beside the address on the contact page, where it is shown in capitals.",
    },
    localizedField({
      name: "skipLink",
      title: "Skip-to-content link",
      description:
        "The first thing a keyboard or screen-reader user reaches on every page. It jumps past the header to the page content.",
    }),
    // Phone and email are the only two fields whose value is concatenated
    // straight into a URL: kontakt.jsx builds `tel:` and `mailto:` from them.
    // A `string` field renders as a single-line input in the Studio, which is
    // why these looked safe, but the Studio is not the only writer — the seed
    // script, `pnpm content:push` and the HTTP API all reach the same document,
    // and none of them is a text box. A newline or a stray `?subject=` arriving
    // that way produces a link that silently does nothing when tapped, on the
    // one page whose entire job is being contactable.
    //
    // Validated at edit time rather than sanitised at render on purpose.
    // Stripping bad input in kontakt.jsx would leave the bad value in the CMS,
    // correct-looking in the Studio and wrong anywhere else it is read.
    //
    // The predicates are in ../lib/contactValidation.js so the test suite can
    // run them — see the note at the top of that file.
    {
      name: "phone",
      title: "Phone",
      type: "string",
      description:
        "Identical across all languages, so it is not translated. Digits, spaces and one leading + — it goes into the tel: link as written, with the spaces removed.",
      validation: (Rule) => Rule.required().custom(phoneShape),
    },
    {
      name: "email",
      title: "Email",
      type: "string",
      description:
        "Goes into the mailto: link as written. One plain address — no display name, no ?subject=.",
      validation: (Rule) => Rule.required().custom(emailShape),
    },
    {
      name: "address",
      title: "Address",
      type: "object",
      description:
        "Stored as separate parts because the JSON-LD needs them individually. The one-line form shown on the contact page is assembled from these, so the two cannot disagree.",
      fields: [
        {
          name: "streetAddress",
          title: "Street and number",
          type: "string",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "postalCode",
          title: "Postal code",
          type: "string",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "addressLocality",
          title: "Town or city",
          type: "string",
          validation: (Rule) => Rule.required(),
        },
        {
          name: "addressCountry",
          title: "Country code",
          type: "string",
          description:
            "Two-letter ISO code, e.g. PL. Used by search engines, never shown.",
          validation: (Rule) => Rule.required().length(2).uppercase(),
        },
        localizedField({
          name: "countryName",
          title: "Country name",
          description: "The country as written in the address on the page.",
        }),
      ],
    },
    localizedField({ name: "messageCta", title: "‘Write to us’ button label" }),
    localizedField({ name: "callCta", title: "‘Call us’ button label" }),
    localizedField({
      name: "ctaHeading",
      title: "Call-to-action heading",
      description:
        "Shown under the content of every page. One block for the whole site, so it cannot drift between pages.",
    }),
    localizedField({
      name: "ctaBody",
      title: "Call-to-action body",
      of: { type: "text", rows: 3 },
    }),
    {
      name: "serviceLabels",
      title: "Service page labels",
      type: "object",
      description:
        "The fixed headings and links every service page renders around its own content. One set for all six pages — as per-service fields they would be six copies to keep in step, and they would drift.",
      options: { collapsible: true, collapsed: true },
      fields: [
        localizedField({
          name: "scopeHeading",
          title: "‘What the work covers’ heading",
        }),
        localizedField({
          name: "galleryHeading",
          title: "‘See completed work’ heading",
        }),
        localizedField({
          name: "pricingLink",
          title: "Link to the price list",
        }),
        localizedField({
          name: "backToServices",
          title: "‘All services’ back link",
        }),
      ],
    },
    {
      name: "error",
      title: "Error pages",
      type: "object",
      description:
        "The 404 and 500 pages. These render from the bundled copy whenever the CMS itself is what failed — editing them here covers the ordinary case, a visitor following a dead link.",
      options: { collapsible: true, collapsed: true },
      fields: [
        localizedField({ name: "notFoundHeading", title: "404 heading" }),
        localizedField({
          name: "notFoundBody",
          title: "404 body",
          of: { type: "text", rows: 3 },
        }),
        localizedField({ name: "errorHeading", title: "500 heading" }),
        localizedField({
          name: "errorBody",
          title: "500 body",
          of: { type: "text", rows: 3 },
        }),
        localizedField({ name: "backHome", title: "‘Back home’ link" }),
      ],
    },
    {
      name: "a11y",
      title: "Accessibility labels",
      type: "object",
      description:
        "Screen-reader only. Not shown on the page, but read aloud — keep them short and literal.",
      options: { collapsible: true, collapsed: true },
      fields: [
        localizedField({ name: "close", title: "Close button" }),
        localizedField({ name: "homeLink", title: "Logo link (‘home page’)" }),
        localizedField({ name: "call", title: "Phone link" }),
        localizedField({ name: "email", title: "Email link" }),
        localizedField({ name: "expand", title: "Expand full description" }),
        localizedField({ name: "langNav", title: "Language selector" }),
        localizedField({ name: "mainNav", title: "Main navigation" }),
        localizedField({
          name: "openMenu",
          title: "Open the mobile menu",
          description:
            "The hamburger button below 608px. Icon-only on screen, so this is its whole name — a visitor using voice control says these words to press it.",
        }),
        localizedField({
          name: "selectProduct",
          title: "Select a product tile",
          description: "Use {name} where the product name should appear.",
        }),
        localizedField({
          name: "selectPhoto",
          title: "Show a specific photo",
          description: "Use {n} where the photo number should appear.",
        }),
        localizedField({
          name: "photoAlt",
          title: "Product photo alt text",
          description:
            "Use {name} for the product and {n} for the photo number.",
        }),
      ],
    },
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
};
