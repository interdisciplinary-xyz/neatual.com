import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ProductImage } from "./ProductImage";
import { IMAGE_WIDTHS } from "../lib/images";

const BASE = "/gallery/produkt-2/produkt-2-1";

describe("ProductImage", () => {
  it("renders a WebP source ahead of a JPEG fallback", () => {
    const { container } = render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
      />
    );

    const source = container.querySelector("source");
    expect(source).toHaveAttribute("type", "image/webp");
    expect(source.getAttribute("srcset")).toContain(
      `${BASE}-${IMAGE_WIDTHS[0]}.webp`
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringMatching(/\.jpg$/));
  });

  it("puts sizes on both the source and the img", () => {
    const { container } = render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
      />
    );
    expect(container.querySelector("source")).toHaveAttribute("sizes", "120px");
    expect(screen.getByRole("img")).toHaveAttribute("sizes", "120px");
  });

  // <picture> is display:contents so the <img> stays a direct layout child of
  // whatever wrapper it had. Losing this class silently breaks every
  // `absolute inset` / `h-full` rule the gallery depends on.
  it("keeps <picture> out of the layout", () => {
    const { container } = render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
      />
    );
    expect(container.querySelector("picture")).toHaveClass("contents");
  });

  // Pins §2.2: width and height are what keep CLS at 0.
  it("always carries intrinsic dimensions and async decoding", () => {
    render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "400");
    expect(img).toHaveAttribute("height", "400");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("lazy-loads by default and only opts out explicitly", () => {
    const { unmount } = render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
    unmount();

    render(
      <ProductImage
        base={BASE}
        alt="Uniform"
        width={400}
        height={400}
        sizes="120px"
        loading="eager"
        fetchPriority="high"
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
  });

  it("has no axe violations, and an empty alt stays decorative", async () => {
    const { container } = render(
      <>
        <ProductImage
          base={BASE}
          alt="Uniform wzór nr 2"
          width={400}
          height={400}
          sizes="120px"
        />
        <ProductImage base={BASE} alt="" width={80} height={80} sizes="50px" />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
