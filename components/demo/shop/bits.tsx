"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { hash } from "@/lib/demo/rng";
import type { InvoiceStatus } from "@/lib/demo/shop/derive";
import type { CrewId, Photo } from "@/lib/demo/shop/types";
import Icon from "../Icon";
import { Pill, type Tone } from "../ui";
import { useShop } from "./ShopProvider";

export const INVOICE_TONE: Record<InvoiceStatus, Tone> = { Draft: "neutral", Sent: "info", Viewed: "accent", "Partially paid": "warn", Paid: "good", Overdue: "bad" };
export const StatusChip = ({ status }: { status: InvoiceStatus }) => <Pill tone={INVOICE_TONE[status]}>{status}</Pill>;

export function CrewDot({ crew, className = "" }: { crew: CrewId; className?: string }) {
  const { seed } = useShop();
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${className}`} style={{ background: seed.crews.find((c) => c.id === crew)!.color }} aria-hidden="true" />;
}

export function CrewTag({ crew }: { crew: CrewId }) {
  const { seed } = useShop();
  const c = seed.crews.find((x) => x.id === crew)!;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-(--d-muted)">
      <CrewDot crew={crew} />
      {c.name}
    </span>
  );
}

/** Neutral placeholder for a job photo (no stock photos of real homes). */
export function PhotoTile({ p, crew, size = "md" }: { p: Photo; crew: CrewId; size?: "sm" | "md" }) {
  const { seed } = useShop();
  const color = seed.crews.find((c) => c.id === crew)!.color;
  const h = hash(p.id) % 360;
  return (
    <figure className="relative overflow-hidden rounded-[10px] border border-(--d-line)" style={{ aspectRatio: "4 / 3", background: `linear-gradient(${h}deg, color-mix(in oklab, ${color} 22%, var(--d-panel2)), var(--d-panel2) 70%)` }}>
      <svg viewBox="0 0 40 30" className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true" preserveAspectRatio="none">
        <path d={`M0 ${22 - (h % 5)} L${8 + (h % 6)} ${12 + (h % 4)} L${18 + (h % 5)} ${19 - (h % 3)} L${27 + (h % 4)} ${9 + (h % 5)} L40 ${17 + (h % 4)} V30 H0Z`} fill="currentColor" />
      </svg>
      <span className="absolute top-2 left-2"><Pill tone={p.tag === "After" ? "good" : p.tag === "During" ? "accent" : "neutral"}>{p.tag}</Pill></span>
      <Icon name="image" size={size === "sm" ? 18 : 22} className="absolute right-2 bottom-2 text-(--d-muted)" />
      {size === "md" ? <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/45 to-transparent px-2.5 pt-6 pb-1.5 text-[12px] text-white">{p.caption}</figcaption> : <figcaption className="sr-only">{p.caption}</figcaption>}
    </figure>
  );
}

/** Finger / mouse signature. Calls onChange(true) once there's ink. */
export function SignaturePad({ onChange, label = "Sign here" }: { onChange: (signed: boolean) => void; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [inked, setInked] = useState(false);
  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * ratio;
    c.height = r.height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#14171b";
  }, []);
  const pt = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  return (
    <div>
      <div className="relative overflow-hidden rounded-[10px] border-2 border-dashed border-(--d-line) bg-white">
        <canvas
          ref={ref}
          className="block h-36 w-full touch-none"
          aria-label={label}
          role="img"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; const ctx = ref.current!.getContext("2d")!; const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(x, y); }}
          onPointerMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const [x, y] = pt(e); ctx.lineTo(x, y); ctx.stroke(); if (!inked) { setInked(true); onChange(true); } }}
          onPointerUp={() => { drawing.current = false; }}
        />
        {!inked ? <span className="pointer-events-none absolute inset-0 grid place-items-center text-[14px] text-[#6b7178]">{label}</span> : null}
        <span className="pointer-events-none absolute inset-x-6 bottom-6 border-b border-[#c3c8ce]" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] font-semibold text-(--d-muted) hover:text-(--d-text)"
        onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setInked(false); onChange(false); }}
      >
        Clear signature
      </button>
    </div>
  );
}

/** Phone frame for the "what your customer sees" screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[42px] border-[10px] border-[#20252c] bg-[#f6f7f8] p-0 shadow-2xl">
      <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-[#c9ced4]" aria-hidden="true" />
      <div className="max-h-[640px] overflow-y-auto px-4 pt-3 pb-5 text-[#14171b]">{children}</div>
    </div>
  );
}

export const usd = (n: number, cents = false) => (cents ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${Math.round(n).toLocaleString("en-US")}`);

/** "1 job", "3 jobs". */
export const n = (count: number, word: string, plural = `${word}s`) => `${count.toLocaleString("en-US")} ${count === 1 ? word : plural}`;
