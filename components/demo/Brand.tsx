import type { DemoConfig } from "@/demos/types";

/** Generic paw print (placeholder until the real logo drops in). */
export function Paw({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <ellipse cx="9" cy="10" rx="3" ry="4" transform="rotate(-15 9 10)" />
      <ellipse cx="15.5" cy="6.8" rx="3" ry="4.1" />
      <ellipse cx="22" cy="10" rx="3" ry="4" transform="rotate(15 22 10)" />
      <ellipse cx="26" cy="16.5" rx="2.6" ry="3.4" transform="rotate(30 26 16.5)" />
      <path d="M15.5 14c-4.2 0-8.5 5.3-8.5 9.1 0 2.4 1.8 3.6 4 3.6 1.9 0 2.9-1.1 4.5-1.1s2.6 1.1 4.5 1.1c2.2 0 4-1.2 4-3.6 0-3.8-4.3-9.1-8.5-9.1Z" />
    </svg>
  );
}

/** Typeset wordmark. Paul swaps in the real logo later. */
export function Wordmark({ cfg, compact = false }: { cfg: DemoConfig; compact?: boolean }) {
  const [top, bottom] = cfg.company.wordmark;
  return (
    <span className="flex items-center gap-2.5" aria-label={cfg.company.name}>
      <Paw size={compact ? 26 : 30} className="text-[#231f20]" />
      <span className="flex flex-col leading-none" aria-hidden="true">
        <span className={`demo-display ${compact ? "text-[19px]" : "text-[22px]"} tracking-[0.08em] text-[#231f20]`}>{top}</span>
        <span className="demo-display mt-0.5 text-[9.5px] tracking-[0.22em] text-[#4a4344]">{bottom}</span>
      </span>
    </span>
  );
}

/** "Prepared by Rose Revenue", with the pixel sun inlined (no image request). */
export function PreparedBy({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] ${dark ? "text-[#3b3536]" : "text-(--d-muted)"} ${className}`}>
      <svg viewBox="0 0 12 9" width="16" height="12" aria-hidden="true" shapeRendering="crispEdges">
        <g fill="#fc5f60">
          <rect x="4" y="0" width="4" height="1" /><rect x="2" y="1" width="8" height="1" /><rect x="1" y="2" width="10" height="1" />
          <rect x="0" y="3" width="12" height="2" />
          <rect x="0" y="6" width="1" height="1" /><rect x="2" y="6" width="1" height="1" /><rect x="4" y="6" width="1" height="1" />
          <rect x="7" y="6" width="1" height="1" /><rect x="9" y="6" width="1" height="1" /><rect x="11" y="6" width="1" height="1" />
          <rect x="3" y="8" width="1" height="1" /><rect x="8" y="8" width="1" height="1" />
        </g>
      </svg>
      Prepared by Rose Revenue
    </span>
  );
}
