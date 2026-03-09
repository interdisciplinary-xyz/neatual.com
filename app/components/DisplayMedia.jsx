import { useState, useEffect } from "react";

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

export function DisplayMedia({ displays, children }) {
  const deviceType = useDeviceType();

  if (!displays.includes(deviceType)) {
    return <div className="hidden" />;
  }

  return <>{children}</>;
}
