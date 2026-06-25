"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

interface Project {
  id: string;
  title: string;
  rubric?: { name: string; weight: number; description: string }[];
}

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
}

interface DimensionScore {
  name: string;
  score: number;
}

interface ScoreData {
  ai_score?: {
    dimensions: DimensionScore[];
    overall_score: number;
  };
  manual_score?: {
    dimensions: DimensionScore[];
    overall_score: number;
  };
}

interface CandidateScore {
  session: Session;
  scores: ScoreData;
}

function cellColor(score: number, best: number, worst: number, count: number): string {
  if (count <= 1) return "";
  if (score === best) return "bg-green-50";
  if (score === worst) return "bg-red-50/60";
  return "";
}

export default function ComparePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [candidates, setCandidates] = useState<CandidateScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load projects
  useEffect(() => {
    api
      .get("/api/projects")
      .then((data) => setProjects(data.projects || data || []))
      .catch((err) => setError(err.message))
      .finally(() => setProjectsLoading(false));
  }, []);

  // Load sessions and scores when project selected
  useEffect(() => {
    if (!selectedProjectId) {
      setCandidates([]);
      return;
    }

    setLoading(true);
    setError("");

    api
      .get(`/api/sessions?project_id=${selectedProjectId}&status=completed`)
      .then(async (data) => {
        const sessions: Session[] = data.sessions || data || [];
        const results: CandidateScore[] = [];

        for (const session of sessions) {
          try {
            const scores = await api.get(`/api/sessions/${session.id}/scores`);
            results.push({ session, scores });
          } catch {
            results.push({ session, scores: {} });
          }
        }

        setCandidates(results);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  // Gather all dimension names
  const allDimensions = new Set<string>();
  candidates.forEach((c) => {
    const dims = c.scores.ai_score?.dimensions || c.scores.manual_score?.dimensions || [];
    dims.forEach((d) => allDimensions.add(d.name));
  });
  const dimensionList = Array.from(allDimensions);

  // Helper to get best score for a dimension
  function getScore(candidate: CandidateScore, dimName: string): number | null {
    const aiDim = candidate.scores.ai_score?.dimensions.find((d) => d.name === dimName);
    const manualDim = candidate.scores.manual_score?.dimensions.find((d) => d.name === dimName);
    if (aiDim && manualDim) return (aiDim.score + manualDim.score) / 2;
    return aiDim?.score ?? manualDim?.score ?? null;
  }

  function getOverall(candidate: CandidateScore): number | null {
    const ai = candidate.scores.ai_score?.overall_score;
    const manual = candidate.scores.manual_score?.overall_score;
    if (ai !== undefined && manual !== undefined) return (ai + manual) / 2;
    return ai ?? manual ?? null;
  }

  // Compute best/worst per dimension
  function dimStats(dimName: string) {
    const scores = candidates
      .map((c) => getScore(c, dimName))
      .filter((s): s is number => s !== null);
    return { best: Math.max(...scores), worst: Math.min(...scores), count: scores.length };
  }

  function overallStats() {
    const scores = candidates
      .map((c) => getOverall(c))
      .filter((s): s is number => s !== null);
    return { best: Math.max(...scores), worst: Math.min(...scores), count: scores.length };
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl">Compare Candidates</h1>
      <p className="font-mono text-sm text-muted mt-1">
        Side-by-side scoring comparison across candidates
      </p>
      <Divider className="mx-0 my-8" />

      {/* Project Selector */}
      <div className="mb-8 max-w-md">
        <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
          Project
        </label>
        {projectsLoading ? (
          <p className="font-mono text-sm text-muted">Loading projects...</p>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full border-b-2 border-border bg-transparent py-2 font-display text-lg text-ink outline-none focus:border-rust cursor-pointer"
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">
            Loading candidates...
          </p>
        </div>
      )}

      {!loading && selectedProjectId && candidates.length === 0 && (
        <Card>
          <p className="text-sm text-muted text-center py-4">
            No completed sessions found for this project.
          </p>
        </Card>
      )}

      {/* Comparison Table */}
      {!loading && candidates.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-mono text-xs uppercase tracking-widest text-muted py-2 pr-4 sticky left-0 bg-white/50">
                    Dimension
                  </th>
                  {candidates.map((c) => (
                    <th
                      key={c.session.id}
                      className="text-center font-mono text-xs uppercase tracking-widest text-muted py-2 px-3 min-w-[100px]"
                    >
                      {c.session.candidate_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Overall row */}
                {(() => {
                  const stats = overallStats();
                  return (
                    <tr className="border-b-2 border-border">
                      <td className="py-3 pr-4 font-display text-base sticky left-0 bg-white/50">
                        Overall
                      </td>
                      {candidates.map((c) => {
                        const score = getOverall(c);
                        return (
                          <td
                            key={c.session.id}
                            className={`py-3 px-3 text-center font-display text-lg ${
                              score !== null
                                ? cellColor(score, stats.best, stats.worst, stats.count)
                                : ""
                            }`}
                          >
                            {score !== null ? score.toFixed(1) : "\u2014"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })()}

                {/* Dimension rows */}
                {dimensionList.map((dimName) => {
                  const stats = dimStats(dimName);
                  return (
                    <tr key={dimName} className="border-b border-border">
                      <td className="py-2.5 pr-4 font-mono text-xs uppercase tracking-widest sticky left-0 bg-white/50">
                        {dimName}
                      </td>
                      {candidates.map((c) => {
                        const score = getScore(c, dimName);
                        return (
                          <td
                            key={c.session.id}
                            className={`py-2.5 px-3 text-center font-display text-sm ${
                              score !== null
                                ? cellColor(score, stats.best, stats.worst, stats.count)
                                : ""
                            }`}
                          >
                            {score !== null ? score.toFixed(1) : "\u2014"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
