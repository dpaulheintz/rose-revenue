"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { Button } from "@demos/kit/ui/ui";

export type TourStop = { path: string; title: string; say: string };

/** "Take the tour": walks the screens with a one-sentence callout each. Next/Skip; works on touch. */
export function Tour({ stops, label = "Take the tour", onActive }: { stops: TourStop[]; label?: string; onActive?: (on: boolean) => void }) {
  const { base } = useDemo();
  const router = useRouter();
  const [i, setI] = useState<number | null>(null);
  useEffect(() => { if (i != null) router.push(`${base}/${stops[i].path}`); }, [i, base, router, stops]);
  const go = (n: number | null) => { setI(n); onActive?.(n != null); };
  if (i == null) return <Button variant="primary" onClick={() => go(0)}><Icon name="play" size={16} />{label}</Button>;
  const s = stops[i];
  const last = i === stops.length - 1;
  return (
    <>
      <span className="text-[13px] text-(--d-muted)">Tour running</span>
      <div role="dialog" aria-label="Guided tour" className="fixed inset-x-3 bottom-[84px] z-[110] mx-auto max-w-xl rounded-[14px] border border-(--d-accent) bg-(--d-header) p-4 text-(--d-on-header) shadow-2xl md:bottom-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="demo-display text-[18px]">{s.title}</p>
          <p className="shrink-0 text-[12.5px] tabular-nums opacity-75">{i + 1} of {stops.length}</p>
        </div>
        <p className="mt-1 text-[15px] leading-snug opacity-95">{s.say}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => go(null)} className="min-h-12 rounded-xl px-4 text-[14.5px] font-semibold opacity-85 hover:opacity-100">{last ? "Close" : "Skip"}</button>
          {!last ? <button type="button" onClick={() => go(i + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-(--d-accent) px-5 text-[14.5px] font-semibold text-(--d-on-accent) hover:brightness-110">Next <Icon name="arrow" size={16} /></button> : null}
        </div>
      </div>
    </>
  );
}
