"use client";

import type { Order } from "@/lib/demo/farm/types";
import type { StockStatus } from "@/lib/demo/farm/derive";
import { Pill } from "../ui";
import { useFarm } from "./FarmProvider";

/** Who an order is for: customer, wholesale account, or a farm-store walk-in. */
export function CustomerName({ order }: { order: Order }) {
  const { ds, stats } = useFarm();
  if (order.account) return <>{ds.accounts.find((a) => a.id === order.account)?.name}</>;
  if (order.customer) return <>{stats.get(order.customer)?.c.name}</>;
  return <>Walk-in</>;
}

export function useWhere() {
  const { seed } = useFarm();
  return (id: string) => seed.zones.find((z) => z.id === id)?.name ?? seed.sites.find((s) => s.id === id)?.name ?? (id === "store" ? "Farm store" : id);
}

export function StockPill({ status }: { status: StockStatus }) {
  return <Pill tone={status === "Out" ? "bad" : status === "Low" ? "warn" : "good"}>{status}</Pill>;
}

/** Horizontal meter (forage height, progress, fill level). */
export function Meter({ value, max, color = "var(--d-accent)", label }: { value: number; max: number; color?: string; label: string }) {
  const p = Math.max(0, Math.min(1, value / max));
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-(--d-panel2)" role="meter" aria-valuenow={Math.round(value * 10) / 10} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <span className="block h-full rounded-full" style={{ width: `${p * 100}%`, background: color }} />
    </span>
  );
}
