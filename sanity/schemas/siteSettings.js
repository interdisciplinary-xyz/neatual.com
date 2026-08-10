import { localizedField } from "../lib/localizedField.js";

export const siteSettings = {
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  // Singleton — the structure resolver pins this to a single document.
  fields: [
    {
      name: "phone",
      title: "Phone",
      type: "string",
      description: "Identical across all languages, so it is not translated.",
    },
    { name: "email", title: "Email", type: "string" },
    { name: "address", title: "Address", type: "string" },
    localizedField({ name: "messageCta", title: "‘Write to us’ button label" }),
    localizedField({ name: "callCta", title: "‘Call us’ button label" }),
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
      ],
    },
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
};
