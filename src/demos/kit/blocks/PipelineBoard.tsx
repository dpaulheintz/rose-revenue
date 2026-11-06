"use client";

import type { ReactNode } from "react";
import Kanban from "@demos/kit/ui/Kanban";

/**
 * A pipeline (leads, projects, orders): a Kanban whose column headers are
 * stage pills. stageClass gives each stage its pill colors; total, if given,
 * shows a figure beside the pill (e.g. the dollar value in that stage).
 */
export function PipelineBoard<T extends { id: string; name: string }, S extends string>({
  items, stages, stageOf, onMove, renderCard, stageClass, total, scrollOnly,
}: {
  items: T[];
  stages: S[];
  stageOf: (item: T) => S;
  onMove: (id: string, to: S) => void;
  renderCard: (item: T, grip: ReactNode, ghost: boolean) => ReactNode;
  stageClass: (s: S) => string;
  total?: (inStage: T[]) => ReactNode;
  scrollOnly?: boolean;
}) {
  return (
    <Kanban<T, S>
      items={items}
      columns={stages}
      statusOf={stageOf}
      onMove={onMove}
      scrollOnly={scrollOnly}
      renderCard={renderCard}
      columnLabel={(s) => {
        const pill = <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${stageClass(s)}`}>{s}</span>;
        return total ? <span className="inline-flex items-center gap-2">{pill}<span className="text-[12.5px] text-(--d-muted)">{total(items.filter((i) => stageOf(i) === s))}</span></span> : pill;
      }}
    />
  );
}
