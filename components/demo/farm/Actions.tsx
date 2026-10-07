"use client";

import { useId, useState } from "react";
import { num } from "@/lib/demo/format";
import Dialog from "../Dialog";
import Icon from "../Icon";
import { Button } from "../ui";
import { useFarm } from "./FarmProvider";

/** Big −/+ number entry for gloves and phones. */
function Stepper({ value, onChange, step, label, unit }: { value: number; onChange: (n: number) => void; step: number; label: string; unit: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-semibold text-(--d-muted)">{label}</label>
      <div className="mt-1.5 flex items-stretch gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - step))} className="grid min-h-16 w-16 shrink-0 place-items-center rounded-2xl border border-(--d-line) bg-(--d-panel2) text-[28px] font-semibold" aria-label={`Minus ${step}`}>−</button>
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            inputMode="numeric"
            className="demo-input demo-display h-16 text-center !text-[32px]"
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
          />
          <span className="pointer-events-none absolute right-4 bottom-2 text-[12px] text-(--d-muted)">{unit}</span>
        </div>
        <button type="button" onClick={() => onChange(value + step)} className="grid min-h-16 w-16 shrink-0 place-items-center rounded-2xl border border-(--d-line) bg-(--d-panel2) text-[28px] font-semibold" aria-label={`Plus ${step}`}>+</button>
      </div>
    </div>
  );
}

export function LogEggsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ds, logEggs, eggsToday } = useFarm();
  const last = ds.eggs.at(-1)!;
  const [flock, setFlock] = useState(ds.flocks[0].id);
  const fi = ds.flocks.findIndex((f) => f.id === flock);
  const [count, setCount] = useState<number | null>(null);
  const value = count ?? Math.round(last.byFlock[fi] / 2);
  const formId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log eggs"
      subtitle="Count one collection round for a flock."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Log {num(value)} eggs</Button></>}
    >
      <form id={formId} onSubmit={(e) => { e.preventDefault(); logEggs(flock, value); setCount(null); onClose(); }} className="space-y-5">
        <fieldset>
          <legend className="text-[13px] font-semibold text-(--d-muted)">Flock</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {ds.flocks.map((f) => (
              <label key={f.id} className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-2xl border text-center ${f.id === flock ? "border-(--d-accent) bg-(--d-accent) text-(--d-on-accent)" : "border-(--d-line) bg-(--d-panel)"}`}>
                <input type="radio" name="flock" value={f.id} checked={f.id === flock} onChange={() => { setFlock(f.id); setCount(null); }} className="sr-only" />
                <span className="font-semibold">{f.name}</span>
                <span className="text-[12px] opacity-80">{f.coop}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Stepper value={value} onChange={setCount} step={12} label="Eggs collected" unit="eggs" />
        <p className="text-[13px] text-(--d-muted)">
          Yesterday {ds.flocks[fi].name} laid {num(last.byFlock[fi])}. Logged so far today: {num(eggsToday[flock] ?? 0)}.
        </p>
      </form>
    </Dialog>
  );
}

export function LogMilkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ds, logMilk, milkToday } = useFarm();
  const last = ds.milk.at(-1)!;
  const [g, setG] = useState<number | null>(null);
  const value = g ?? milkToday ?? Math.round(last.gallons);
  const formId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Log milk"
      subtitle="Bulk tank reading after this morning's milking."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" form={formId}>Log {num(value)} gallons</Button></>}
    >
      <form id={formId} onSubmit={(e) => { e.preventDefault(); logMilk(value); setG(null); onClose(); }} className="space-y-4">
        <Stepper value={value} onChange={setG} step={5} label="Gallons in the tank" unit="gal" />
        <p className="text-[13px] text-(--d-muted)">Yesterday: {num(last.gallons)} gal. Herdshare owners take about {num(last.herdshare)} gal a day.</p>
      </form>
    </Dialog>
  );
}

export function MoveHerdDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rotation, moveHerd } = useFarm();
  const { current, next } = rotation;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Move the herd"
      subtitle="Open the gate to the next paddock in the rotation."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { moveHerd(); onClose(); }}>Move to {next.name}</Button></>}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="rounded-2xl border border-(--d-line) p-4">
          <p className="text-[12.5px] font-semibold text-(--d-muted)">Leaving</p>
          <p className="demo-display mt-1 text-[20px]">{current.name}</p>
          <p className="mt-1 text-[13px] text-(--d-muted)">Grazed to {current.height.toFixed(1)}″ · day {current.dayIn} of {current.stay}</p>
        </div>
        <Icon name="arrow" size={26} className="text-(--d-accent)" />
        <div className="rounded-2xl border-2 border-(--d-accent) p-4">
          <p className="text-[12.5px] font-semibold text-(--d-muted)">Moving to</p>
          <p className="demo-display mt-1 text-[20px]">{next.name}</p>
          <p className="mt-1 text-[13px] text-(--d-muted)">{next.height.toFixed(1)}″ · rested {next.rest} days · {next.acres} ac</p>
        </div>
      </div>
      <p className="mt-4 text-[13px] text-(--d-muted)">Eggmobiles follow into {current.name} in about three days.</p>
    </Dialog>
  );
}

/** The three chore-mode buttons. */
export function ChoreButtons({ layout = "row" }: { layout?: "row" | "stack" }) {
  const [open, setOpen] = useState<"eggs" | "milk" | "move" | null>(null);
  const { ds, rotation, eggsToday, milkToday } = useFarm();
  const eggsLogged = Object.values(eggsToday).reduce((s, n) => s + n, 0);
  const items = [
    { key: "eggs" as const, icon: "egg" as const, label: "Log eggs", sub: eggsLogged ? `${num(eggsLogged)} logged today` : `Yesterday ${num(ds.eggs.at(-1)!.eggs)}` },
    { key: "milk" as const, icon: "jug" as const, label: "Log milk", sub: milkToday != null ? `${num(milkToday)} gal logged` : `Yesterday ${num(ds.milk.at(-1)!.gallons)} gal` },
    { key: "move" as const, icon: "move" as const, label: "Move paddock", sub: `Next: ${rotation.next.name}` },
  ];
  return (
    <>
      <div className={layout === "row" ? "grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-3" : "grid gap-2.5"}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => setOpen(it.key)}
            className="flex min-h-[76px] items-center gap-3.5 rounded-2xl bg-(--d-accent) px-4 text-left text-(--d-on-accent) shadow-[inset_0_-3px_0_rgb(0_0_0_/_0.18)] transition-[filter] hover:brightness-110 active:brightness-95"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-black/15"><Icon name={it.icon} size={24} /></span>
            <span className="min-w-0">
              <span className="block text-[17px] font-bold leading-tight">{it.label}</span>
              <span className="block truncate text-[12.5px] text-[#f4efdf]">{it.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <LogEggsDialog open={open === "eggs"} onClose={() => setOpen(null)} />
      <LogMilkDialog open={open === "milk"} onClose={() => setOpen(null)} />
      <MoveHerdDialog open={open === "move"} onClose={() => setOpen(null)} />
    </>
  );
}

