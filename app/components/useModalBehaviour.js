import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Escape-to-close, scroll lock, focus trap and focus restore for a modal.
 *
 * The first two already existed in both modals as duplicated effects; the
 * trap and the restore did not. Without them Tab walked straight out of the
 * dialog into the page behind it, and closing dropped focus back to the top of
 * the document instead of the control that opened it — see §3.5 of
 * docs/AUDIT-SEO-PERFORMANCE-ACCESSIBILITY.md.
 *
 * @returns {import('react').RefObject<HTMLElement>} attach to the dialog node
 */
export function useModalBehaviour(isOpen, onClose) {
  const containerRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Remember the trigger, move focus into the dialog, and hand focus back on
  // close. Kept in its own effect so it runs on open/close only, never on an
  // onClose identity change.
  //
  // The dialogs must NOT use React's `autoFocus` for the initial focus: that
  // fires during the commit, i.e. before this effect, so the element captured
  // below would be the dialog's own close button rather than the trigger.
  // Restoring to it after unmount then drops focus to <body>. Focusing here,
  // after the capture, is what makes the restore land on the real trigger.
  useEffect(() => {
    if (!isOpen) return undefined;

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previouslyFocusedRef.current = previous;

    const first = containerRef.current?.querySelector(FOCUSABLE);
    first?.focus();

    return () => {
      const target = previouslyFocusedRef.current;
      if (target?.isConnected) target.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap at both ends, and pull focus back in if it has escaped the
      // dialog entirely (browser chrome, address bar round-trip).
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return containerRef;
}
