import { useState, useEffect } from "react";
import { CloseIcon } from "./icons";

export function ModalSingleProduct({ product, isOpen, onClose }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: "95%", height: "90%" });
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentPhoto =
    product.photos[currentPhotoIndex] || product.photos[0];
  const photoUrl = currentPhoto?.url || product.thumbnailUrl;

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
          className="absolute top-6 left-6 z-10 cursor-pointer"
          aria-label="Close"
          autoFocus
        >
          <CloseIcon aria-hidden="true" />
        </button>
        <article className="flex flex-col h-full p-6 pt-20 text-16 overflow-y-auto">
          <figure className="aspect-square overflow-hidden rounded-2xl mb-8 shrink-0">
            <img
              alt={product.alt || product.name}
              src={photoUrl}
              width={400}
              height={400}
              className="w-full h-full object-cover"
            />
          </figure>
          <div className="flex flex-col flex-1">
            <div className="flex justify-between mb-4">
              <div>
                <p
                  id="modal-product-heading"
                  className="uppercase font-bold"
                >
                  {product.name}
                </p>
                <p
                  className="text-14 text-content"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
              <div>
                <p className="font-bold">{product.price}</p>
              </div>
            </div>
            <ul className="flex gap-2 flex-wrap -mt-12">
              {product.photos.map((image, index) => (
                <li
                  key={index}
                  className="w-20 aspect-[4/4.23] overflow-hidden rounded-xl cursor-pointer shrink-0"
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
