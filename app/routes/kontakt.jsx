import { LogoIcon, PlayIcon, StopIcon, DottIcon } from "../components/icons";
import { Button } from "../components/Button";
import { DisplayMedia } from "../components/DisplayMedia";
import { useContent } from "../lib/useContent";

export default function ContactPage() {
  const content = useContent();
  const page = content?.pages.contact;
  const settings = content?.settings;
  const tel = `tel:${(settings?.phone ?? "").replace(/\s/g, "")}`;
  const mailto = `mailto:${settings?.email ?? ""}`;

  return (
    <article className="pt-48 h-full mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4 tablet:pt-80 desktop:grid desktop:grid-cols-3 desktop:gap-36 desktop:h-full">
      {/* The page had no heading of any level; the design has no visible title. */}
      <h1 className="sr-only">{page?.srHeading}</h1>
      <DisplayMedia displays={["desktop"]}>
        <div>
          <LogoIcon style={{ width: 236, height: 292 }} aria-hidden="true" />
        </div>
      </DisplayMedia>
      <div className="flex flex-col h-full max-w-lg mx-auto tablet:justify-center desktop:block desktop:max-w-none desktop:mx-0">
        <div>
          {/*
            The verb is an sr-only sibling, not an aria-label. As a label it
            replaced the accessible name with "Zadzwoń" while the visible text
            was the phone number, so the name did not contain the visible
            label — WCAG 2.5.3, and voice control could not activate either
            link by reading it aloud. Same fix as the logo link in Header.
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
          <div className="flex mb-16 tablet:flex-col">
            <div className="flex">
              <DottIcon className="mr-8 shrink-0" aria-hidden="true" />
              <span className="text-14 font-bold">NEATUAL</span>
            </div>
            <span className="ml-auto text-14 tablet:ml-0 tablet:mt-6">
              {settings?.addressLine}
            </span>
          </div>
        </div>
        <DisplayMedia displays={["mobile", "tablet"]}>
          <div>
            <Button href={mailto}>{settings?.messageCta}</Button>
            <Button href={tel}>{settings?.callCta}</Button>
          </div>
        </DisplayMedia>
      </div>
      <DisplayMedia displays={["desktop"]}>
        <div>
          <Button href={mailto}>{settings?.messageCta}</Button>
          <Button href={tel}>{settings?.callCta}</Button>
        </div>
      </DisplayMedia>
    </article>
  );
}
