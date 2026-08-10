import { useState, useEffect, useMemo } from "react";
import { useLocation } from "@remix-run/react";
import { getProducts, getPhotoAlt } from "../lib/products";
import { LOCALES, getLocaleFromPath } from "../lib/locales";
import { useContent } from "../lib/useContent";
import { ModalSingleProduct } from "../components/ModalSingleProduct";
import { ProductImage } from "../components/ProductImage";

// Measured rendered widths, not guesses: the grid tile is ~115px in the 2-col
// mobile grid, ~290px in the 2-col tablet grid, and ~112px in the 3-col
// desktop column. The detail image only renders at >=1114px, in a ~285px
// square. The photo strip is `w-20`, which is 50px at this root font-size.
const TILE_SIZES = "(min-width: 1114px) 120px, (min-width: 608px) 290px, 120px";
const DETAIL_SIZES = "285px";
const STRIP_SIZES = "50px";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

export default function GalleryPage() {
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const content = useContent();
  const page = content?.pages.gallery;
  // Two sources on purpose. srHeading and the close label are plain strings and
  // come from the CMS; selectProduct/selectPhoto are *functions* taking a
  // product name and a photo index, which no CMS field can express, so they
  // stay in locales.js.
  const a11y = LOCALES[locale].a11y;
  const products = useMemo(() => getProducts(locale), [locale]);
  const currentProduct = products[currentProductIndex];
  const currentPhoto =
    currentProduct.photos[currentPhotoIndex] || currentProduct.photos[0];
  const photoBase = currentPhoto?.base || currentProduct.thumbnailBase;

  const openProduct = (index) => {
    setCurrentProductIndex(index);
    setCurrentPhotoIndex(0);
    if (isMobile) setModalOpen(true);
  };

  return (
    <article className="flex flex-col h-full pb-12 pt-36 mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4 desktop:pt-80 desktop:pb-0">
      {/*
        Visually hidden to preserve the design, which has no visible page
        title — but the page had no heading of any level at all, on any
        locale. Matches the pattern already used on the homepage.
      */}
      <h1 className="sr-only">{page?.srHeading}</h1>
      <div className="w-full desktop:flex desktop:gap-8">
        <div className="w-full desktop:w-1/3">
          <ul className="grid grid-cols-2 gap-4 desktop:grid-cols-3 desktop:overflow-y-auto desktop:h-full">
            {/*
              Each tile was `<li role="button" tabIndex={0}>`, which Lighthouse
              failed twice over: aria-allowed-role (button is not a permitted
              role on <li>) and list (a <ul> whose children are not list
              items). A real <button> inside the <li> restores list semantics
              and gets keyboard activation for free.
            */}
            {products.map((item, index) => (
              <li
                key={index}
                className={`aspect-square overflow-hidden rounded-2xl border-2 relative ${
                  currentProductIndex === index
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                {/*
                  Was `index < 4 ? "eager" : "lazy"` with exactly 4 products,
                  so nothing was ever lazy. Only the first tile is above the
                  fold on every viewport, so only it is eager.
                */}
                <ProductImage
                  base={item.thumbnailBase}
                  alt={item.alt}
                  width={400}
                  height={400}
                  sizes={TILE_SIZES}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : undefined}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => openProduct(index)}
                  aria-label={a11y.selectProduct(item.name)}
                  aria-pressed={currentProductIndex === index}
                  className="absolute inset-0 w-full h-full cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden desktop:flex w-2/3 px-36">
          <div className="w-1/2">
            <figure className="aspect-square overflow-hidden rounded-2xl mb-8">
              <ProductImage
                base={photoBase}
                alt={currentProduct.alt || currentProduct.name}
                width={600}
                height={600}
                sizes={DETAIL_SIZES}
                className="w-full h-full object-cover"
              />
            </figure>
          </div>
          <div className="w-1/2 pl-16">
            <div className="flex flex-col">
              <div className="flex justify-between mb-16">
                <div>
                  <h2 className="uppercase font-bold text-16">
                    {currentProduct.name}
                  </h2>
                  <p className="text-14 text-content">
                    {currentProduct.descriptionLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-16">{currentProduct.price}</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {/*
                  The photo strip was click-only: onClick on a bare <li> with
                  no role, tabIndex or key handler, so a keyboard user could
                  not switch between a product's four photos anywhere on the
                  site.
                */}
                {currentProduct.photos.map((image, index) => (
                  <li key={index} className="w-20 aspect-square">
                    <button
                      type="button"
                      onClick={() => setCurrentPhotoIndex(index)}
                      aria-label={a11y.selectPhoto(index + 1)}
                      aria-pressed={currentPhotoIndex === index}
                      className="block w-full h-full overflow-hidden rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      <ProductImage
                        base={image.base}
                        alt={getPhotoAlt(locale, currentProduct.name, index + 1)}
                        width={80}
                        height={80}
                        sizes={STRIP_SIZES}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ModalSingleProduct
        product={currentProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        closeLabel={content?.settings.a11y.close}
        selectPhotoLabel={a11y.selectPhoto}
        photoAlt={(i) => getPhotoAlt(locale, currentProduct.name, i)}
      />
    </article>
  );
}
