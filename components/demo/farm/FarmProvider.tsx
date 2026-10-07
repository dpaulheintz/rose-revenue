"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getDemo, getFarmSeed } from "@/demos/registry";
import { buildFarm } from "@/lib/demo/farm/generate";
import { customerStats, rotationState, skuMap, type CustomerStats } from "@/lib/demo/farm/derive";
import type { FarmData, FarmSeed, Person, SkuSeed, TaskStatus, Visit } from "@/lib/demo/farm/types";
import type { Ymd } from "@/lib/demo/dates";
import { useDemo } from "../DemoProvider";

type FarmCtx = {
  ds: FarmData;
  seed: FarmSeed;
  sku: Map<string, SkuSeed>;
  person: (id: string) => Person;
  stats: Map<string, CustomerStats>;
  rotation: ReturnType<typeof rotationState>;
  moveHerd: () => void;
  eggsToday: Record<string, number>;
  logEggs: (flock: string, eggs: number) => void;
  milkToday: number | null;
  logMilk: (gallons: number) => void;
  notes: Record<string, Array<{ date: Ymd; text: string }>>;
  addNote: (customer: string, text: string) => void;
  visits: Visit[];
  logVisit: (v: Omit<Visit, "id">) => void;
  serviced: Record<string, Ymd>;
  logService: (equipment: string) => void;
  repairs: Array<{ equipment: string; date: Ymd; title: string; cost: number; by: string }>;
  logRepair: (r: { equipment: string; title: string; cost: number; by: string }) => void;
  taskStatus: (id: string, base: TaskStatus) => TaskStatus;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  done: Set<string>; // checklist items ticked today (chores, sanitation)
  toggleDone: (key: string) => void;
};

const Ctx = createContext<FarmCtx | null>(null);

export function useFarm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFarm outside FarmProvider");
  return c;
}

/**
 * The farm dataset plus everything a visitor changes. Rebuilt identically on
 * server and client from (slug, anchor). Nothing persists.
 */
export default function FarmProvider({ slug, anchor, children }: { slug: string; anchor: Ymd; children: ReactNode }) {
  const { notify } = useDemo();
  const cfg = getDemo(slug)!;
  const seed = getFarmSeed(slug)!;
  const ds = useMemo(() => buildFarm(slug, cfg.seed, seed, anchor), [slug, cfg.seed, seed, anchor]);
  const sku = useMemo(() => skuMap(seed), [seed]);
  const stats = useMemo(() => customerStats(ds, seed), [ds, seed]);
  const people = useMemo(() => new Map([...seed.people, seed.vet, seed.processor, seed.lab].map((p) => [p.id, p])), [seed]);
  const person = useCallback((id: string) => people.get(id) ?? { id, name: id, role: "" }, [people]);

  const [moves, setMoves] = useState(0);
  const rotation = useMemo(() => rotationState(ds, moves), [ds, moves]);
  const [eggsToday, setEggs] = useState<Record<string, number>>({});
  const [milkToday, setMilk] = useState<number | null>(null);
  const [notes, setNotes] = useState<FarmCtx["notes"]>({});
  const [addedVisits, setAddedVisits] = useState<Visit[]>([]);
  const [serviced, setServiced] = useState<Record<string, Ymd>>({});
  const [repairs, setRepairs] = useState<FarmCtx["repairs"]>([]);
  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>({});
  const [done, setDone] = useState<Set<string>>(() => new Set());

  const value: FarmCtx = {
    ds, seed, sku, person, stats, rotation,
    moveHerd: () => { setMoves((m) => m + 1); notify(); },
    eggsToday,
    logEggs: (flock, eggs) => { setEggs((e) => ({ ...e, [flock]: (e[flock] ?? 0) + eggs })); notify(); },
    milkToday,
    logMilk: (g) => { setMilk(g); notify(); },
    notes,
    addNote: (customer, text) => { setNotes((n) => ({ ...n, [customer]: [{ date: anchor, text }, ...(n[customer] ?? [])] })); notify(); },
    visits: useMemo(() => [...addedVisits, ...ds.visits], [addedVisits, ds.visits]),
    logVisit: (v) => { setAddedVisits((xs) => [{ ...v, id: `vn${xs.length + 1}` }, ...xs]); notify(); },
    serviced,
    logService: (id) => { setServiced((s) => ({ ...s, [id]: anchor })); notify(); },
    repairs,
    logRepair: (r) => { setRepairs((xs) => [{ ...r, date: anchor }, ...xs]); notify(); },
    taskStatus: (id, base) => statuses[id] ?? base,
    setTaskStatus: (id, status) => { setStatuses((s) => ({ ...s, [id]: status })); notify(); },
    done,
    toggleDone: (key) => setDone((d) => { const n = new Set(d); if (n.has(key)) n.delete(key); else n.add(key); return n; }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
