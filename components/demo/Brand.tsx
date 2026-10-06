import type { DemoConfig } from "@/demos/types";

/** Generic blade-of-grass mark (not the prospect's logo). */
export function GrassMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <path d="M15.2 29c-.6-6.4-2.6-12.3-7.7-18.1 4.6 3 7.6 7.3 9.3 12.6.3-6.7 2.1-13.3 6-19.5-1.7 6.6-2.5 13.4-2.2 20.5l.1 4.5Z" />
      <path d="M21.5 29c.4-4.1 2-7.6 5.3-10.4-1.9 3.1-2.9 6.6-3 10.4Z" opacity=".7" />
      <path d="M11.4 29c-.9-3-2.6-5.4-5.3-7.2 3.6.9 5.9 3.4 7.3 7.2Z" opacity=".7" />
    </svg>
  );
}

/** Typeset wordmark plus the generic mark. Swap for the real logo later. */
export function Wordmark({ cfg, compact = false }: { cfg: DemoConfig; compact?: boolean }) {
  const [top, bottom] = cfg.company.wordmark;
  return (
    <span className="flex items-center gap-2" aria-label={cfg.company.name}>
      <GrassMark size={compact ? 26 : 30} className="text-(--d-accent)" />
      <span className="flex flex-col leading-none" aria-hidden="true">
        <span className={`demo-wordmark ${compact ? "text-[16px]" : "text-[18px]"}`}>{top}</span>
        <span className="mt-1 text-[9.5px] font-medium tracking-[0.28em] uppercase opacity-75">{bottom}</span>
      </span>
    </span>
  );
}

/** "Prepared by Rose Revenue", with the pixel sun inlined (no image request). */
export function PreparedBy({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] ${className}`}>
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
