import type { ReactNode } from "react";
import type { IconName } from "@demos/kit/types";
import Icon from "./Icon";

/** What a list shows when nothing matches. Say what to do next, not just that it's empty. */
export function EmptyState({ icon = "search", title, hint, action }: { icon?: IconName; title: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="demo-card grid place-items-center gap-2 px-6 py-10 text-center">
      <Icon name={icon} size={28} className="text-(--d-muted)" />
      <p className="font-semibold">{title}</p>
      {hint ? <p className="max-w-[46ch] text-[14px] text-(--d-muted)">{hint}</p> : null}
      {action}
    </div>
  );
}
