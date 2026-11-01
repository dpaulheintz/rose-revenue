import { hash } from "@demos/kit/data/rng";
import Icon from "@demos/kit/ui/Icon";
import { Pill, type Tone } from "@demos/kit/ui/ui";

/**
 * Neutral placeholder for a photo (no stock photos of real places). The tint
 * comes from `color`; the pattern is seeded by `id`, so it's stable.
 */
export function PhotoTile({ id, tag, tagTone = "neutral", caption, color, size = "md" }: { id: string; tag: string; tagTone?: Tone; caption: string; color: string; size?: "sm" | "md" }) {
  const h = hash(id) % 360;
  return (
    <figure className="relative overflow-hidden rounded-[10px] border border-(--d-line)" style={{ aspectRatio: "4 / 3", background: `linear-gradient(${h}deg, color-mix(in oklab, ${color} 22%, var(--d-panel2)), var(--d-panel2) 70%)` }}>
      <svg viewBox="0 0 40 30" className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true" preserveAspectRatio="none">
        <path d={`M0 ${22 - (h % 5)} L${8 + (h % 6)} ${12 + (h % 4)} L${18 + (h % 5)} ${19 - (h % 3)} L${27 + (h % 4)} ${9 + (h % 5)} L40 ${17 + (h % 4)} V30 H0Z`} fill="currentColor" />
      </svg>
      <span className="absolute top-2 left-2"><Pill tone={tagTone}>{tag}</Pill></span>
      <Icon name="image" size={size === "sm" ? 18 : 22} className="absolute right-2 bottom-2 text-(--d-muted)" />
      {size === "md" ? <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/45 to-transparent px-2.5 pt-6 pb-1.5 text-[12px] text-white">{caption}</figcaption> : <figcaption className="sr-only">{caption}</figcaption>}
    </figure>
  );
}
