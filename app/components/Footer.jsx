import { PlayIcon, StopIcon } from "./icons";
import { useContent } from "../lib/useContent";

/**
 * Site footer: the phone number and the email address, nothing else.
 *
 * This used to be the main nav, pinned `fixed bottom-0`. The nav has moved up
 * into the header, and the contact details have come down here — where they
 * render on every viewport rather than only from 1114px up, which is all the
 * header had room for.
 *
 * Static, not fixed. The old footer was fixed because it was navigation you
 * wanted within reach at any scroll position; a phone number is not, and a
 * permanently docked bar would spend two lines of a 260px screen on it, since
 * the number and the address cannot share a line at that width.
 */
export function Footer() {
  const content = useContent();
  const settings = content?.settings;

  // Nothing to show if the CMS is unreachable and the fallback copy is absent —
  // render no landmark at all rather than an empty bar with two dead links.
  if (!settings?.phone && !settings?.email) return null;

  return (
    <footer className="w-full bg-background py-8 tablet:py-12">
      {/*
        Full-bleed with the same `px-[48px]` as the header, so the two bars line
        up at both edges and read as one frame around the page. See the note in
        Header.jsx on why 48px is an arbitrary value rather than a scale step.
      */}
      <div className="px-[48px]">
        {/*
          `justify-end` mirrors the header, where the contact details sat at the
          right edge before they moved down here. `flex-wrap` for the 260px case:
          the number and the address come to more than the usable width, so they
          take a line each instead of forcing a horizontal scroll.
        */}
        <ul className="flex flex-wrap items-center justify-end gap-x-10 gap-y-4">
          {/*
            sr-only verb rather than aria-label, so the accessible name contains
            the visible phone number and address (WCAG 2.5.3, Label in Name) —
            the same pattern as the pair on the contact page.
          */}
          {settings?.phone && (
            <li className="shrink-0">
              <a
                className="flex items-center"
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
              >
                <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="sr-only">{settings?.a11y.call}</span>
                <span className="text-14">{settings.phone}</span>
              </a>
            </li>
          )}
          {settings?.email && (
            <li className="shrink-0">
              <a
                className="flex items-center"
                href={`mailto:${settings.email}`}
              >
                <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="sr-only">{settings?.a11y.email}</span>
                <span className="text-14">{settings.email}</span>
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
