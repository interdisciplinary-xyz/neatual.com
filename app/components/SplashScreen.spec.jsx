import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { SplashScreen } from "./SplashScreen";

describe("SplashScreen", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<SplashScreen />);

    expect(container.querySelector(".splash")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  /*
    The pairing that matters. `aria-hidden` on a container holding a focusable
    child is an axe violation in its own right (aria-hidden-focus) and a real
    trap: a keyboard user tabs to something a screen reader refuses to announce.
    The splash is decorative, so the correct state is both flags at once — hidden
    *and* empty of anything tabbable.
  */
  it("contains nothing focusable", () => {
    const { container } = render(<SplashScreen />);

    const focusable = container.querySelectorAll(
      "a, button, input, select, textarea, [tabindex]"
    );
    expect(focusable).toHaveLength(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<SplashScreen />);

    expect(await axe(container)).toHaveNoViolations();
  });

  /*
    The wordmark is a real text node rather than part of the SVG, so it inherits
    Montserrat from `font-logo` and matches the header's treatment on home. If it
    ever became a path, this fails — which is the point: an image of text in the
    splash is a different decision and should be made deliberately.
  */
  it("renders the wordmark as text", () => {
    const { container } = render(<SplashScreen />);

    const wordmark = container.querySelector(".splash-wordmark");
    expect(wordmark).toHaveTextContent("neatual.com");
    expect(wordmark).toHaveClass("font-logo");
  });
});
