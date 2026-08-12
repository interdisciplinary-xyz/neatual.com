import { useState, useEffect } from "react";

// Kept for Header, which picks between two logo marks rather than showing and
// hiding content. Note these thresholds (320/768/1366) never matched the
// Tailwind `screens` in tailwind.config.js (260/608/1114), so the JS and the
// CSS disagreed about what "tablet" meant.
const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1366,
};

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState("desktop");

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.tablet) setDeviceType("mobile");
      else if (width < BREAKPOINTS.desktop) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}

// Visibility per breakpoint set, expressed in the same Tailwind breakpoints the
// rest of the site uses.
//
// This used to gate on useDeviceType, which starts as "desktop" and corrects
// itself in an effect. The server therefore always rendered the desktop branch
// and the client swapped it after hydration — on /kontakt that meant a 236x292
// logo appearing in SSR and vanishing on a phone, for a measured CLS of 0.177
// against a 0.1 budget. It also meant primary content was JS-gated: with
// scripting off, every viewport got the desktop markup.
//
// Rendering both branches and letting CSS choose costs a few hundred bytes of
// HTML and removes the swap, the shift and the JS dependency together.
// See §3.7 of docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md.
const VISIBILITY = {
  mobile: "tablet:hidden",
  tablet: "hidden tablet:block desktop:hidden",
  desktop: "hidden desktop:block",
  "mobile+tablet": "desktop:hidden",
  "tablet+desktop": "hidden tablet:block",
  "mobile+desktop": "tablet:hidden desktop:block",
  "mobile+tablet+desktop": "",
};

const ORDER = ["mobile", "tablet", "desktop"];

// `className` is appended to the visibility rule rather than replacing it, for
// the cases where this wrapper is a placed element rather than a bare box.
export function DisplayMedia({ displays, children, className = "" }) {
  const key = ORDER.filter((d) => displays.includes(d)).join("+");
  const visibility = VISIBILITY[key];

  if (visibility === undefined) {
    throw new Error(
      `DisplayMedia: no visibility rule for [${displays.join(", ")}]`
    );
  }

  return <div className={`${visibility} ${className}`.trim()}>{children}</div>;
}
