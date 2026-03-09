import { useState, useEffect } from "react";
import { useLocation } from "@remix-run/react";
import { products } from "../lib/products";
import { getLocaleFromPath } from "../lib/locales";
import { ModalSingleProduct } from "../components/ModalSingleProduct";

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

  const currentProduct = products[currentProductIndex];
  const currentPhoto =
    currentProduct.photos[currentPhotoIndex] || currentProduct.photos[0];
  const photoUrl = currentPhoto?.url || currentProduct.thumbnailUrl;

  const openProduct = (index) => {
    setCurrentProductIndex(index);
    setCurrentPhotoIndex(0);
    if (isMobile) setModalOpen(true);
  };

  return (
    <article className="flex h-full pb-12 pt-36 mobile:max-w-[260px] tablet:max-w-[608px] desktop:max-w-[1114px] mx-auto px-4 desktop:pt-80 desktop:pb-0">
      <div className="w-full desktop:flex desktop:gap-8">
        <div className="w-full desktop:w-1/3">
          <ul className="grid grid-cols-2 gap-4 desktop:grid-cols-3 desktop:overflow-y-auto desktop:h-full">
            {products.map((item, index) => (
              <li
                key={index}
                className={`aspect-square overflow-hidden cursor-pointer rounded-2xl border-2 relative ${
                  currentProductIndex === index
                    ? "border-black"
                    : "border-transparent"
                }`}
                onClick={() => openProduct(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProduct(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={
                  locale === "pl"
                    ? `${item.name} - wybierz aby zobaczyć`
                    : locale === "en"
                      ? `${item.name} - select to view`
                      : `${item.name} - auswählen zum Anzeigen`
                }
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.alt}
                  width={400}
                  height={400}
                  loading={index < 4 ? "eager" : "lazy"}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden desktop:flex w-2/3 px-36">
          <div className="w-1/2">
            <figure className="aspect-square overflow-hidden rounded-2xl mb-8">
              <img
                alt={currentProduct.alt || currentProduct.name}
                src={photoUrl}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </figure>
          </div>
          <div className="w-1/2 pl-16">
            <div className="flex flex-col">
              <div className="flex justify-between mb-16">
                <div>
                  <p className="uppercase font-bold text-16">
                    {currentProduct.name}
                  </p>
                  <p
                    className="text-14 text-content"
                    dangerouslySetInnerHTML={{
                      __html: currentProduct.description,
                    }}
                  />
                </div>
                <div>
                  <p className="font-bold text-16">{currentProduct.price}</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2">
                {currentProduct.photos.map((image, index) => (
                  <li
                    key={index}
                    className="w-20 aspect-square overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => setCurrentPhotoIndex(index)}
                  >
                    <img
                      src={image.url}
                      alt={
                        locale === "pl"
                          ? `${currentProduct.name} - zdjęcie ${index + 1}`
                          : locale === "en"
                            ? `${currentProduct.name} - photo ${index + 1}`
                            : `${currentProduct.name} - Foto ${index + 1}`
                      }
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
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
      />
    </article>
  );
}
