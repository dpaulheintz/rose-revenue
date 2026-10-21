// Deterministic randomness. The same seed + anchor date always produces the
// same dataset, on the server and in the browser (no hydration mismatches).

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof makeRng>;

export function makeRng(seed: number) {
  const next = mulberry32(seed);
  const rng = {
    next,
    /** float in [min, max) */
    range: (min: number, max: number) => min + (max - min) * next(),
    /** integer in [min, max] */
    int: (min: number, max: number) => Math.floor(min + (max - min + 1) * next()),
    chance: (p: number) => next() < p,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    /** roughly normal around 1, spread ≈ ±sd */
    jitter: (sd: number) => 1 + sd * ((next() + next() + next()) * 2 / 3 - 1) * 1.7,
    weighted: <T,>(items: readonly T[], weight: (item: T) => number): T => {
      let total = 0;
      for (const it of items) total += Math.max(0, weight(it));
      let r = next() * total;
      for (const it of items) {
        r -= Math.max(0, weight(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle: <T,>(items: T[]): T[] => {
      const a = items.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
  return rng;
}

/** Stable 32-bit hash for deriving sub-seeds from strings. */
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
