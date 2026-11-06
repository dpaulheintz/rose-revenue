"use client";

import { Button } from "@demos/kit/ui/ui";
import { Chip, H, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

export default function Stock() {
  const { w, notify } = useAt();
  const low = w.stock.filter((p) => p.onTruck < p.min);
  const groups = [...new Set(w.stock.map((p) => p.group))];
  return (
    <div className="space-y-5">
      <Title sub="What's on the truck. Parts used on a job come off the count when you mark it done.">Truck stock</Title>
      {low.length ? (
        <section className="rounded-[16px] border-2 border-(--d-bad) bg-(--d-panel) p-4">
          <H>{low.length} running low</H>
          <ul className="space-y-1.5">{low.map((p) => <li key={p.id} className="flex justify-between gap-3 text-[16px]"><span className="min-w-0">{p.name}</span><span className="shrink-0 font-bold text-(--d-bad)">{Math.max(0, p.onTruck)} left</span></li>)}</ul>
          <Button variant="primary" className="mt-3 w-full" onClick={() => notify("Restock order sent to your supplier (demo).")}>Order these from the supplier</Button>
        </section>
      ) : null}
      {groups.map((g) => (
        <section key={g}>
          <H>{g}</H>
          <ul className="divide-y divide-(--d-line) rounded-[14px] border border-(--d-line) bg-(--d-panel)">
            {w.stock.filter((p) => p.group === g).map((p) => (
              <li key={p.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0 text-[16px]">{p.name}<span className="block text-[14px] text-(--d-muted)">Keep at least {p.min}</span></span>
                <span className="flex shrink-0 items-center gap-2"><span className="demo-display text-[22px]">{Math.max(0, p.onTruck)}</span>{p.onTruck < p.min ? <Chip tone="bad">Low</Chip> : null}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
