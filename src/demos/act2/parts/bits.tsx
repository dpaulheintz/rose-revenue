"use client";

import { PhotoTile as KitPhotoTile } from "@demos/kit/blocks/PhotoTile";
import type { InvoiceStatus } from "@demos/act2/derive";
import type { CrewId, Photo } from "@demos/act2/model";
import { Pill, type Tone } from "@demos/kit/ui/ui";
import { useShop } from "@demos/act2/parts/ShopProvider";

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






/** This demo's photo tile: tinted by the crew, tag colored by stage. */
export function PhotoTile({ p, crew, size = "md" }: { p: Photo; crew: CrewId; size?: "sm" | "md" }) {
  const { seed } = useShop();
  return <KitPhotoTile id={p.id} tag={p.tag} tagTone={p.tag === "After" ? "good" : p.tag === "During" ? "accent" : "neutral"} caption={p.caption} color={seed.crews.find((c) => c.id === crew)!.color} size={size} />;
}

export { SignaturePad } from "@demos/kit/blocks/SignaturePad";
export { PhoneFrame } from "@demos/kit/blocks/PhoneFrame";
export { usd, count as n } from "@demos/kit/data/format";
