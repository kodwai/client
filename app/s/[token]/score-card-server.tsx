"use client";

interface ShareData {
  challenge_title: string;
  challenge_difficulty: string;
  score: number;
  objective_score: number | null;
  analytical_score: number | null;
  strengths: string[];
  agent_used: string;
  model_display: string | null;
  time_minutes: number | null;
  time_limit_minutes: number;
  username: string | null;
}

const difficultyColor: Record<string, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#c23616",
};

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#c23616";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e4e0d8" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl" style={{ color }}>{score.toFixed(0)}</span>
        <span className="font-mono text-[9px] text-muted uppercase tracking-widest">/100</span>
      </div>
    </div>
  );
}

export function ScoreCardServer({ data, token }: { data: ShareData; token: string }) {
  const timePct = data.time_minutes && data.time_limit_minutes
    ? Math.min((data.time_minutes / data.time_limit_minutes) * 100, 100)
    : 0;

  const shareText = `I scored ${data.score.toFixed(0)}/100 on "${data.challenge_title}" using ${data.agent_used} on @kodwai_com\n\nSolve AI-agent coding challenges: kodwai.com`;
  const shareUrl = `https://app.kodwai.com/s/${token}`;

  function shareToX() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="border border-border bg-white/80 p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-display text-lg tracking-wide">kodwai</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5"
            style={{
              color: difficultyColor[data.challenge_difficulty] || "#9a948a",
              border: `1px solid ${difficultyColor[data.challenge_difficulty] || "#e4e0d8"}`,
            }}
          >
            {data.challenge_difficulty}
          </span>
        </div>

        {/* Challenge name */}
        <h3 className="font-display text-xl mb-6">{data.challenge_title}</h3>

        {/* Score ring + stats */}
        <div className="flex items-center gap-6 mb-6">
          <ScoreRing score={data.score} />
          <div className="flex-1 space-y-3">
            {data.objective_score != null && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Objective</span>
                  <span className="font-mono text-xs">{data.objective_score.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-border overflow-hidden">
                  <div className="h-full bg-ink/60" style={{ width: `${Math.min((data.objective_score / 85) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            {data.analytical_score != null && (
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">AI Analysis</span>
                  <span className="font-mono text-xs">{data.analytical_score.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-border overflow-hidden">
                  <div className="h-full bg-ink/60" style={{ width: `${Math.min(data.analytical_score, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-6 py-3 border-t border-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Agent</p>
            <p className="font-mono text-xs mt-0.5">{data.model_display ? `${data.model_display} · ` : ""}{data.agent_used}</p>
          </div>
          {data.time_minutes != null && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Time</p>
              <p className="font-mono text-xs mt-0.5">{data.time_minutes} min</p>
            </div>
          )}
          {timePct > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Time Used</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="h-1 w-16 bg-border overflow-hidden">
                  <div
                    className={`h-full ${timePct > 100 ? "bg-rust" : timePct > 80 ? "bg-amber-500" : "bg-green-600"}`}
                    style={{ width: `${Math.min(timePct, 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted">{timePct.toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Top strength */}
        {data.strengths.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">Top Strength</p>
            <p className="font-mono text-xs text-green-700">+ {data.strengths[0]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          {data.username && (
            <span className="font-mono text-[10px] text-muted">@{data.username}</span>
          )}
          <span className="font-mono text-[9px] text-muted/40 ml-auto">kodwai.com</span>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={shareToX}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-cream font-mono text-xs cursor-pointer border-none hover:bg-ink/80 transition-colors"
        >
          Share on X
        </button>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 border border-border font-mono text-xs cursor-pointer bg-transparent hover:border-rust/30 transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
