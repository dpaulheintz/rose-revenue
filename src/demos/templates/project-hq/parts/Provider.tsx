"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useDemo } from "@demos/kit/shell/DemoProvider";
import { buildProjects, type ChangeOrder } from "../data";
import { emptyLive, view, type Live } from "../derive";
import type { ProjectProspect } from "../types";
import ProjectSheet from "./ProjectSheet";

function useProjectState(prospect: ProjectProspect, anchor: string) {
  const { notify } = useDemo();
  const d = useMemo(() => buildProjects(prospect, anchor), [prospect, anchor]);
  const [st, setSt] = useState<Live>(emptyLive);
  const [open, setOpen] = useState<string | null>(null);
  const v = useMemo(() => view(prospect, d, st), [prospect, d, st]);
  return {
    p: prospect, d, v, st, notify, open, openProject: setOpen,
    setCo: (id: string, status: ChangeOrder["status"]) => { setSt((s) => ({ ...s, coStatus: { ...s.coStatus, [id]: status } })); notify(status === "Approved" ? "Marked approved. The project's revised contract and billing update now." : "Change order updated."); },
    passBall: (id: string, to: ChangeOrder["ball"]) => { setSt((s) => ({ ...s, ball: { ...s.ball, [id]: to } })); notify(`Sent to the ${to === "GC" ? "GC" : to.toLowerCase()} with a reminder in 5 days (demo).`); },
    sendPayApp: (id: string) => { setSt((s) => ({ ...s, sent: { ...s.sent, [id]: true } })); notify("Pay app drafted from this month's progress and sent for review (demo)."); },
  };
}

type Ctx = ReturnType<typeof useProjectState>;
const C = createContext<Ctx | null>(null);
export function useProjects(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useProjects outside the Project HQ provider");
  return c;
}

export default function ProjectProvider({ prospect, anchor, children }: { prospect: ProjectProspect; anchor: string; children: ReactNode }) {
  const value = useProjectState(prospect, anchor);
  return (
    <C.Provider value={value}>
      {children}
      {value.open ? <ProjectSheet id={value.open} /> : null}
    </C.Provider>
  );
}
