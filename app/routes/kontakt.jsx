import { useLocation } from "@remix-run/react";
import { LogoIcon, PlayIcon, StopIcon, DottIcon } from "../components/icons";
import { Button } from "../components/Button";
import { DisplayMedia } from "../components/DisplayMedia";
import { LOCALES, getLocaleFromPath } from "../lib/locales";

export default function ContactPage() {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const config = LOCALES[locale];

  return (
    <article className="pt-48 h-full mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4 tablet:pt-80 desktop:grid desktop:grid-cols-3 desktop:gap-36 desktop:h-full">
      <DisplayMedia displays={["desktop"]}>
        <div>
          <LogoIcon style={{ width: 236, height: 292 }} />
        </div>
      </DisplayMedia>
      <div className="flex flex-col h-full max-w-lg mx-auto tablet:justify-center desktop:block desktop:max-w-none desktop:mx-0">
        <div>
          <a
            className="flex pb-8 mb-8 border-b border-black"
            href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
            aria-label={locale === "pl" ? "Zadzwoń" : locale === "en" ? "Call" : "Anrufen"}
          >
            <PlayIcon className="mr-8 shrink-0" aria-hidden="true" />
            <span className="text-14">{config.contact.phone}</span>
          </a>
          <a
            className="flex pb-8 mb-8 border-b border-black"
            href={`mailto:${config.contact.email}`}
            aria-label={locale === "pl" ? "Napisz e-mail" : locale === "en" ? "Send email" : "E-Mail senden"}
          >
            <StopIcon className="mr-8 shrink-0" aria-hidden="true" />
            <span className="text-14">{config.contact.email}</span>
          </a>
          <div className="flex mb-16 tablet:flex-col">
            <div className="flex">
              <DottIcon className="mr-8 shrink-0" aria-hidden="true" />
              <span className="text-14 font-bold">NEATUAL</span>
            </div>
            <span className="ml-auto text-14 tablet:ml-0 tablet:mt-6">
              {config.contact.address}
            </span>
          </div>
        </div>
        <DisplayMedia displays={["mobile", "tablet"]}>
          <div>
            <Button href={`mailto:${config.contact.email}`}>
              {config.contact.message}
            </Button>
            <Button href={`tel:${config.contact.phone.replace(/\s/g, "")}`}>
              {config.contact.call}
            </Button>
          </div>
        </DisplayMedia>
      </div>
      <DisplayMedia displays={["desktop"]}>
        <div>
          <Button href={`mailto:${config.contact.email}`}>
            {config.contact.message}
          </Button>
          <Button href={`tel:${config.contact.phone.replace(/\s/g, "")}`}>
            {config.contact.call}
          </Button>
        </div>
      </DisplayMedia>
    </article>
  );
}
