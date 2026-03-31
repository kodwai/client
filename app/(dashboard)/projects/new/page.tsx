"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { RubricBuilder, DEFAULT_DIMENSIONS, RubricDimension } from "@/components/project/rubric-builder";
import { ToolConfig } from "@/components/project/tool-config";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState("medium");
  const [maxBudgetUsd, setMaxBudgetUsd] = useState<string>("");
  const [rubricDimensions, setRubricDimensions] = useState<RubricDimension[]>(DEFAULT_DIMENSIONS);
  const [allowedTools, setAllowedTools] = useState<string[] | null>(null);
  const [disallowedTools, setDisallowedTools] = useState<string[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title,
        description: description || undefined,
        problem_statement_md: problemStatement,
        time_limit_minutes: timeLimitMinutes,
        difficulty,
        max_budget_usd: maxBudgetUsd ? parseFloat(maxBudgetUsd) : null,
        rubric: rubricDimensions,
        allowed_tools: allowedTools,
        disallowed_tools: disallowedTools,
      };

      const project = await api.post("/api/projects", payload);
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">New Project</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Configure an interview project with rubric and tool settings
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
                label="Budget Limit (USD)"
                type="number"
                min={0}
                step={0.5}
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
            {saving ? "Creating..." : "Create Project"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
