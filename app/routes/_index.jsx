import { useState } from "react";
import { useLocation } from "@remix-run/react";
import { LogoIcon, PlayIcon, StopIcon } from "../components/icons";
import { DisplayMedia } from "../components/DisplayMedia";
import { ModalWithDetails } from "../components/ModalWithDetails";
import { LOCALES, getLocaleFromPath } from "../lib/locales";

export default function HomePage() {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const [showModal, setShowModal] = useState(false);

  const config = LOCALES[locale];

  return (
    <article className="container flex flex-col h-full overflow-auto pt-32 tablet:mt-16 desktop:flex-row desktop:mt-0 desktop:justify-center desktop:pt-80 desktop:h-auto max-w-[1114px] mx-auto px-4">
      <h1 className="sr-only">
        {locale === "pl"
          ? "Neatual - produkcja i dystrybucja uniformów"
          : locale === "en"
            ? "Neatual - uniform production and distribution"
            : "Neatual - Uniformproduktion und -vertrieb"}
      </h1>
      <figure className="mb-12 tablet:mb-24 desktop:flex desktop:mb-0 desktop:w-1/3 desktop:pr-40">
        <LogoIcon
          className="w-32 h-auto tablet:mx-auto tablet:w-56 desktop:w-full"
          style={{ width: 236, height: 292 }}
        />
      </figure>

      <DisplayMedia displays={["mobile"]}>
        <div>
          <p
            className="font-bold text-16 mb-6"
            dangerouslySetInnerHTML={{ __html: config.home.heading }}
          />
          <p
            className="text-16 text-content mb-6"
            dangerouslySetInnerHTML={{ __html: config.home.shortDescription }}
          />
          <button
            type="button"
            className="ml-auto bg-white flex font-bold h-10 items-center justify-center rounded-full text-center w-10 text-14 leading-5"
            onClick={() => setShowModal(true)}
            aria-label={locale === "pl" ? "Pokaż pełny opis" : locale === "en" ? "Show full description" : "Vollständige Beschreibung anzeigen"}
          >
            •••
          </button>
          <ModalWithDetails
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            config={config}
          />
        </div>
      </DisplayMedia>

      <DisplayMedia displays={["tablet", "desktop"]}>
        <div className="desktop:px-36 desktop:w-2/3">
          <p className="hidden font-logo text-38 mb-8 desktop:block">netual</p>
          <p
            className="font-bold text-16 mb-6"
            dangerouslySetInnerHTML={{ __html: config.home.heading }}
          />
          <p
            className="text-16 text-content mb-16"
            dangerouslySetInnerHTML={{ __html: config.home.fullDescription }}
          />
          <ul className="hidden tablet:flex tablet:flex-col desktop:hidden">
            <li className="mb-8">
              <a
                className="flex"
                href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
              >
                <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="text-14">{config.contact.phone}</span>
              </a>
            </li>
            <li>
              <a
                className="flex"
                href={`mailto:${config.contact.email}`}
              >
                <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
                <span className="text-14">{config.contact.email}</span>
              </a>
            </li>
          </ul>
        </div>
      </DisplayMedia>
    </article>
  );
}
