import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useModalBehaviour } from "./useModalBehaviour";

// Pins §3.5. Before this hook the modals had Escape and a scroll lock but no
// focus trap and no focus restore: Tab walked straight out of the dialog into
// the page behind it, and closing dropped focus to <body> instead of the
// control that opened it.
//
// It also pins the ordering trap that made the first implementation wrong:
// React's autoFocus fires during commit, before effects, so capturing
// document.activeElement in an effect caught the dialog's own close button.
// If anyone reintroduces autoFocus on the close button, "restores focus to the
// trigger" fails.
function Harness({ onClose }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const containerRef = useModalBehaviour(open, close);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <button type="button">decoy outside</button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Test dialog">
          <div ref={containerRef}>
            <button type="button" onClick={close}>
              close
            </button>
            <button type="button">first</button>
            <button type="button">last</button>
          </div>
        </div>
      )}
    </div>
  );
}

describe("useModalBehaviour", () => {
  it("moves focus into the dialog on open", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "open" }));

    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
    expect(document.activeElement).toHaveTextContent("close");
  });

  it("keeps Tab inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));

    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog, `escaped after ${i + 1} tabs`).toContainElement(
        document.activeElement
      );
    }
  });

  it("wraps backwards from the first element to the last", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));

    // focus starts on "close", the first focusable
    await user.tab({ shift: true });
    expect(document.activeElement).toHaveTextContent("last");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    const trigger = screen.getByRole("button", { name: "open" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("locks body scroll only while open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).toBe("");

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });
});
