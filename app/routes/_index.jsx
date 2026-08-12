import { PageLayout } from "../components/PageLayout";
import { useContent } from "../lib/useContent";
import { RichText } from "../components/RichText";

export default function HomePage() {
  const content = useContent();
  const page = content?.pages.home;
  const settings = content?.settings;

  /*
    One version of this page at every width.

    Below 608px it used to show `shortDescription` — a two-sentence teaser — and
    a "•••" button that opened the full text in a modal. That was written for a
    260px frame where the body really was a wall of text; the frame is gone, and
    what it left behind was a home page whose content was three taps deep on a
    phone: read the teaser, find an unlabelled button, dismiss a dialog.

    The full body is a few paragraphs. It costs a scroll, not a tap, and a
    visitor who does not want it scrolls past — which is cheaper than a visitor
    who does want it and has to discover a control to get there.
  */
  return (
    <PageLayout srHeading={page?.srHeading}>
      <p className="hidden font-logo text-38 mb-8 desktop:block">
        {settings?.brandName}
      </p>
      {/*
        `max-w-prose` because the content column is ~670px at desktop — over 80
        characters a line for this body copy, well past the point where the eye
        loses the start of the next line. It caps at 65.
      */}
      <p className="font-bold text-16 mb-6 max-w-prose">{page?.heading}</p>
      {/*
        The phone number and email used to sit under this at tablet width. They
        are in the footer now, on every viewport, so a second copy here would be
        the same two links twice on the same screen.
      */}
      <RichText
        className="text-16 text-content max-w-prose"
        value={page?.body}
      />
    </PageLayout>
  );
}
