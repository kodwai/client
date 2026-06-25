import type { ReactNode } from "react";

/**
 * Inline label wrapper that shows an explanatory tooltip on hover.
 * Usage: <StatTip tip="...">Direction</StatTip>
 */
export function StatTip({ children, tip }: { children: ReactNode; tip: string }) {
  return (
    <span className="group relative inline-flex cursor-help border-b border-dotted border-muted/50">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded border border-[#33312c] bg-[#1a1a1a] px-2.5 py-1.5 text-[10px] font-mono normal-case leading-snug tracking-normal text-[#faf8f4] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
      >
        {tip}
      </span>
    </span>
  );
}
