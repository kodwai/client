"use client";

import { useMemo, useState } from "react";
import type { SessionEvent } from "@/hooks/use-session-events";

interface FileExplorerProps {
  events: SessionEvent[];
}

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Map<string, FileNode>;
  content?: string;
  lastChanged?: string;
}

function buildFileTree(events: SessionEvent[]): {
  root: FileNode;
  fileContents: Map<string, { content: string; timestamp: string }>;
} {
  const root: FileNode = {
    name: "",
    path: "",
    isDir: true,
    children: new Map(),
  };
  const fileContents = new Map<string, { content: string; timestamp: string }>();

  for (const event of events) {
    const filePath =
      (event.data.file_path as string) ||
      (event.data.path as string) ||
      "";
    if (!filePath) continue;

    const content = (event.data.content as string) || (event.data.diff as string) || "";
    fileContents.set(filePath, { content, timestamp: event.timestamp });

    const parts = filePath.replace(/^\//, "").split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: new Map(),
          lastChanged: isLast ? event.timestamp : undefined,
        });
      }

      const node = current.children.get(part)!;
      if (isLast) {
        node.lastChanged = event.timestamp;
      }
      current = node;
    }
  }

  return { root, fileContents };
}

function isRecentChange(timestamp: string | undefined): boolean {
  if (!timestamp) return false;
  const diff = Date.now() - new Date(timestamp).getTime();
  return diff < 30_000; // 30 seconds
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (!node.isDir) {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full text-left py-1 px-2 font-mono text-xs flex items-center gap-1.5 hover:bg-cream-dark transition-colors ${
          selectedPath === node.path ? "bg-cream-dark text-ink" : "text-muted"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isRecentChange(node.lastChanged) && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left py-1 px-2 font-mono text-xs text-ink hover:bg-cream-dark transition-colors flex items-center gap-1"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="text-muted text-[10px]">{expanded ? "v" : ">"}</span>
        <span>{node.name}/</span>
      </button>
      {expanded &&
        sortedChildren.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function FileExplorer({ events }: FileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState("");

  const fileEvents = useMemo(
    () => events.filter((e) => e.type === "file.change" || e.type === "file_change" || e.type === "file.write" || e.type === "file.create"),
    [events]
  );

  const { root, fileContents } = useMemo(
    () => buildFileTree(fileEvents),
    [fileEvents]
  );

  const selectedContent = selectedPath
    ? fileContents.get(selectedPath)
    : null;

  if (fileEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono text-sm text-muted">No file changes yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:h-[400px] border border-border">
      {/* File tree */}
      <div className="max-h-48 sm:max-h-none sm:w-48 border-b sm:border-b-0 sm:border-r border-border overflow-y-auto bg-white/30 shrink-0">
        {Array.from(root.children.values())
          .sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={0}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          ))}
      </div>

      {/* Content viewer */}
      <div className="flex-1 overflow-auto bg-white/20 p-4">
        {selectedContent ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-muted truncate">
                {selectedPath}
              </span>
              <span className="font-mono text-[10px] text-muted">
                {new Date(selectedContent.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <pre className="font-mono text-xs text-ink whitespace-pre-wrap break-all leading-relaxed">
              <code>{selectedContent.content}</code>
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="font-mono text-xs text-muted">
              Select a file to view its content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
