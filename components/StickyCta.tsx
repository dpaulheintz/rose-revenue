"use client";

import { useEffect, useState } from "react";

/**
 * Keeps "Book a free call" one tap away: a bottom bar on phones, a pill in
 * the top-right on larger screens. Shows once the hero button has scrolled
 * off, and gets out of the way when the booking section arrives.
 */
export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    const booking = document.getElementById("booking");
    if (!heroCta || !booking) return;

    let pastHero = false;
    let atBooking = false;
    const update = () => setShow(pastHero && !atBooking);

    const heroIo = new IntersectionObserver(([e]) => {
      pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    });
    const bookingIo = new IntersectionObserver(([e]) => {
      atBooking = e.isIntersecting || e.boundingClientRect.top < 0;
      update();
    });
    heroIo.observe(heroCta);
    bookingIo.observe(booking);
    return () => {
      heroIo.disconnect();
      bookingIo.disconnect();
    };
  }, []);

  const state = show
    ? "visible translate-y-0 opacity-100"
    : "invisible opacity-0 motion-safe:translate-y-3";

  return (
    <>
      {/* Phone: bottom bar */}
      <div
        aria-hidden={!show}
        className={`fixed inset-x-0 bottom-0 z-[70] bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-4 pt-6 pb-[max(14px,env(safe-area-inset-bottom))] transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none md:hidden ${state}`}
      >
        <a
          href="#booking"
          tabIndex={show ? 0 : -1}
          className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-full bg-coral font-medium text-ink shadow-[0_10px_30px_-10px_rgb(252_95_96/0.6)]"
        >
          Book a free call <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* Tablet/desktop: top-right pill */}
      <div
        aria-hidden={!show}
        className={`fixed top-5 right-6 z-[70] hidden transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none md:block ${
          show ? "visible translate-y-0 opacity-100" : "invisible opacity-0 motion-safe:-translate-y-3"
        }`}
      >
        <a
          href="#booking"
          tabIndex={show ? 0 : -1}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-coral px-5 text-[15px] font-medium text-ink shadow-[0_10px_30px_-10px_rgb(2_13_2/0.7)]"
        >
          Book a free call <span aria-hidden="true">→</span>
        </a>
      </div>
    </>
  );
}
