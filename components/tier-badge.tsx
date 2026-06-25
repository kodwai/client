"use client";

interface Tier { key: string; name: string; color: string; next_name?: string | null; next_at?: number | null; progress?: number; }

export function TierBadge({ tier, className }: { tier?: Tier | null; className?: string }) {
  if (!tier) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white ${className ?? ""}`}
      style={{ backgroundColor: tier.color }}
    >
      {tier.name}
    </span>
  );
}
