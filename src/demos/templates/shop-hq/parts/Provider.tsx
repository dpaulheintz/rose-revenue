"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { buildShop } from "../data";
import { emptyLive, shop, type Live } from "../derive";
import type { ShopProspect } from "../types";

type Marks = "called" | "invoiced" | "booked" | "nudged";

function useShopState(prospect: ShopProspect, anchor: string) {
  const { notify } = useDemo();
  const d = useMemo(() => buildShop(prospect, anchor), [prospect, anchor]);
  const [st, setSt] = useState<Live>(emptyLive);
  const s = useMemo(() => shop(prospect, d, st), [prospect, d, st]);
  const mark = (k: Marks, id: string, msg: string) => { setSt((x) => ({ ...x, [k]: { ...x[k], [id]: true } })); notify(msg); };
  return {
    p: prospect, d, s, st, notify,
    call: (id: string, who: string) => mark("called", id, `Calling ${who}. (Demo: nothing dials.)`),
    invoice: (id: string) => mark("invoiced", id, "Invoice sent. It shows on Money now."),
    book: (id: string) => mark("booked", id, "Callback scheduled. The customer gets a text (demo)."),
    nudge: (id: string) => mark("nudged", id, "Follow-up text sent on the estimate (demo)."),
    remind: () => { setSt((x) => ({ ...x, reminded: true })); notify("Renewal reminders texted to members due this month (demo)."); },
  };
}

type Ctx = ReturnType<typeof useShopState>;
const C = createContext<Ctx | null>(null);
export function useShop(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useShop outside the Shop HQ provider");
  return c;
}

export default function ShopProvider({ prospect, anchor, children }: { prospect: ShopProspect; anchor: string; children: ReactNode }) {
  const v = useShopState(prospect, anchor);
  return <C.Provider value={v}>{children}</C.Provider>;
}
