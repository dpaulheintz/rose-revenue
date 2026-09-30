"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Icon from "./Icon";

/**
 * Native <dialog>: real modal focus trapping, Esc to close, inert page.
 * `drawer` = side panel on desktop, bottom sheet on phones.
 */
export default function Dialog({
  open, onClose, title, subtitle, children, footer, drawer = false,
}: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`demo-dialog ${drawer ? "demo-drawer" : ""}`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
    >
      {open ? (
        <div className="flex max-h-[inherit] flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-(--d-line) px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="demo-display text-[20px] leading-tight">{title}</h2>
              {subtitle ? <div className="mt-1 text-[13.5px] text-(--d-muted)">{subtitle}</div> : null}
            </div>
            <button type="button" onClick={onClose} className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-(--d-muted) hover:bg-(--d-panel2) hover:text-(--d-text)">
              <Icon name="x" />
              <span className="sr-only">Close</span>
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-(--d-line) px-5 py-3">{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
