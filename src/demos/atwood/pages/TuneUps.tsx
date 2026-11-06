"use client";

import { useMemo, useState } from "react";
import { Button } from "@demos/kit/ui/ui";
import { shortDay, tuneups } from "@demos/atwood/derive";
import { Card, Chip, H, money, Tile, Title } from "@demos/atwood/parts/bits";
import { useAt } from "@demos/atwood/parts/AtProvider";

export default function TuneUps() {
  const { d, w, st, remind, open } = useAt();
  const t = useMemo(() => tuneups(d, w, d.customers), [d, w]);
  const [limit, setLimit] = useState(20);
  const notSent = t.due.filter((x) => !st.reminded[x.c.id]);
  const text = (first: string) => `Hi ${first}, it's been about a year since we worked on your garage door. A $119 tune-up (lube, balance, safety check, new rollers if you need them) keeps it quiet and safe through winter. Want me to set you up next week? Reply YES. Atwood Door Co.`;
  return (
    <div className="space-y-5">
      <Title sub="Past customers whose door hasn't been looked at in over a year.">Tune-up reminders</Title>
      <div className="grid grid-cols-2 gap-2.5 *:min-w-0">
        <Tile label="Due for a tune-up" value={t.due.length} />
        <Tile label="If 1 in 4 book" value={money(t.ifQuarter)} tone="good" sub="At $119 a visit" />
      </div>
      <section className="rounded-[16px] border border-(--d-line) bg-(--d-panel) p-4">
        <H>The text they get</H>
        <div className="rounded-[16px] rounded-br-[4px] bg-(--d-accent) p-4 text-[16px] text-white">{text(t.due[0]?.c.contact.split(" ")[0] ?? "there")}</div>
        <Button variant="primary" className="mt-3 w-full" disabled={!notSent.length} onClick={() => remind(notSent.map((x) => x.c.id))}>{notSent.length ? `Send to all ${notSent.length}` : "Sent to everyone"}</Button>
      </section>
      <section>
        <H>Due list</H>
        <ul className="grid gap-2.5 *:min-w-0 md:grid-cols-2">
          {t.due.slice(0, limit).map(({ c, last }) => (
            <li key={c.id}>
              <Card title={c.name} meta={`${c.town}. Last visit ${shortDay(last)}, ${last.slice(0, 4)}. ${c.door.opener === "None (manual)" ? "Manual door" : c.door.opener}`}
                right={st.reminded[c.id] ? <Chip tone="good">Sent</Chip> : <Chip tone="warn">{Math.floor((Date.parse(d.today) - Date.parse(last)) / 2629800000)} mo</Chip>}
                onClick={() => open({ kind: "customer", id: c.id })} />
            </li>
          ))}
        </ul>
        {t.due.length > limit ? <div className="mt-3 flex justify-center"><Button onClick={() => setLimit((l) => l + 20)}>Show more</Button></div> : null}
      </section>
    </div>
  );
}
