"use client";

import { useEffect, useState } from "react";

function parseUtc(s: string): number {
  // canonical 'YYYY-MM-DD HH:MM:SS' (UTC, no zone) -> ms epoch
  return new Date(s.replace(" ", "T") + "Z").getTime();
}

function format(ms: number): string {
  if (ms <= 0) return "ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

export function SprintCountdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = parseUtc(endsAt) - now;
  return <span className={className}>{format(remaining)}</span>;
}
