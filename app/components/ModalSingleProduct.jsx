import { useState, useEffect } from "react";
import { CloseIcon } from "./icons";
import { ProductImage } from "./ProductImage";
import { useModalBehaviour } from "./useModalBehaviour";

export function ModalSingleProduct({
  product,
  isOpen,
  onClose,
  closeLabel,
  selectPhotoLabel,
  photoAlt,
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: "95%", height: "90%" });
  const containerRef = useModalBehaviour(isOpen, onClose);

  useEffect(() => {
    if (product) setCurrentPhotoIndex(0);
  }, [product]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: `${((window.innerWidth - 55) / window.innerWidth) * 100}%`,
        height: `${((window.innerHeight - 80) / window.innerHeight) * 100}%`,
      });
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const currentPhoto =
    product?.photos?.[currentPhotoIndex] || product?.photos?.[0];
  const photoBase = currentPhoto?.base || product?.thumbnailBase;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-heading"
    >
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          maxHeight: "90vh",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 left-6 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          aria-label={closeLabel}
        >
          <CloseIcon aria-hidden="true" />
        </button>
        <article className="flex flex-col h-full p-6 pt-20 text-16 overflow-y-auto">
          <figure className="aspect-square overflow-hidden rounded-2xl mb-8 shrink-0">
            <ProductImage
              base={photoBase}
              alt={product?.alt || product?.name}
              width={400}
              height={400}
              sizes="90vw"
              className="w-full h-full object-cover"
            />
          </figure>
          <div className="flex flex-col flex-1">
            <div className="flex justify-between mb-4">
              <div>
                <h2 id="modal-product-heading" className="uppercase font-bold">
                  {product?.name}
                </h2>
                <p className="text-14 text-content">
                  {(product?.descriptionLines ?? []).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              <div>
                <p className="font-bold">{product?.price}</p>
              </div>
            </div>
            <ul className="flex gap-2 flex-wrap -mt-12">
              {(product?.photos ?? []).map((image, index) => (
                <li key={index} className="w-20 aspect-[4/4.23] shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPhotoIndex(index)}
                    aria-label={selectPhotoLabel(index + 1)}
                    aria-pressed={currentPhotoIndex === index}
                    className="block w-full h-full overflow-hidden rounded-xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    <ProductImage
                      base={image.base}
                      alt={photoAlt(index + 1)}
                      width={80}
                      height={80}
                      sizes="50px"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
