"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import Icon from "@demos/kit/ui/Icon";
import { Button, PageHeader, Pill } from "@demos/kit/ui/ui";

export type AskAnswer = { text: ReactNode; source: string; cite?: string }; // source = a config.modules key; cite = the document it came from
export type AskIntent = { q: string; match: RegExp; run: () => AskAnswer };

const LOOK = {
  soft: { icon: "rounded-xl", bubble: "rounded-2xl rounded-br-md", answer: "max-w-[92%]", form: "rounded-2xl" },
  sharp: { icon: "rounded-[10px]", bubble: "rounded-[14px] rounded-br-[4px]", answer: "max-w-[94%]", form: "rounded-[14px]" },
} as const;

/**
 * Chat-style "ask your data" box with canned answers. Each intent is a chip
 * (its question) plus a regex for typed questions; answers are computed by
 * the demo from its own data (no API) and link to the module they came from.
 */
export function AskBox({
  title, intro, placeholder, fallback, intents, look = "soft", bubble = "header", concept = "Concept: ask questions of your own data",
}: { title: string; intro: ReactNode; placeholder: string; fallback: ReactNode; intents: AskIntent[]; look?: keyof typeof LOOK; bubble?: "header" | "accent"; concept?: string }) {
  const { cfg, base } = useDemo();
  const L = LOOK[look];
  const [msgs, setMsgs] = useState<Array<{ id: number; q: string; a: AskAnswer | null }>>([]);
  const [q, setQ] = useState("");
  const id = useId();
  const end = useRef<HTMLDivElement>(null);
  const next = useRef(1);
  useEffect(() => { if (msgs.length) end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs]);
  const ask = (text: string) => {
    const it = intents.find((i) => i.q === text) ?? intents.find((i) => i.match.test(text));
    setMsgs((m) => [...m, { id: next.current++, q: text, a: it ? it.run() : null }]);
    setQ("");
  };
  const mod = (key: string) => cfg.modules.find((m) => m.key === key)!;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={title} meta={<Pill tone="accent">{concept}</Pill>} />
      <div className="demo-card p-4 sm:p-5">
        <div className="flex gap-3">
          <span className={`grid size-10 shrink-0 place-items-center ${L.icon} bg-(--d-accent) text-(--d-on-accent)`}><Icon name="chat" size={20} /></span>
          <p className="text-[15px]">{intro}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {intents.map((i) => (
            <button key={i.q} type="button" onClick={() => ask(i.q)} className="inline-flex min-h-12 items-center rounded-full border border-(--d-line) bg-(--d-panel) px-4 text-left text-[14px] font-medium hover:border-(--d-accent)">{i.q}</button>
          ))}
        </div>
      </div>

      <ol className="mt-5 space-y-4" aria-live="polite">
        {msgs.map((m) => (
          <li key={m.id} className="space-y-2">
            <p className={`ml-auto w-fit max-w-[85%] ${L.bubble} ${bubble === "header" ? "bg-(--d-header) text-(--d-on-header)" : "bg-(--d-accent) text-(--d-on-accent)"} px-4 py-2.5 text-[15px]`}>{m.q}</p>
            <div className={`demo-card ${L.answer} p-4 text-[15px] leading-relaxed`}>
              {m.a ? (
                <>
                  <p>{m.a.text}</p>
                  <Link href={`${base}/${mod(m.a.source).path}`} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-(--d-accent)">
                    <Icon name={mod(m.a.source).icon} size={16} />Source: {m.a.cite ?? mod(m.a.source).label}<Icon name="arrow" size={14} />
                  </Link>
                </>
              ) : (
                <p>{fallback}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div ref={end} />

      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q.trim()); }} className={`sticky bottom-[84px] mt-5 flex gap-2 ${L.form} bg-(--d-bg)/90 py-2 backdrop-blur md:bottom-4`}>
        <label htmlFor={id} className="sr-only">Ask a question</label>
        <input id={id} className="demo-input" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        <Button type="submit" variant="primary" disabled={!q.trim()}><Icon name="arrow" size={18} /><span className="sr-only sm:not-sr-only">Ask</span></Button>
      </form>
    </div>
  );
}
