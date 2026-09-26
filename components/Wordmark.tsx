import Image from "next/image";

/**
 * Pixel sun + "Rose Revenue". The sun is the very same file as
 * public/pixel-sun.svg (used in the launch video), so the two never drift.
 */
export default function Wordmark({ size = "md" }: { size?: "md" | "sm" }) {
  const sun = size === "md" ? { w: 24, h: 18 } : { w: 20, h: 15 };
  return (
    <span className={`inline-flex items-center gap-2.5 font-display leading-none tracking-[-0.01em] text-paper ${size === "md" ? "text-[26px]" : "text-[21px]"}`}>
      <Image src="/pixel-sun.svg" alt="" width={sun.w} height={sun.h} unoptimized />
      <span>
        Rose <i>Revenue</i>
      </span>
    </span>
  );
}
