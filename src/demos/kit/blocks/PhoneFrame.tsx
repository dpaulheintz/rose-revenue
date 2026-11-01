import type { ReactNode } from "react";

/** Phone frame for the "what your customer sees" screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[42px] border-[10px] border-[#20252c] bg-[#f6f7f8] p-0 shadow-2xl">
      <div className="mx-auto mt-2 h-1.5 w-20 rounded-full bg-[#c9ced4]" aria-hidden="true" />
      <div className="max-h-[640px] overflow-y-auto px-4 pt-3 pb-5 text-[#14171b]">{children}</div>
    </div>
  );
}
