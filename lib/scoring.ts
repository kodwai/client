// Shapes returned by the Scoring v2 backend.

export interface SignalDetail {
  name: string;
  value: number | null;   // 0..1, or null when skipped
  weight: number;
  reason: string;
  evidence: string[];
  skipped: boolean;
}

export interface AxisResult {
  name: "direction" | "outcome" | "lift" | string;
  points: number;
  score: number;
  signals: SignalDetail[];
}

export interface ScoreBreakdownV2 {
  scoring_version: 2;
  overall: number;
  late_penalty: number;
  leaderboard_eligible: boolean;
  baseline_lift: { beat: boolean; delta: number } | null;
  axes: AxisResult[];
  confidence?: "high" | "medium" | "low" | "none";
  trace_quality?: string | null;
}

export interface RubricSignal { name: string; label: string; description: string; weight: number; }
export interface RubricAxis { name: string; label: string; blurb: string; points: number; signals: RubricSignal[]; }
export interface Rubric { profile: string; axes: RubricAxis[]; }

// Friendly labels (mirror of the backend SIGNAL_META / AXIS_META labels).
export const AXIS_LABEL: Record<string, string> = {
  direction: "Direction", outcome: "Outcome", lift: "Lift",
};
export const SIGNAL_LABEL: Record<string, string> = {
  spec_precision: "Spec Precision", verification_rigor: "Verification Rigor",
  decomposition: "Decomposition", recovery: "Recovery", intent_fidelity: "Intent Fidelity",
  one_shot_penalty: "Engagement", tests: "Tests", code_quality: "Code Quality",
  complexity: "Complexity", trap_coverage: "Edge-Case Coverage", baseline_lift: "Lift over AI",
};

// A breakdown is v2 when it carries the axes array / scoring_version 2.
export function isV2(bd: unknown): bd is ScoreBreakdownV2 {
  return !!bd && typeof bd === "object"
    && (bd as { scoring_version?: number }).scoring_version === 2
    && Array.isArray((bd as { axes?: unknown }).axes);
}
