// Seasonality: a 12-month demand curve (Jan..Dec), 1.0 = an average month.

import { monthIndex, type Ymd } from "./dates";

/** Build a curve from peaks, e.g. seasonCurve([{ month: 6, strength: 0.6 }, { month: 0, strength: 0.4 }]). Months are 0-based. */
export function seasonCurve(peaks: Array<{ month: number; strength: number; width?: number }>, base = 1): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    let v = base;
    for (const p of peaks) {
      const dist = Math.min(Math.abs(m - p.month), 12 - Math.abs(m - p.month));
      const w = p.width ?? 1.6;
      v += p.strength * Math.exp(-(dist * dist) / (2 * w * w));
    }
    return Math.round(v * 100) / 100;
  });
}
export const seasonOf = (curve: number[], d: Ymd) => curve[monthIndex(d)];
