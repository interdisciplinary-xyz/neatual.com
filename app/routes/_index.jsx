import { useState } from "react";
import { DisplayMedia } from "../components/DisplayMedia";
import { ModalWithDetails } from "../components/ModalWithDetails";
import { PageLayout } from "../components/PageLayout";
import { useContent } from "../lib/useContent";
import { RichText } from "../components/RichText";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const content = useContent();
  const page = content?.pages.home;
  const settings = content?.settings;

  return (
    <PageLayout srHeading={page?.srHeading}>
      {/*
        Mobile gets the teaser and a "•••" button onto the full text, because at
        260px the full body is a wall. Both branches render in the HTML and CSS
        picks — see the note in DisplayMedia.jsx.
      */}
      <DisplayMedia displays={["mobile"]}>
        <p className="font-bold text-16 mb-6">{page?.heading}</p>
        <p className="text-16 text-content mb-6">{page?.shortDescription}</p>
        <button
          type="button"
          className="ml-auto bg-white flex font-bold h-10 items-center justify-center rounded-full text-center w-10 text-14 leading-5"
          onClick={() => setShowModal(true)}
          aria-label={settings?.a11y.expand}
        >
          •••
        </button>
        <ModalWithDetails
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          page={page}
          closeLabel={settings?.a11y.close}
        />
      </DisplayMedia>

      <DisplayMedia displays={["tablet", "desktop"]}>
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
          are in the footer now, on every viewport, so a second copy here would
          be the same two links twice on the same screen.
        */}
        <RichText
          className="text-16 text-content max-w-prose"
          value={page?.body}
        />
      </DisplayMedia>
    </PageLayout>
  );
}
