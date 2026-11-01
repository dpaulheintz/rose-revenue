"use client";

import { useEffect, useRef, useState } from "react";

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
