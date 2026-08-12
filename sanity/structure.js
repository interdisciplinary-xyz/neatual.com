// Site settings is a singleton: one document, reached directly rather than
// through a list the editor could add a second entry to.
export const structure = (S) =>
  S.list()
    .title("Neatual")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
      S.divider(),
      S.documentTypeListItem("page").title("Pages"),
      S.listItem()
        .title("Gallery categories")
        .schemaType("product")
        .child(
          S.documentTypeList("product")
            .title("Gallery categories")
            .defaultOrdering([{ field: "order", direction: "asc" }])
        ),
    ]);
