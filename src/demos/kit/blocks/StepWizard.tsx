"use client";

import type { ReactNode } from "react";
import { Button } from "@demos/kit/ui/ui";

/**
 * A form split into steps for phones, with a bar pinned to the bottom (above
 * the tab bar) that holds a running summary and Back / Next. Use a plain
 * single-page form on wider screens.
 */
export function StepWizard({
  steps, step, onStep, summary, finish, bottom = "bottom-[calc(64px+env(safe-area-inset-bottom))]",
}: {
  steps: Array<{ key: string; label: string; content: ReactNode }>;
  step: number;
  onStep: (n: number) => void;
  summary: ReactNode; // e.g. the running price
  finish: ReactNode; // buttons on the last step
  bottom?: string; // where the pinned bar sits (above the tab bar)
}) {
  const s = steps[step];
  const last = step === steps.length - 1;
  return (
    <div>
      <ol className="mb-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Steps">
        {steps.map((x, i) => (
          <li key={x.key}>
            <button type="button" onClick={() => onStep(i)} aria-current={i === step ? "step" : undefined} className="block min-h-12 w-full text-left">
              <span className={`block h-1.5 rounded-full ${i <= step ? "bg-(--d-accent)" : "bg-(--d-line)"}`} />
              <span className={`mt-1.5 block truncate text-[13px] ${i === step ? "font-semibold text-(--d-text)" : "text-(--d-muted)"}`}>{x.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <h2 className="demo-display mb-3 text-[24px]">{s.label}</h2>
      <div className="pb-36">{s.content}</div>
      <div className={`fixed inset-x-0 ${bottom} z-[46] border-t border-(--d-line) bg-(--d-panel) px-4 py-3 shadow-[0_-8px_24px_-16px_rgb(0_0_0_/_0.35)]`}>
        <div className="mx-auto flex max-w-[720px] items-center gap-3">
          <div className="min-w-0 flex-1">{summary}</div>
          {step > 0 ? <Button onClick={() => onStep(step - 1)}>Back</Button> : null}
          {last ? finish : <Button variant="primary" onClick={() => onStep(step + 1)}>Next</Button>}
        </div>
      </div>
    </div>
  );
}
