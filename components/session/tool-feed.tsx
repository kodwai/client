"use client";

import { useMemo } from "react";
import type { SessionEvent } from "@/hooks/use-session-events";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface ToolFeedProps {
  events: SessionEvent[];
}

const TOOL_TYPES = new Set(["tool_use", "tool_call", "tool_result", "PostToolUse", "PreToolUse"]);

const TOOL_COLORS: Record<string, string> = {
  Read: "bg-blue-100 text-blue-800",
  Edit: "bg-green-100 text-green-800",
  Write: "bg-green-100 text-green-800",
  Bash: "bg-amber-100 text-amber-800",
  Grep: "bg-purple-100 text-purple-800",
  Glob: "bg-purple-100 text-purple-800",
  WebFetch: "bg-cyan-100 text-cyan-800",
};

function getToolColor(name: string): string {
  return TOOL_COLORS[name] || "bg-cream-dark text-ink";
}

function getToolSummary(data: Record<string, unknown>): string {
  const toolName = (data.tool_name as string) || "";
  const input = data.tool_input as Record<string, unknown> | undefined;

  if (toolName === "Write" || toolName === "Edit") {
    const filePath = (input?.file_path as string) || "";
    return filePath.split("/").slice(-2).join("/");
  }
  if (toolName === "Bash") {
    return (input?.command as string)?.slice(0, 80) || "";
  }
  if (toolName === "Read") {
    const filePath = (input?.file_path as string) || "";
    return filePath.split("/").slice(-2).join("/");
  }
  if (toolName === "Grep" || toolName === "Glob") {
    return (input?.pattern as string) || (input?.query as string) || "";
  }
  // Fallback
  const raw = data.input || data.arguments || data.command || data.file_path || "";
  const str = typeof raw === "string" ? raw : JSON.stringify(raw);
  return str.length <= 80 ? str : str.slice(0, 80) + "...";
}

function formatTime(iso: string): string {
  const ts = iso.endsWith("Z") || iso.includes("+") ? iso : iso.replace(" ", "T") + "Z";
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ToolFeed({ events }: ToolFeedProps) {
  const toolEvents = useMemo(
    () =>
      events
        .filter((e) => TOOL_TYPES.has(e.type))
        .reverse(),
    [events]
  );

  if (toolEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono text-sm text-muted">No tool usage yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[600px] space-y-2">
      {toolEvents.map((event, i) => {
        const toolName =
          (event.data.tool_name as string) ||
          (event.data.name as string) ||
          "unknown";
        const summary = getToolSummary(event.data);
        const colorClass = getToolColor(toolName);

        return (
          <div
            key={`${event.timestamp}-${i}`}
            className="py-2 px-3 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${colorClass}`}
              >
                {toolName}
              </span>
              <span className="font-mono text-[10px] text-muted ml-auto">
                {formatTime(event.timestamp)}
              </span>
            </div>
            {summary && (
              <p className="font-mono text-xs text-muted break-all">
                {summary}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
