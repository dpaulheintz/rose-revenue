"use client";

import { useMemo } from "react";
import { Scorecard as ScoreTable, type ScoreRow } from "@demos/kit/blocks/Scorecard";
import { TodoList } from "@demos/kit/blocks/TodoList";
import { addDays } from "@demos/kit/data/dates";
import { nextWorkday } from "@demos/simpletimes/data";
import { shortDay, weeks13 } from "@demos/simpletimes/derive";
import { moneyK, Title } from "@demos/simpletimes/parts/bits";
import { useSt } from "@demos/simpletimes/parts/StProvider";

const GOALS = { brandRev: 18000, cpRev: 9000, newAccts: 1, visits: 15, tastings: 2, firstPass: 95 };

export default function Scorecard() {
  const { d, w, notify } = useSt();
  const weeks = useMemo(() => weeks13(d, w), [d, w]);
  const rows: ScoreRow[] = [
    { key: "brandRev", label: "Brand sales", goalText: moneyK(GOALS.brandRev), fmt: moneyK, hit: (n) => n >= GOALS.brandRev },
    { key: "cpRev", label: "Co-pack invoiced", goalText: moneyK(GOALS.cpRev), fmt: moneyK, hit: (n) => n >= GOALS.cpRev },
    { key: "newAccts", label: "New accounts", goalText: `${GOALS.newAccts}`, fmt: (n) => `${n}`, hit: (n) => n >= GOALS.newAccts },
    { key: "visits", label: "Account visits", goalText: `${GOALS.visits}`, fmt: (n) => `${n}`, hit: (n) => n >= GOALS.visits },
    { key: "tastings", label: "Tastings held", goalText: `${GOALS.tastings}`, fmt: (n) => `${n}`, hit: (n) => n >= GOALS.tastings },
    { key: "firstPass", label: "Runs passing QA first time", goalText: `${GOALS.firstPass}%`, fmt: (n) => `${Math.round(n)}%`, hit: (n) => n >= GOALS.firstPass },
  ];
  const last = weeks[weeks.length - 1];
  const onGoal = rows.filter((r) => r.hit(last.values[r.key as keyof typeof last.values])).length;
  const due = (n: number) => shortDay(nextWorkday(addDays(d.today, n)));
  return (
    <div className="space-y-5">
      <Title sub={`Week of ${last.label}: ${onGoal} of ${rows.length} on goal. Pulled from the same orders, runs and visits as everything else.`}>Scorecard</Title>
      <p className="text-[14px] text-(--d-muted) md:hidden">Swipe the table sideways for earlier weeks.</p>
      <ScoreTable weeks={weeks} rows={rows} label="Leadership scorecard, last 13 weeks" />
      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <TodoList title="To-dos" left={(n) => `${n} open`} onCheck={() => notify()} items={[
          { id: "t1", text: "Expedite ginger juice for the next mule runs", sub: <>Purchasing, due {due(1)}</> },
          { id: "t2", text: "Holiday gift bundle display for 5 grocery accounts", sub: <>Kara, due {due(3)}</> },
          { id: "t3", text: "Send Juniper Lane the countersigned agreement", sub: <>You, due {due(2)}</> },
          { id: "t4", text: "Syrup Project samples to bars that carry Mixers only", sub: <>Dale, due {due(5)}</> },
          { id: "t5", text: "Re-test the pH on the run on QA hold", sub: <>Production, due {due(0)}</> },
          { id: "t6", text: "Book two January tastings", sub: <>Kara, due {due(8)}</> },
        ]} />
        <TodoList title="Issues" tone="warn" left={(n) => `${n} to solve`} onCheck={() => notify()} items={[
          { id: "i1", text: "Glass lead times are slipping to 3 weeks" },
          { id: "i2", text: "Co-pack runs and our own runs fight for Kettle 2 in the fall" },
          { id: "i3", text: "Reorders from liquor stores drop off after the holidays" },
          { id: "i4", text: "Only one person can run QA" },
        ]} />
      </div>
    </div>
  );
}
