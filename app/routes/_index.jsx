import { useState } from "react";
import { LogoIcon, PlayIcon, StopIcon } from "../components/icons";
import { DisplayMedia } from "../components/DisplayMedia";
import { ModalWithDetails } from "../components/ModalWithDetails";
import { useContent } from "../lib/useContent";
import { RichText } from "../components/RichText";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const content = useContent();
  const page = content?.pages.home;
  const settings = content?.settings;

  return (
    <article className="container flex flex-col h-full overflow-auto pt-32 tablet:mt-16 desktop:flex-row desktop:mt-0 desktop:justify-center desktop:pt-80 desktop:h-auto max-w-[1114px] mx-auto px-4">
      <h1 className="sr-only">{page?.srHeading}</h1>
      <figure className="mb-12 tablet:mb-24 desktop:flex desktop:mb-0 desktop:w-1/3 desktop:pr-40">
        <LogoIcon
          className="w-32 h-auto tablet:mx-auto tablet:w-56 desktop:w-full"
          style={{ width: 236, height: 292 }}
          aria-hidden="true"
        />
      </figure>

      <DisplayMedia displays={["mobile"]}>
        <div>
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
        </div>
      </DisplayMedia>

      <DisplayMedia displays={["tablet", "desktop"]}>
        <div className="desktop:px-36 desktop:w-2/3">
          <p className="hidden font-logo text-38 mb-8 desktop:block">netual</p>
          <p className="font-bold text-16 mb-6">{page?.heading}</p>
          <RichText className="text-16 text-content mb-16" value={page?.body} />
          <ul className="hidden tablet:flex tablet:flex-col desktop:hidden">
            <li className="mb-8">
              <a
                className="flex"
                href={`tel:${(settings?.phone ?? "").replace(/\s/g, "")}`}
              >
                <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="text-14">{settings?.phone}</span>
              </a>
            </li>
            <li>
              <a className="flex" href={`mailto:${settings?.email ?? ""}`}>
                <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="text-14">{settings?.email}</span>
              </a>
            </li>
          </ul>
        </div>
      </DisplayMedia>
    </article>
  );
}
