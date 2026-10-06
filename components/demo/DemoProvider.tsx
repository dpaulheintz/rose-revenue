"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { getDemo } from "@/demos/registry";
import type { DemoConfig } from "@/demos/types";
import type { Ymd } from "@/lib/demo/dates";

type DemoCtx = {
  cfg: DemoConfig;
  anchor: Ymd;
  base: string; // e.g. "/demo/<slug>"
  notify: (message?: string) => void;
};

const Ctx = createContext<DemoCtx | null>(null);

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

/**
 * Shell-level state: config, "today", and the toast. Each demo's own data
 * provider sits inside this. Nothing persists; a refresh resets everything.
 */
export default function DemoProvider({ slug, anchor, children }: { slug: string; anchor: Ymd; children: ReactNode }) {
  const cfg = getDemo(slug)!;
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>([]);
  const nextToast = useRef(1);

  const notify = useCallback(
    (message = cfg.copy.toast) => {
      const id = nextToast.current++;
      setToasts((t) => [...t.slice(-2), { id, message }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    },
    [cfg.copy.toast],
  );

  return (
    <Ctx.Provider value={{ cfg, anchor, base: `/demo/${slug}`, notify }}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} className="demo-toast pointer-events-auto flex max-w-md items-start gap-3 rounded-xl bg-(--d-header) px-4 py-3 text-[14px] text-(--d-on-header) shadow-2xl">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--d-accent)" aria-hidden="true" />
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
