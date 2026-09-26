"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// The Cal.com embed and its configuration live, unchanged, in BookingEmbed.
// This wrapper only decides *when* to mount it, so ~2 MB of calendar
// doesn't load for people still reading the top of the page.
const BookingEmbed = dynamic(() => import("./BookingEmbed"), { ssr: false });

const CAL_NAMESPACE = "discovery-call"; // must match BookingEmbed
const BOOKING_PAGE = "https://cal.com/paul-heintzman-kzlgtl/discovery-call";

export default function BookingSlot() {
  const slot = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);

  // Mount triggers: any "Book a call" tap (immediately), arriving at
  // #booking, or scrolling within roughly a screen of the calendar.
  useEffect(() => {
    if (load) return;
    const go = () => setLoad(true);
    if (window.location.hash === "#booking") {
      go();
      return;
    }
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.('a[href="#booking"]')) go();
    };
    const onHash = () => {
      if (window.location.hash === "#booking") go();
    };
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("hashchange", onHash);
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && go(), {
      rootMargin: "1200px 0px",
    });
    if (slot.current) io.observe(slot.current);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("hashchange", onHash);
      io.disconnect();
    };
  }, [load]);

  // Keep the loading state up until Cal reports the calendar is ready.
  useEffect(() => {
    if (!load) return;
    let live = true;
    const done = () => live && setReady(true);
    const fallback = window.setTimeout(done, 12000);
    import("@calcom/embed-react").then(async ({ getCalApi }) => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("on", { action: "linkReady", callback: done });
      cal("on", { action: "linkFailed", callback: done });
    });
    return () => {
      live = false;
      window.clearTimeout(fallback);
    };
  }, [load]);

  return (
    <div ref={slot} className="relative min-h-[680px]">
      {load ? <BookingEmbed /> : null}
      {!ready ? (
        <div
          role="status"
          className="absolute inset-0 flex flex-col overflow-hidden rounded-sm border border-hill/50 bg-ink-2/80 p-6 sm:p-8"
        >
          <p className="text-[15px] text-paper">Loading the calendar…</p>
          <div aria-hidden="true" className="mt-6 grid max-w-md grid-cols-7 gap-3 opacity-50">
            {Array.from({ length: 35 }, (_, i) => (
              <span
                key={i}
                className={`aspect-square rounded-md ${i === 17 ? "bg-coral/70" : "bg-paper/10"}`}
              />
            ))}
          </div>
          <p className="mt-auto pt-6 text-[14px] text-muted">
            Taking a while?{" "}
            <a
              href={BOOKING_PAGE}
              target="_blank"
              rel="noopener"
              className="text-coral underline underline-offset-4"
            >
              Open the booking page
            </a>
            <span className="sr-only"> (opens in a new tab)</span>.
          </p>
        </div>
      ) : null}
    </div>
  );
}
