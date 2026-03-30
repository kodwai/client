"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Divider } from "@/components/ui/divider";

interface RubricDimension {
  name: string;
  weight: number;
  description: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  problem_statement_md: string;
  difficulty: string;
  time_limit_minutes: number;
  max_budget_usd: number | null;
  rubric: RubricDimension[];
  allowed_tools: string[] | null;
  disallowed_tools: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  overall_score: number | null;
}

interface ApiKey {
  id: string;
  label: string;
}

const difficultyVariant: Record<string, BadgeVariant> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

const sessionStatusVariant: Record<string, BadgeVariant> = {
  pending: "default",
  active: "success",
  completed: "success",
  expired: "warning",
  error: "error",
};

type Tab = "overview" | "rubric" | "sessions";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Session creation form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/api/projects/${projectId}`),
      api.get(`/api/sessions?project_id=${projectId}`),
    ])
      .then(([proj, sess]) => {
        setProject(proj);
        setSessions(Array.isArray(sess) ? sess : sess.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (showSessionForm && apiKeys.length === 0) {
      api.get("/api/api-keys").then((data) => {
        const keys = Array.isArray(data) ? data : data.items || [];
        setApiKeys(keys);
        if (keys.length > 0) setSelectedApiKey(keys[0].id);
      }).catch(() => {});
    }
  }, [showSessionForm, apiKeys.length]);

  async function handleDuplicate() {
    if (!project) return;
    try {
      const payload = {
        title: `${project.title} (Copy)`,
        description: project.description,
        problem_statement_md: project.problem_statement_md,
        time_limit_minutes: project.time_limit_minutes,
        difficulty: project.difficulty,
        max_budget_usd: project.max_budget_usd,
        rubric: project.rubric,
        allowed_tools: project.allowed_tools,
        disallowed_tools: project.disallowed_tools,
      };
      const dup = await api.post("/api/projects", payload);
      router.push(`/projects/${dup.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to duplicate.");
    }
  }

  async function handleArchive() {
    if (!project) return;
    try {
      await api.delete(`/api/projects/${projectId}`);
      router.push("/projects");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive.");
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSession(true);
    setSessionError("");

    if (!selectedApiKey) {
      setSessionError("Please add an API key in Settings → API Keys first.");
      setCreatingSession(false);
      return;
    }

    try {
      const session = await api.post("/api/sessions", {
        project_id: projectId,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        api_key_id: selectedApiKey,
      });
      setSessions((prev) => [session, ...prev]);
      setCandidateName("");
      setCandidateEmail("");
      setShowSessionForm(false);
    } catch (err: unknown) {
      setSessionError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setCreatingSession(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-rust">{error}</p>
      </div>
    );
  }

  if (!project) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "rubric", label: "Rubric" },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{project.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={difficultyVariant[project.difficulty] || "default"}>
              {project.difficulty}
            </Badge>
            <span className="font-mono text-xs text-muted">{project.time_limit_minutes} min</span>
            {project.max_budget_usd && (
              <span className="font-mono text-xs text-muted">${project.max_budget_usd} budget</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/projects/${projectId}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="secondary" onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button variant="secondary" onClick={handleArchive}>
            Archive
          </Button>
        </div>
      </div>
      <Divider className="mx-0 my-8" />

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-8 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 font-mono text-xs uppercase tracking-widest transition-colors ${
              activeTab === tab.key
                ? "text-rust border-b-2 border-rust"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6 max-w-3xl">
          {project.description && (
            <Card>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
                Description
              </label>
              <p className="font-display text-lg">{project.description}</p>
            </Card>
          )}

          {project.problem_statement_md && (
            <Card accent>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-2">
                Problem Statement
              </label>
              <pre className="whitespace-pre-wrap font-display text-base leading-relaxed">
                {project.problem_statement_md}
              </pre>
            </Card>
          )}

          {(project.allowed_tools || project.disallowed_tools) && (
            <Card>
              <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-3">
                Tool Configuration
              </label>
              {project.allowed_tools && (
                <div className="mb-3">
                  <span className="font-mono text-xs text-muted">Allowed: </span>
                  <span className="font-mono text-sm">{project.allowed_tools.join(", ")}</span>
                </div>
              )}
              {project.disallowed_tools && (
                <div>
                  <span className="font-mono text-xs text-muted">Blocked: </span>
                  <span className="font-mono text-sm">{project.disallowed_tools.join(", ")}</span>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Rubric Tab */}
      {activeTab === "rubric" && (
        <div className="space-y-4 max-w-3xl">
          {project.rubric && project.rubric.length > 0 ? (
            project.rubric.map((dim, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg">{dim.name}</h3>
                    {dim.description && (
                      <p className="text-muted text-sm mt-1">{dim.description}</p>
                    )}
                  </div>
                  <Badge>{dim.weight}/10</Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-center py-8">
              <p className="font-mono text-sm text-muted">No rubric dimensions defined.</p>
            </Card>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted uppercase tracking-widest">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </span>
            <Button onClick={() => setShowSessionForm(!showSessionForm)}>
              {showSessionForm ? "Cancel" : "New Session"}
            </Button>
          </div>

          {showSessionForm && (
            <Card accent>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <Input
                  label="Candidate Name"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
                <Input
                  label="Candidate Email"
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
                {apiKeys.length > 0 && (
                  <Select
                    label="API Key"
                    value={selectedApiKey}
                    onChange={(e) => setSelectedApiKey(e.target.value)}
                    options={apiKeys.map((k) => ({ value: k.id, label: k.label }))}
                    placeholder="Select an API key"
                  />
                )}
                {sessionError && <p className="font-mono text-xs text-rust">{sessionError}</p>}
                <Button type="submit" disabled={creatingSession}>
                  {creatingSession ? "Creating..." : "Create Session"}
                </Button>
              </form>
            </Card>
          )}

          {sessions.length === 0 && !showSessionForm ? (
            <Card className="text-center py-8">
              <p className="font-mono text-sm text-muted">No sessions yet for this project.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:border-rust transition-colors"
                  onClick={() => router.push(`/sessions/${session.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="font-display text-lg">{session.candidate_name}</span>
                      <span className="font-mono text-xs text-muted ml-3">
                        {session.candidate_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.overall_score !== null && (
                        <span className="font-mono text-sm">{session.overall_score}%</span>
                      )}
                      <Badge variant={sessionStatusVariant[session.status] || "default"}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
