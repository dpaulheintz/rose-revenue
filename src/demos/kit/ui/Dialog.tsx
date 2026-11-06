"use client";

import { useEffect, useId, useRef, type PointerEvent as RPE, type ReactNode } from "react";
import Icon from "@demos/kit/ui/Icon";

/**
 * Native <dialog>: real modal focus trapping, Esc to close, inert page.
 * `drawer` = side panel on desktop, bottom sheet on phones.
 * `sheet` = a drawer that is full height on phones, with a drag handle
 * (pull down to close) and a footer that clears the home bar.
 */
export default function Dialog({
  open, onClose, title, subtitle, children, footer, drawer = false, sheet = false,
}: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; drawer?: boolean; sheet?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pull = useRef<{ y: number; dy: number } | null>(null);
  const onPullDown = (e: RPE<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); pull.current = { y: e.clientY, dy: 0 }; };
  const onPullMove = (e: RPE<HTMLDivElement>) => {
    if (!pull.current || !ref.current) return;
    pull.current.dy = Math.max(0, e.clientY - pull.current.y);
    ref.current.style.transform = `translateY(${pull.current.dy}px)`;
  };
  const onPullEnd = () => {
    const dy = pull.current?.dy ?? 0;
    pull.current = null;
    if (ref.current) ref.current.style.transform = "";
    if (dy > 90) onClose();
  };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`demo-dialog ${drawer || sheet ? "demo-drawer" : ""} ${sheet ? "demo-sheet" : ""}`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={titleId}
    >
      {open ? (
        <div className="flex max-h-[inherit] flex-col">
          {sheet ? (
            <div onPointerDown={onPullDown} onPointerMove={onPullMove} onPointerUp={onPullEnd} onPointerCancel={onPullEnd} className="demo-noselect flex h-6 shrink-0 touch-none cursor-grab items-end justify-center md:hidden" aria-hidden="true">
              <span className="h-1.5 w-11 rounded-full bg-(--d-line)" />
            </div>
          ) : null}
          <header className="flex items-start justify-between gap-3 border-b border-(--d-line) px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="demo-display text-[20px] leading-tight">{title}</h2>
              {subtitle ? <div className="mt-1 text-[13.5px] text-(--d-muted)">{subtitle}</div> : null}
            </div>
            <button type="button" onClick={onClose} className="-mr-2 grid size-12 shrink-0 place-items-center rounded-xl text-(--d-muted) hover:bg-(--d-panel2) hover:text-(--d-text)">
              <Icon name="x" />
              <span className="sr-only">Close</span>
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? <footer className={`flex flex-wrap justify-end gap-2 border-t border-(--d-line) px-5 py-3 ${sheet ? "demo-sheet-bar" : ""}`}>{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
