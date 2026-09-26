// Pixel-dither transitions: the site's signature motion.
//
// A <canvas class="dither-canvas"> sits over an element. It is drawn at one
// canvas pixel per `cell` CSS pixels and scaled up with image-rendering:
// pixelated, so each frame fills a tiny ImageData — cheap enough to run on
// any phone. "coverage" 1 = the element is hidden under solid pixels of
// `color`; 0 = fully clear.

// 8×8 Bayer ordered-dither thresholds. Used for the cold, rigid grid.
const BAYER_8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

export type DitherPattern = "grid" | "grain";

type CoverOptions = {
  /** Colour of the pixels: hex (#rrggbb) or rgb()/rgba() from getComputedStyle. */
  color: string;
  from: number;
  to: number;
  duration: number;
  /** "grid" = Bayer (cold world), "grain" = random (warm world). */
  pattern?: DitherPattern;
  /** Size of one dither pixel in CSS px. */
  cell?: number;
};

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Resolves any CSS colour (hex, rgb(), oklab(), color(srgb …) from
// color-mix) to sRGB bytes by painting one pixel.
function parseColor(color: string): [number, number, number] {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as [number, number, number];
  }
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [0, 0, 0];
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

type Surface = {
  ctx: CanvasRenderingContext2D;
  image: ImageData;
  thresholds: Float32Array;
  rgb: [number, number, number];
};

function prepare(canvas: HTMLCanvasElement, color: string, pattern: DitherPattern, cell: number) {
  const { width, height } = canvas.getBoundingClientRect();
  const cols = Math.max(1, Math.ceil(width / cell));
  const rows = Math.max(1, Math.ceil(height / cell));
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const thresholds = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      thresholds[y * cols + x] =
        pattern === "grid" ? (BAYER_8[(y % 8) * 8 + (x % 8)] + 0.5) / 64 : Math.random();
    }
  }
  const surface: Surface = { ctx, image: ctx.createImageData(cols, rows), thresholds, rgb: parseColor(color) };
  return surface;
}

function paint({ ctx, image, thresholds, rgb }: Surface, coverage: number) {
  const data = image.data;
  for (let i = 0; i < thresholds.length; i++) {
    const o = i * 4;
    data[o] = rgb[0];
    data[o + 1] = rgb[1];
    data[o + 2] = rgb[2];
    data[o + 3] = thresholds[i] < coverage ? 255 : 0;
  }
  ctx.putImageData(image, 0, 0);
}

/** Instantly set a canvas to a coverage level (e.g. start fully covered). */
export function setCover(canvas: HTMLCanvasElement, opts: Omit<CoverOptions, "from" | "to" | "duration"> & { coverage: number }) {
  const surface = prepare(canvas, opts.color, opts.pattern ?? "grain", opts.cell ?? 6);
  if (surface) paint(surface, opts.coverage);
}

/** Animate coverage from → to. Resolves when finished. */
export function animateCover(canvas: HTMLCanvasElement, opts: CoverOptions): Promise<void> {
  const surface = prepare(canvas, opts.color, opts.pattern ?? "grain", opts.cell ?? 6);
  if (!surface) return Promise.resolve();
  // Resizing the canvas in prepare() clears it; paint the starting state now
  // so there's no blank frame between two chained animations.
  paint(surface, opts.from);

  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / opts.duration);
      const eased = 1 - (1 - t) * (1 - t); // ease-out
      paint(surface, opts.from + (opts.to - opts.from) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
