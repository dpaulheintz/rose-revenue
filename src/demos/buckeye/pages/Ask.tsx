"use client";

import { shortDay } from "@demos/buckeye/derive";
import { industry as ind } from "@demos/buckeye/industry";
import { AskBox, type AskIntent } from "@demos/kit/blocks/AskBox";
import { useShop } from "@demos/buckeye/parts/BuckeyeProvider";
import { v } from "@demos/buckeye/parts/bits";

export default function Ask() {
  const { k, customer } = useShop();
  const sopIntents: AskIntent[] = ind.asks.map((a) => {
    const sop = ind.sops.find((s) => s.id === a.sop)!;
    return { q: a.q, match: new RegExp(a.match, "i"), run: () => ({ text: sop.body, source: "ask", cite: `${sop.id}, ${sop.title}` }) };
  });
  const dataIntents: AskIntent[] = [
    {
      q: `Which ${v.jobs} are late?`, match: /late|behind|overdue/i,
      run: () => ({ source: "jobs", text: k.late.length ? `${k.late.length} right now: ${k.late.map((j) => `${j.id} for ${customer(j.customerId).name}, due ${shortDay(j.dueDate)}, now at ${j.atLabel}`).join("; ")}.` : `None. Every open ${v.job} is on track or at risk, not late.` }),
    },
    {
      q: `What ${v.material} are we about to run out of?`, match: /run(ning)? out|short|low|stock|material/i,
      run: () => ({ source: "inventory", text: k.shortages.length ? k.shortages.map((s) => `${s.material.name}: ${s.before} ${s.material.unit} left when ${s.job.id} needs ${Math.round(s.job.matNeed)} on ${shortDay(s.need)}.`).join(" ") : `Nothing runs out before a ${v.job} needs it. ${k.low.length} items are below their reorder point.` }),
    },
  ];
  return (
    <AskBox
      title={v.ask} look="sharp" bubble="accent" concept={v.askConcept}
      intro={<>Ask about your procedures or what&apos;s happening on the floor. Answers come from your own documents and records, with the source cited. These are canned for the demo.</>}
      placeholder={`Ask about your ${v.shop}`}
      fallback={<>In this demo I only know a few questions. Tap one above. In your system this would search your own procedures and records.</>}
      intents={[...sopIntents.slice(0, 2), dataIntents[0], ...sopIntents.slice(2), dataIntents[1]]}
    />
  );
}
