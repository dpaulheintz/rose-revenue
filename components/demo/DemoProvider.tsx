"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { getDemo } from "@/demos/registry";
import type { DemoConfig, Person, ProjectStatus } from "@/demos/types";
import { buildDataset, type Dataset, type MaintenanceItem, type MaintenanceStatus, type ProjectItem, type Visit } from "@/lib/demo/generate";
import type { Ymd } from "@/lib/demo/dates";

export const DEMO_TOAST = "Demo mode. In the real system this saves and notifies your team.";

type DemoCtx = {
  cfg: DemoConfig;
  ds: Dataset;
  anchor: Ymd;
  base: string; // e.g. "/demo/ironwolf"
  person: (id: string) => Person;
  visits: Visit[];
  logVisit: (v: Omit<Visit, "id">) => void;
  kpiEdits: Record<string, number>;
  editKpi: (key: string, week: number, value: number) => void;
  maintenance: MaintenanceItem[];
  addIssue: (m: Omit<MaintenanceItem, "id">) => void;
  setIssueStatus: (id: string, status: MaintenanceStatus) => void;
  projectItems: ProjectItem[];
  setItemStatus: (id: string, status: ProjectStatus) => void;
  notify: (message?: string) => void;
};

const Ctx = createContext<DemoCtx | null>(null);

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

/**
 * Holds the generated dataset plus everything a visitor changes. Nothing
 * persists: state lives in React and resets on refresh. The dataset is
 * rebuilt from (config, anchor) identically on server and client.
 */
export default function DemoProvider({ slug, anchor, children }: { slug: string; anchor: Ymd; children: ReactNode }) {
  const cfg = getDemo(slug)!;
  const ds = useMemo(() => buildDataset(cfg, anchor), [cfg, anchor]);

  const people = useMemo(() => {
    const m = new Map<string, Person>();
    for (const p of [...cfg.people, ...cfg.reps]) m.set(p.id, p);
    m.set("you", { id: "you", name: "You", role: "Demo visitor" });
    return m;
  }, [cfg]);
  const person = useCallback((id: string) => people.get(id) ?? { id, name: id, role: "" }, [people]);

  const [addedVisits, setAddedVisits] = useState<Visit[]>([]);
  const [kpiEdits, setKpiEdits] = useState<Record<string, number>>({});
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>(() => ds.maintenance);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>(() => ds.boards.flatMap((b) => b.items));
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const nextToast = useRef(1);

  const notify = useCallback((message = DEMO_TOAST) => {
    const id = nextToast.current++;
    setToasts((t) => [...t.slice(-2), { id, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value: DemoCtx = {
    cfg,
    ds,
    anchor,
    base: `/demo/${slug}`,
    person,
    visits: useMemo(() => [...addedVisits, ...ds.visits], [addedVisits, ds.visits]),
    logVisit: (v) => {
      setAddedVisits((xs) => [{ ...v, id: `new-${xs.length + 1}` }, ...xs]);
      notify();
    },
    kpiEdits,
    editKpi: (key, week, v) => {
      setKpiEdits((e) => ({ ...e, [`${key}:${week}`]: v }));
      notify();
    },
    maintenance,
    addIssue: (m) => {
      setMaintenance((xs) => [{ ...m, id: `m-new-${xs.length + 1}` }, ...xs]);
      notify();
    },
    setIssueStatus: (id, status) => {
      setMaintenance((xs) => xs.map((m) => (m.id === id ? { ...m, status, closedOn: status === "Done" ? anchor : null } : m)));
      notify();
    },
    projectItems,
    setItemStatus: (id, status) => {
      setProjectItems((xs) => xs.map((it) => (it.id === id ? { ...it, status, group: status === "Done" ? "Done" : it.group === "Done" ? "This week" : it.group } : it)));
      notify();
    },
    notify,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} className="demo-toast pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border border-(--d-line) bg-(--d-panel2) px-4 py-3 text-[14px] shadow-2xl">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-(--d-accent)" aria-hidden="true" />
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
