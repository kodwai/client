"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface ScoreCardProps {
  submissionId: string;
  challengeTitle: string;
  challengeDifficulty: string;
  score: number;
  objectiveScore?: number;
  analyticalScore?: number;
  directionScore?: number;
  outcomeScore?: number;
  liftScore?: number;
  agentUsed: string;
  timeMinutes: number;
  timeLimitMinutes: number;
  strengths?: string[];
  username?: string;
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

export function ScoreCard({
  submissionId,
  challengeTitle,
  challengeDifficulty,
  score,
  objectiveScore,
  analyticalScore,
  directionScore,
  outcomeScore,
  liftScore,
  agentUsed,
  timeMinutes,
  timeLimitMinutes,
  strengths,
  username,
}: ScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  async function generateShareLink() {
    if (shareUrl) return shareUrl;
    setSharing(true);
    try {
      const data = await api.post(`/api/submissions/${submissionId}/share`, {});
      const url = data.share_url;
      setShareUrl(url);
      return url;
    } catch {
      return "https://kodwai.com";
    } finally {
      setSharing(false);
    }
  }

  const shareText = `I scored ${score.toFixed(0)}/100 on "${challengeTitle}" using ${agentUsed} on @kodwai_com\n\nSolve AI-agent coding challenges and prove your skills: kodwai.com`;

  async function shareToX() {
    const url = await generateShareLink();
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  async function shareToLinkedIn() {
    const url = await generateShareLink();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  async function copyShareLink() {
    const url = await generateShareLink();
    navigator.clipboard.writeText(url).catch(() => {});
  }

  const timePct = Math.min((timeMinutes / timeLimitMinutes) * 100, 100);

  return (
    <div className="space-y-4">
      {/* The card */}
      <div
        ref={cardRef}
        className="border border-border bg-white/80 p-6 sm:p-8 overflow-hidden"
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-display text-lg tracking-wide" style={{ letterSpacing: "0.75px" }}>kodwai</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5"
            style={{ color: difficultyColor[challengeDifficulty] || "#9a948a", border: `1px solid ${difficultyColor[challengeDifficulty] || "#e4e0d8"}` }}
          >
            {challengeDifficulty}
          </span>
        </div>

        {/* Challenge name */}
        <h3 className="font-display text-xl mb-6">{challengeTitle}</h3>

        {/* Score ring + stats */}
        <div className="flex items-center gap-6 mb-6">
          <ScoreRing score={score} />
          <div className="flex-1 space-y-3">
            {directionScore != null ? (
              <>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Direction</span>
                    <span className="font-mono text-xs">{directionScore.toFixed(0)}/50</span>
                  </div>
                  <div className="h-1.5 bg-border overflow-hidden">
                    <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min((directionScore / 50) * 100, 100)}%` }} />
                  </div>
                </div>
                {outcomeScore != null && (
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Outcome</span>
                      <span className="font-mono text-xs">{outcomeScore.toFixed(0)}/35</span>
                    </div>
                    <div className="h-1.5 bg-border overflow-hidden">
                      <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min((outcomeScore / 35) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {liftScore != null && (
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Lift</span>
                      <span className="font-mono text-xs">{liftScore.toFixed(0)}/15</span>
                    </div>
                    <div className="h-1.5 bg-border overflow-hidden">
                      <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min((liftScore / 15) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {objectiveScore != null && (
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Objective</span>
                      <span className="font-mono text-xs">{objectiveScore.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-border overflow-hidden">
                      <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min((objectiveScore / 85) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {analyticalScore != null && (
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">AI Analysis</span>
                      <span className="font-mono text-xs">{analyticalScore.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 bg-border overflow-hidden">
                      <div className="h-full bg-ink/60 transition-all" style={{ width: `${Math.min(analyticalScore, 100)}%` }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-6 py-3 border-t border-border">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Agent</p>
            <p className="font-mono text-xs mt-0.5">{agentUsed}</p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Time</p>
            <p className="font-mono text-xs mt-0.5">{timeMinutes} min</p>
          </div>
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
        </div>

        {/* Top strength */}
        {strengths && strengths.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted mb-1">Top Strength</p>
            <p className="font-mono text-xs text-green-700">+ {strengths[0]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          {username && (
            <span className="font-mono text-[10px] text-muted">@{username}</span>
          )}
          <span className="font-mono text-[9px] text-muted/40 ml-auto">kodwai.com</span>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={shareToX}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 bg-ink text-cream font-mono text-xs cursor-pointer border-none hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {sharing ? "..." : "Share on X"}
        </button>
        <button
          onClick={shareToLinkedIn}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 border border-border font-mono text-xs cursor-pointer bg-transparent hover:border-rust/30 transition-colors disabled:opacity-50"
        >
          LinkedIn
        </button>
        <button
          onClick={copyShareLink}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2 border border-border font-mono text-xs cursor-pointer bg-transparent hover:border-rust/30 transition-colors disabled:opacity-50"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}
