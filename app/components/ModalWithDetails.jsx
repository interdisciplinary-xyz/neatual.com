import { useState, useEffect } from "react";
import { CloseIcon } from "./icons";

export function ModalWithDetails({ isOpen, onClose, config }) {
  const [dimensions, setDimensions] = useState({ width: "95%", height: "90%" });
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-details-heading"
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
        <article className="p-6 pt-14 text-16 overflow-y-auto h-full">
          <p id="modal-details-heading" className="font-bold text-16 mb-6">
            {config.home.heading}
          </p>
          <p
            className="text-16 text-content mb-16"
            dangerouslySetInnerHTML={{ __html: config.home.fullDescription }}
          />
        </article>
      </div>
    </div>
  );
}
