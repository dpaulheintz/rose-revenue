"use client";

import { useEffect, useRef, useState } from "react";
import { animateCover, prefersReducedMotion } from "@/lib/dither";

// Generic categories with example monthly prices. Never real products.
const PILE: ReadonlyArray<{ name: string; price: number }> = [
  { name: "Customer tracking (CRM)", price: 50 },
  { name: "Invoicing & billing", price: 35 },
  { name: "Scheduling", price: 20 },
  { name: "Project boards", price: 30 },
  { name: "Email marketing", price: 40 },
  { name: "Team chat", price: 25 },
  { name: "Forms & surveys", price: 25 },
  { name: "Reporting dashboards", price: 60 },
  { name: "File storage", price: 20 },
  { name: "E-signatures", price: 25 },
  { name: "Website builder", price: 30 },
  { name: "Time tracking", price: 25 },
];

const COLD_BG = "#dde3ea";
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function Tile({
  name,
  price,
  on,
  onToggle,
}: {
  name: string;
  price: number;
  on: boolean;
  onToggle: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);

  async function handleClick() {
    const el = canvas.current;
    if (!el || busy.current || prefersReducedMotion()) {
      onToggle();
      return;
    }
    // Dissolve into the cold grid, swap state under the pixels, reassemble.
    busy.current = true;
    await animateCover(el, { color: COLD_BG, from: 0, to: 1, duration: 110, pattern: "grid", cell: 4 });
    onToggle();
    await animateCover(el, { color: COLD_BG, from: 1, to: 0, duration: 140, pattern: "grid", cell: 4 });
    busy.current = false;
  }

  return (
    <button type="button" className="tile" aria-pressed={on} onClick={handleClick}>
      <span>{name}</span>
      <span className="tile-price">
        {money(price)}/mo<span className="sr-only"> example price</span>
      </span>
      <span className="tile-box" aria-hidden="true">
        <svg viewBox="0 0 10 10" width="10" height="10">
          <path d="M1.5 5.2l2.3 2.3L8.6 2.7" stroke="#eef1f5" strokeWidth="1.8" fill="none" />
        </svg>
      </span>
      <canvas ref={canvas} className="dither-canvas" aria-hidden="true" />
    </button>
  );
}

/** Counts from the previously shown value to the new one. */
function useTicker(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target || prefersReducedMotion()) {
      from.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 300);
      const value = Math.round(start + (target - start) * (1 - (1 - t) ** 3));
      from.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return shown;
}

export default function PileCalculator() {
  const [on, setOn] = useState<boolean[]>(() => PILE.map(() => true));
  const monthly = PILE.reduce((sum, item, i) => sum + (on[i] ? item.price : 0), 0);
  const shownMonthly = useTicker(monthly);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-mono text-[13px] text-cold-muted">
          Tap off anything you don&rsquo;t pay for.
        </p>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-cold-muted">
          Example prices
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {PILE.map((item, i) => (
          <li key={item.name}>
            <Tile
              name={item.name}
              price={item.price}
              on={on[i]}
              onToggle={() => setOn((prev) => prev.map((v, j) => (j === i ? !v : v)))}
            />
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t-2 border-cold-ink px-1 pt-4">
        <p aria-hidden="true" className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-mono text-[clamp(2.4rem,5vw,3.25rem)] leading-none font-medium tracking-[-0.03em] text-cold-ink">
            {money(shownMonthly)}
            <span className="ml-1 text-[0.4em] tracking-normal text-cold-muted">/mo</span>
          </span>
          <span className="font-mono text-[15px] font-medium text-cold-muted">
            {money(shownMonthly * 12)} a year
          </span>
        </p>
        <p className="mt-2 text-[15px] text-cold-ink">For software built for somebody else.</p>
        <p className="sr-only" aria-live="polite">
          Your example pile: {money(monthly)} a month, {money(monthly * 12)} a year.
        </p>
      </div>
      <p className="mt-3 text-[13px] text-cold-muted">
        Example prices, not quotes. Your pile will look different.
      </p>
    </div>
  );
}
