import { useRef, type PointerEvent as RPE } from "react";

/**
 * Horizontal swipe on touch: spread the returned handlers on an element. A
 * clear sideways flick (more sideways than down, past `min` px) calls onLeft
 * (finger moved left: go forward) or onRight. Vertical scrolling is untouched.
 */
export function useSwipe(onLeft: () => void, onRight: () => void, min = 56) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: RPE<HTMLElement>) => { if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY }; },
    onPointerUp: (e: RPE<HTMLElement>) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) < min || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      if (dx < 0) onLeft(); else onRight();
    },
    onPointerCancel: () => { start.current = null; },
    style: { touchAction: "pan-y" as const },
  };
}
