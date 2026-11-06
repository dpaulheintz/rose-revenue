"use client";

import { addWork } from "@demos/buckeye/data";
import { shortDay } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { Scorecard as ScoreTable, type ScoreRow } from "@demos/kit/blocks/Scorecard";
import { TodoList } from "@demos/kit/blocks/TodoList";
import { moneyK } from "@demos/kit/data/format";
import { PageHeader } from "@demos/kit/ui/ui";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";

export default function Scorecard() {
  const { shop, notify } = useShop();
  const t = ind.targets;
  const rows: ScoreRow[] = [
    { key: "onTime", label: "On-time delivery", goalText: `${t.onTime}%`, fmt: (n) => `${n.toFixed(0)}%`, hit: (n) => n >= t.onTime },
    { key: "scrap", label: ind.vocab.Scrap, goalText: `Under ${t.scrap}%`, fmt: (n) => `${n.toFixed(1)}%`, hit: (n) => n <= t.scrap },
    { key: "utilization", label: "Utilization", goalText: `${t.utilization}%`, fmt: (n) => `${n.toFixed(0)}%`, hit: (n) => n >= t.utilization },
    { key: "cash", label: "Cash collected", goalText: moneyK(t.cash), fmt: (n) => moneyK(n), hit: (n) => n >= t.cash },
    { key: "quotesWon", label: "Quotes won", goalText: `${t.quotesWon}`, fmt: (n) => `${n}`, hit: (n) => n >= t.quotesWon },
  ];
  const weeks = shop.weeks.map((w) => ({ id: w.start, label: w.label, values: { onTime: w.onTime, scrap: w.scrap, utilization: w.utilization, cash: w.cash, quotesWon: w.quotesWon } }));
  const last = shop.weeks[shop.weeks.length - 1];
  const onTrack = rows.filter((r) => r.hit(weeks[weeks.length - 1].values[r.key as keyof (typeof weeks)[number]["values"]])).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Weekly Scorecard" meta={`Week of ${last.label}: ${onTrack} of ${rows.length} on goal. Built from the same ${ind.vocab.jobs} as every other screen, with no spreadsheet.`} />

      <ScoreTable weeks={weeks} rows={rows} label="Scorecard, last 13 weeks" />

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <TodoList
          title="To-dos" left={(n) => `${n} open`} onCheck={() => notify()}
          items={ind.todos.map(([text, who, days]) => ({ id: text, text, sub: <>{ind.staff.find((s) => s.id === who)?.name} · due {shortDay(addWork(shop.today, days))}</> }))}
        />
        <TodoList title="Issues" tone="warn" left={(n) => `${n} to solve`} onCheck={() => notify()} items={ind.issues.map((text) => ({ id: text, text }))} />
      </div>
    </div>
  );
}
