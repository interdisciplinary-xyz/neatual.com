import { PageLayout } from "../components/PageLayout";
import { useContent } from "../lib/useContent";

/**
 * The price list.
 *
 * A real <table> rather than a grid of divs: this is tabular data with a header
 * row, and a screen-reader user needs the row/column association that <th scope>
 * provides. A div grid reads as a flat run of unrelated strings.
 *
 * The placeholder notice is a <p role="status"> above the table rather than a
 * visually-styled aside, so it is announced and cannot be mistaken for
 * decoration. It disappears on its own when `pricingIsPlaceholder` is turned off
 * in the Studio — see PRICING in app/lib/inlineCopy.js. With real rates in place
 * it is normally absent; the "not a binding offer" line below the intro is the
 * one that stays up.
 */
export default function PricingPage() {
  const content = useContent();
  const page = content?.pages.pricing;
  const pricing = content?.pricing;

  return (
    <PageLayout srHeading={page?.srHeading}>
      {pricing?.isPlaceholder && (
        <p
          role="status"
          className="text-14 border-2 border-black px-4 py-3 mb-10 max-w-prose"
        >
          {/* Bundled rather than CMS-driven: the whole point of this string is
              that it cannot be edited away while the rates are still fake.
              See pricingFrom() in content.server.js. */}
          {pricing.placeholderNotice}
        </p>
      )}

      <p className="text-16 text-content mb-6 max-w-prose">{pricing?.intro}</p>

      {/*
        Shown unconditionally, unlike the placeholder box above it: the rates are
        real, and a range is still not a quotation. Above the table rather than
        among the notes below it, so it is read before the numbers rather than
        after somebody has already decided what the wall will cost. Bundled, not
        CMS-driven — see pricingFrom() in content.server.js.
      */}
      <p className="text-14 text-gray-accessible mb-10 max-w-prose">
        {pricing?.notAnOffer}
      </p>

      {/*
        `overflow-x-auto` on the wrapper, not the table. At 260px the three
        columns cannot fit, and without this the table forces the whole page to
        scroll sideways — the one thing the layout must never do. It carries the
        desktop case too now that the table lives in a 338px grid column rather
        than the full page width; see the `min-w-0` note in PageLayout.
      */}
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-14 border-collapse">
          <caption className="sr-only">{page?.srHeading}</caption>
          <thead>
            <tr className="border-b-2 border-black">
              <th scope="col" className="text-left font-bold py-3 pr-4">
                {pricing?.columns.service}
              </th>
              <th scope="col" className="text-left font-bold py-3 pr-4">
                {pricing?.columns.unit}
              </th>
              <th scope="col" className="text-right font-bold py-3">
                {pricing?.columns.price}
              </th>
            </tr>
          </thead>
          <tbody>
            {(pricing?.rows ?? []).map((row) => (
              <tr key={row.key ?? row.label} className="border-b border-black">
                <th
                  scope="row"
                  className="text-left font-normal py-3 pr-4 align-top"
                >
                  {row.label}
                </th>
                <td className="py-3 pr-4 align-top text-gray-accessible">
                  {row.unit}
                </td>
                <td className="py-3 text-right align-top whitespace-nowrap">
                  {row.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="text-14 text-content max-w-prose">
        {(pricing?.notes ?? []).map((note) => (
          <li key={note} className="mb-3 pl-4 -indent-4">
            <span aria-hidden="true">— </span>
            {note}
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}
