"use client";

import { useState } from "react";
import { shortDate } from "@/lib/demo/format";
import type { PhotoTag } from "@/lib/demo/shop/types";
import Icon from "../../Icon";
import { Button, Card, FilterChip, PageHeader } from "../../ui";
import { PhotoTile } from "../bits";
import { useShop } from "../ShopProvider";

export default function Photos() {
  const { book, job, open, worker } = useShop();
  const [tag, setTag] = useState<PhotoTag | "All">("All");
  // Jobs with the newest photos first (a photo you just added jumps to the top).
  const latest = new Map<string, string>();
  book.photos.forEach((p, i) => { const k = `${p.date}|${String(99999 - i).padStart(5, "0")}`; if (!latest.has(p.job) || k > latest.get(p.job)!) latest.set(p.job, k); });
  const recentJobs = [...latest].sort((a, b) => (a[1] < b[1] ? 1 : -1)).map(([j]) => j).slice(0, 10);
  const notes = book.notes.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
  return (
    <div className="space-y-5">
      <PageHeader title="Photos & notes" meta={`${book.photos.length} photos across ${new Set(book.photos.map((p) => p.job)).size} jobs · placeholders stand in for the crew's phone photos`} actions={<Button variant="primary" onClick={() => open({ kind: "quick", what: "photo" })}><Icon name="camera" size={18} />Add photo</Button>} />
      <div className="demo-scroll-x -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:px-0">
        {(["All", "Before", "During", "After"] as const).map((t) => <FilterChip key={t} on={tag === t} onClick={() => setTag(t)} count={t === "All" ? book.photos.length : book.photos.filter((p) => p.tag === t).length}>{t}</FilterChip>)}
      </div>
      <div className="space-y-5">
        {recentJobs.map((jid) => {
          const j = job(jid);
          const ps = book.photos.filter((p) => p.job === jid && (tag === "All" || p.tag === tag));
          if (!ps.length) return null;
          return (
            <section key={jid} aria-label={`${j.no} photos`}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <button type="button" onClick={() => open({ kind: "job", id: jid })} className="min-h-11 text-left"><span className="demo-display text-[18px]">{j.title}</span> <span className="text-[13px] text-(--d-muted)">· {j.no} · {shortDate(j.start)}</span></button>
                <Button variant="ghost" onClick={() => open({ kind: "quick", what: "photo", job: jid })}><Icon name="plus" size={16} />Add</Button>
              </div>
              <ul className="grid *:min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {ps.map((p) => <li key={p.id}><PhotoTile p={p} crew={j.crew} /></li>)}
              </ul>
            </section>
          );
        })}
      </div>
      <Card title="Latest notes">
        <ul className="divide-y divide-(--d-line) text-[14px]">
          {notes.map((n) => (
            <li key={n.id} className="py-2.5">
              <p>{n.text}</p>
              <button type="button" onClick={() => open({ kind: "job", id: n.job })} className="mt-0.5 inline-flex min-h-11 items-center text-[12.5px] text-(--d-muted) underline-offset-2 hover:underline">{worker(n.by).name} · {job(n.job).no} {job(n.job).title} · {shortDate(n.date)}</button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
