"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  time_limit_minutes: number;
  rubric: { name: string; weight: number; description: string }[];
  status: string;
  created_at: string;
}

const difficultyVariant: Record<string, BadgeVariant> = {
  easy: "success",
  medium: "warning",
  hard: "error",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    api
      .get("/api/projects")
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl sm:text-3xl">Projects</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        Manage your interview projects and rubrics
      </p>
      <Divider className="mx-0 my-8" />

      {error && <p className="font-mono text-xs text-rust mb-4">{error}</p>}

      {projects.length === 0 ? (
        <Card className="text-center py-16">
          <p className="font-display text-xl text-muted mb-4">No projects yet.</p>
          <p className="font-mono text-sm text-muted mb-6">
            Create your first interview project.
          </p>
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              accent
              className="cursor-pointer hover:border-rust transition-colors"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl">{project.title}</h2>
                  <Badge variant={difficultyVariant[project.difficulty] || "default"}>
                    {project.difficulty}
                  </Badge>
                </div>

                {project.description && (
                  <p className="text-muted text-sm line-clamp-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 font-mono text-xs text-muted">
                  <span>{project.time_limit_minutes} min</span>
                  <span>
                    {project.rubric?.length || 0} rubric dimension
                    {(project.rubric?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
