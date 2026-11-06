import type { ReactNode } from "react";

export type PriceLine = { key: string; label: ReactNode; sub?: ReactNode; amount: number };

/**
 * The read-out half of a quote calculator: cost lines, the cost, then the
 * price in big type. Pair it with your own inputs; do the math with
 * data/pricing (withMargin / withMarkup).
 */
export function PriceBreakdown({ lines, cost, total, money, numClass = "demo-display text-[34px]" }: { lines: PriceLine[]; cost?: { label: ReactNode; amount: number }; total: { label: ReactNode; sub?: ReactNode; amount: number }; money: (n: number) => string; numClass?: string }) {
  return (
    <>
      <table className="w-full text-[14px]">
        <tbody>
          {lines.map((l) => (
            <tr key={l.key} className="border-b border-(--d-line)"><td className="py-1.5">{l.label}{l.sub ? <span className="block text-[12.5px] text-(--d-muted)">{l.sub}</span> : null}</td><td className="py-1.5 text-right">{money(l.amount)}</td></tr>
          ))}
          {cost ? <tr><td className="pt-2 text-(--d-muted)">{cost.label}</td><td className="pt-2 text-right text-(--d-muted)">{money(cost.amount)}</td></tr> : null}
        </tbody>
      </table>
      <p className="mt-2 flex items-end justify-between gap-3 border-t-2 border-(--d-text) pt-2"><span className="text-[14px]">{total.label}{total.sub ? <span className="block text-[12.5px] text-(--d-muted)">{total.sub}</span> : null}</span><span className={`${numClass} leading-none`}>{money(total.amount)}</span></p>
    </>
  );
}
