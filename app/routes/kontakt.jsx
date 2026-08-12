import { PlayIcon, StopIcon, DottIcon } from "../components/icons";
import { PageLayout } from "../components/PageLayout";
import { useContent } from "../lib/useContent";

/**
 * This page's own three-column grid is what PageLayout was lifted from — logo,
 * details, buttons. It keeps the middle column and drops the other two: the mark
 * and the CTA now come from the shell, like everywhere else.
 *
 * The pair of buttons that used to close this page has gone with it. They were
 * the same two links as the CTA's, so leaving them in would put the same call
 * twice on one screen — the duplication root.jsx used to carry a note about.
 */
export default function ContactPage() {
  const content = useContent();
  const settings = content?.settings;
  const tel = `tel:${(settings?.phone ?? "").replace(/\s/g, "")}`;
  const mailto = `mailto:${settings?.email ?? ""}`;

  return (
    <PageLayout srHeading={content?.pages.contact?.srHeading}>
      {/*
        The verb is an sr-only sibling, not an aria-label. As a label it
        replaced the accessible name with "Zadzwoń" while the visible text was
        the phone number, so the name did not contain the visible label — WCAG
        2.5.3, and voice control could not activate either link by reading it
        aloud. Same fix as the logo link in Header.
      */}
      <a className="flex pb-8 mb-8 border-b border-black" href={tel}>
        <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
        <span className="sr-only">{settings?.a11y.call}</span>
        <span className="text-14">{settings?.phone}</span>
      </a>
      <a className="flex pb-8 mb-8 border-b border-black" href={mailto}>
        <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
        <span className="sr-only">{settings?.a11y.email}</span>
        <span className="text-14">{settings?.email}</span>
      </a>
      <div className="flex tablet:flex-col">
        <div className="flex">
          <DottIcon className="mr-8 shrink-0" aria-hidden="true" />
          {/* `uppercase` in CSS, so the CMS holds the name as it is written. */}
          <span className="text-14 font-bold uppercase">
            {settings?.brandName}
          </span>
        </div>
        <span className="ml-auto text-14 tablet:ml-0 tablet:mt-6">
          {settings?.addressLine}
        </span>
      </div>
    </PageLayout>
  );
}
