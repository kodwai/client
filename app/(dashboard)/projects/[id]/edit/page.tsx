"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { RubricBuilder, RubricDimension } from "@/components/project/rubric-builder";
import { ToolConfig } from "@/components/project/tool-config";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState("medium");
  const [rubricDimensions, setRubricDimensions] = useState<RubricDimension[]>([]);
  const [maxBudgetUsd, setMaxBudgetUsd] = useState<string>("");
  const [allowedTools, setAllowedTools] = useState<string[] | null>(null);
  const [disallowedTools, setDisallowedTools] = useState<string[] | null>(null);

  useEffect(() => {
    api
      .get(`/api/projects/${projectId}`)
      .then((data) => {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setProblemStatement(data.problem_statement_md || "");
        setTimeLimitMinutes(data.time_limit_minutes || 60);
        setDifficulty(data.difficulty || "medium");
        setRubricDimensions(data.rubric || []);
        setMaxBudgetUsd(data.max_budget_usd != null ? String(data.max_budget_usd) : "");
        setAllowedTools(data.allowed_tools || null);
        setDisallowedTools(data.disallowed_tools || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        description,
        problem_statement_md: problemStatement,
        time_limit_minutes: timeLimitMinutes,
        difficulty,
        max_budget_usd: maxBudgetUsd ? parseFloat(maxBudgetUsd) : null,
        rubric: rubricDimensions,
        allowed_tools: allowedTools,
        disallowed_tools: disallowedTools,
      };

      await api.put(`/api/projects/${projectId}`, payload);
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update project.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Edit Project</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Update project configuration and rubric
      </p>
      <Divider className="mx-0 my-8" />

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        <Card accent>
          <div className="space-y-6">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer — React Challenge"
              required
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the project"
              rows={3}
            />

            <Textarea
              label="Problem Statement"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Detailed problem description (supports Markdown)"
              hint="Supports Markdown formatting"
              rows={8}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Time Limit (minutes)"
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 60)}
              />

              <Select
                label="Difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                  { value: "hard", label: "Hard" },
                ]}
              />

              <Input
                label="Budget per Session (USD)"
                type="number"
                min={0}
                step={0.01}
                value={maxBudgetUsd}
                onChange={(e) => setMaxBudgetUsd(e.target.value)}
                placeholder="e.g. 5.00"
              />
            </div>
          </div>
        </Card>

        <Card>
          <RubricBuilder value={rubricDimensions} onChange={setRubricDimensions} />
        </Card>

        <Card>
          <ToolConfig
            allowedTools={allowedTools}
            disallowedTools={disallowedTools}
            onChange={({ allowedTools: a, disallowedTools: d }) => {
              setAllowedTools(a);
              setDisallowedTools(d);
            }}
          />
        </Card>

        {error && <p className="font-mono text-xs text-rust">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
