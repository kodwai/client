"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { SessionEvent } from "@/hooks/use-session-events";
import { Badge } from "@/components/ui/badge";

interface LiveTranscriptProps {
  events: SessionEvent[];
}

const TRANSCRIPT_TYPES = new Set([
  "prompt", "response", "assistant", "user_message", "assistant_message",
  "tool_call", "tool_result", "thinking",
  "UserPromptSubmit", "PostToolUse", "Stop", "PreToolUse",
  "file.change",
]);

function formatTime(iso: string): string {
  const ts = iso.endsWith("Z") || iso.includes("+") ? iso : iso.replace(" ", "T") + "Z";
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/**
 * Extract human-readable content from Claude Code hook event data.
 * Hook events have nested data like { hook_event_name, prompt, tool_name, tool_input, tool_response, ... }
 */
function parseEventContent(event: SessionEvent): {
  label: string;
  variant: "candidate" | "tool" | "assistant" | "file" | "system";
  title: string;
  body: string;
  toolName?: string;
  fileName?: string;
  fileContent?: string;
} {
  const d = event.data;

  // UserPromptSubmit — candidate typed a prompt
  if (event.type === "UserPromptSubmit") {
    const prompt = (d.prompt as string) || "";
    return {
      label: "Candidate",
      variant: "candidate",
      title: "",
      body: prompt || "Submitted a prompt",
    };
  }

  // PostToolUse — Claude used a tool (Write, Edit, Bash, Read, etc.)
  if (event.type === "PostToolUse" || event.type === "PreToolUse") {
    const toolName = (d.tool_name as string) || "Unknown Tool";
    const input = d.tool_input as Record<string, unknown> | undefined;
    const response = d.tool_response as Record<string, unknown> | undefined;

    let body = "";
    if (toolName === "Write" || toolName === "Edit") {
      const filePath = (input?.file_path as string) || "";
      const shortPath = filePath.split("/").slice(-2).join("/");
      const content = (input?.content as string) || (response?.content as string) || "";
      return {
        label: "Tool",
        variant: "tool",
        title: `${toolName}: ${shortPath}`,
        body: content ? content.slice(0, 500) : `Modified ${shortPath}`,
        toolName,
        fileName: shortPath,
        fileContent: content,
      };
    } else if (toolName === "Bash") {
      const command = (input?.command as string) || "";
      const output = (response?.stdout as string) || (response?.output as string) || "";
      return {
        label: "Tool",
        variant: "tool",
        title: `Bash`,
        body: `$ ${command}${output ? "\n" + output.slice(0, 300) : ""}`,
        toolName,
      };
    } else if (toolName === "Read") {
      const filePath = (input?.file_path as string) || "";
      const shortPath = filePath.split("/").slice(-2).join("/");
      return {
        label: "Tool",
        variant: "tool",
        title: `Read: ${shortPath}`,
        body: `Read file ${shortPath}`,
        toolName,
      };
    } else {
      body = input ? JSON.stringify(input).slice(0, 200) : "";
      return {
        label: "Tool",
        variant: "tool",
        title: toolName,
        body: body || `Used ${toolName}`,
        toolName,
      };
    }
  }

  // Stop — Claude finished responding
  if (event.type === "Stop") {
    return {
      label: "System",
      variant: "system",
      title: "",
      body: "Claude finished responding",
    };
  }

  // file.change — file was created/modified/deleted
  if (event.type === "file.change") {
    const filePath = (d.file_path as string) || "";
    const changeType = (d.change_type as string) || "modified";
    const content = (d.content as string) || "";
    return {
      label: "File",
      variant: "file",
      title: `${changeType}: ${filePath}`,
      body: content ? content.slice(0, 300) : `File ${changeType}`,
      fileName: filePath,
      fileContent: content,
    };
  }

  // Generic fallback for other event types
  const content = (d.prompt as string) || (d.content as string) || (d.text as string) || (d.message as string) || "";
  return {
    label: event.type,
    variant: "system",
    title: "",
    body: content || JSON.stringify(d).slice(0, 200),
  };
}

const VARIANT_STYLES = {
  candidate: "border-l-rust bg-cream-dark/60",
  tool: "border-l-amber-400 bg-amber-50/30",
  assistant: "border-l-border bg-white/50",
  file: "border-l-green-400 bg-green-50/30",
  system: "border-l-border bg-white/20",
};

const LABEL_STYLES = {
  candidate: "text-rust",
  tool: "text-amber-700",
  assistant: "text-ink",
  file: "text-green-700",
  system: "text-muted",
};

function TranscriptMessage({ event }: { event: SessionEvent }) {
  const parsed = parseEventContent(event);
  const [expanded, setExpanded] = useState(false);

  const isLong = parsed.body.length > 200;
  const displayBody = isLong && !expanded ? parsed.body.slice(0, 200) + "..." : parsed.body;

  return (
    <div className={`py-3 px-4 border-l-2 ${VARIANT_STYLES[parsed.variant]}`}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-mono text-xs text-muted">{formatTime(event.timestamp)}</span>
        <span className={`font-mono text-[10px] uppercase tracking-widest ${LABEL_STYLES[parsed.variant]}`}>
          {parsed.label}
        </span>
        {parsed.toolName && (
          <Badge variant="default" className="text-[10px] py-0 px-2">{parsed.toolName}</Badge>
        )}
        {parsed.title && (
          <span className="font-mono text-xs text-ink">{parsed.title}</span>
        )}
      </div>
      <pre className="text-sm whitespace-pre-wrap break-words font-mono text-ink/80">{displayBody}</pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-mono text-xs text-rust hover:text-rust-hover mt-1"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function LiveTranscript({ events }: LiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => events.filter((e) => TRANSCRIPT_TYPES.has(e.type)).slice(-200),
    [events]
  );

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filtered.length]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="font-mono text-sm text-muted">Waiting for session activity...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-y-auto max-h-[600px] space-y-1">
      {filtered.map((event, i) => (
        <TranscriptMessage key={`${event.timestamp}-${i}`} event={event} />
      ))}
    </div>
  );
}
