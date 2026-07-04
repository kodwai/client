"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AXIS_LABEL, SIGNAL_LABEL, type ScoreBreakdownV2, type AxisResult, type SignalDetail } from "@/lib/scoring";

function barColor(pct: number) {
  return pct >= 70 ? "bg-green-600" : pct >= 50 ? "bg-amber-500" : "bg-rust";
}

function SignalRow({ s }: { s: SignalDetail }) {
  const [open, setOpen] = useState(false);
  if (s.skipped) {
    return (
      <div className="py-2 border-t border-border/60">
        <div className="flex justify-between">
          <span className="font-mono text-xs text-muted">{SIGNAL_LABEL[s.name] || s.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">skipped</span>
        </div>
        <p className="font-mono text-[10px] text-muted mt-0.5">{s.reason}</p>
      </div>
    );
  }
  const pct = Math.round((s.value ?? 0) * 100);
  return (
    <div className="py-2 border-t border-border/60">
      <div className="flex justify-between mb-1">
        <span className="font-mono text-xs">{SIGNAL_LABEL[s.name] || s.name}</span>
        <span className="font-mono text-xs text-muted">{pct}%</span>
      </div>
      <div className="h-1.5 bg-border overflow-hidden">
        <div className={`h-full ${barColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {s.reason && <p className="font-mono text-[10px] text-muted mt-1">{s.reason}</p>}
      {s.evidence.length > 0 && (
        <div className="mt-1">
          <button onClick={() => setOpen((v) => !v)} className="font-mono text-[10px] text-rust cursor-pointer bg-transparent border-none p-0">
            {open ? "hide evidence" : `evidence (${s.evidence.length})`}
          </button>
          {open && (
            <ul className="mt-1 space-y-1">
              {s.evidence.map((e, i) => (
                <li key={i} className="font-mono text-[10px] text-muted border-l-2 border-border pl-2">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AxisCard({ axis }: { axis: AxisResult }) {
  const pct = axis.points > 0 ? Math.round((axis.score / axis.points) * 100) : 0;
  return (
    <Card accent className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-xl">{AXIS_LABEL[axis.name] || axis.name}</h2>
        <span className="font-mono text-sm text-muted">{axis.score.toFixed(1)} / {axis.points}</span>
      </div>
      <div className="h-2 bg-border overflow-hidden mb-3">
        <div className={`h-full ${barColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div>{axis.signals.map((s) => <SignalRow key={s.name} s={s} />)}</div>
    </Card>
  );
}

export function ScoreBreakdownV2View({ breakdown }: { breakdown: ScoreBreakdownV2 }) {
  return (
    <div>
      {breakdown.late_penalty > 0 && (
        <Card className="mb-6 border-rust/30 bg-rust/5">
          <p className="font-display text-base">Late Submission</p>
          <p className="font-mono text-xs text-muted">A {breakdown.late_penalty} point penalty was applied for exceeding the time limit.</p>
        </Card>
      )}
      {!breakdown.leaderboard_eligible && (
        <Card className="mb-6">
          {breakdown.ineligible_reason === "scoring_error" ? (
            <p className="font-mono text-xs text-muted">
              This score isn&apos;t on the leaderboard yet. AI scoring didn&apos;t complete for this submission, likely a temporary error. Your Anthropic API key is connected, so just re-submit to get your full Direction score and leaderboard eligibility.
            </p>
          ) : (
            <p className="font-mono text-xs text-muted">
              This score isn&apos;t on the leaderboard. Process scoring needs your Anthropic API key. Add it in{" "}
              <Link href="/dev/settings" className="text-rust hover:text-rust-hover transition-colors">Settings</Link>{" "}
              to unlock the full Direction score and leaderboard eligibility.
            </p>
          )}
        </Card>
      )}
      {(breakdown.confidence === "none" || breakdown.confidence === "low") && (
        <Card className="mb-6">
          <p className="font-mono text-xs text-muted">
            {breakdown.confidence === "none"
              ? "No agent trace captured — the Direction (process) score couldn’t be assessed from your session."
              : "Thin agent trace — the Direction (process) score is low-confidence. Richer sessions score more reliably."}
          </p>
        </Card>
      )}
      {breakdown.baseline_lift?.beat && (
        <Card className="mb-6 border-green-600/30 bg-green-600/5">
          {breakdown.baseline_lift.source === "operator" && typeof breakdown.baseline_lift.L === "number" ? (
            <>
              <p className="font-display text-base text-green-700">
                {breakdown.baseline_lift.L >= 1
                  ? "You beat the expert ceiling on this challenge 🎉"
                  : "You beat the solo-AI baseline 🎉"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                Normalized lift L = {breakdown.baseline_lift.L.toFixed(2)} (0 = solo-AI baseline, 1 = expert ceiling)
              </p>
            </>
          ) : (
            <p className="font-display text-base text-green-700">You beat the solo-AI baseline by {breakdown.baseline_lift.delta} points 🎉</p>
          )}
        </Card>
      )}
      {breakdown.axes.map((axis) => <AxisCard key={axis.name} axis={axis} />)}
    </div>
  );
}
