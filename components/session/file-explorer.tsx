"use client";

import { useMemo, useState, useRef, useCallback } from "react";
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

// ── File Icons & Colors ────────────────────────────

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  // JavaScript / TypeScript
  ".js": { icon: "JS", color: "#f7df1e" },
  ".jsx": { icon: "JSX", color: "#61dafb" },
  ".ts": { icon: "TS", color: "#3178c6" },
  ".tsx": { icon: "TSX", color: "#3178c6" },
  ".mjs": { icon: "MJ", color: "#f7df1e" },
  ".cjs": { icon: "CJ", color: "#f7df1e" },
  // Web
  ".html": { icon: "H", color: "#e44d26" },
  ".css": { icon: "C", color: "#264de4" },
  ".scss": { icon: "S", color: "#cd6799" },
  ".less": { icon: "L", color: "#1d365d" },
  ".svg": { icon: "SV", color: "#ffb13b" },
  // Python
  ".py": { icon: "PY", color: "#3776ab" },
  ".pyx": { icon: "PX", color: "#3776ab" },
  // Go
  ".go": { icon: "GO", color: "#00add8" },
  ".mod": { icon: "MD", color: "#00add8" },
  // Rust
  ".rs": { icon: "RS", color: "#ce422b" },
  // Java / Kotlin
  ".java": { icon: "JA", color: "#b07219" },
  ".kt": { icon: "KT", color: "#a97bff" },
  // C / C++
  ".c": { icon: "C", color: "#555555" },
  ".h": { icon: "H", color: "#555555" },
  ".cpp": { icon: "C+", color: "#f34b7d" },
  ".hpp": { icon: "H+", color: "#f34b7d" },
  // Ruby
  ".rb": { icon: "RB", color: "#cc342d" },
  // PHP
  ".php": { icon: "PH", color: "#4f5d95" },
  // Shell
  ".sh": { icon: "SH", color: "#89e051" },
  ".bash": { icon: "SH", color: "#89e051" },
  ".zsh": { icon: "SH", color: "#89e051" },
  // Config / Data
  ".json": { icon: "{}", color: "#f7df1e" },
  ".yaml": { icon: "YA", color: "#cb171e" },
  ".yml": { icon: "YA", color: "#cb171e" },
  ".toml": { icon: "TM", color: "#9c4221" },
  ".xml": { icon: "XM", color: "#e44d26" },
  ".env": { icon: "EN", color: "#ecd53f" },
  ".ini": { icon: "IN", color: "#d1d5db" },
  // Docs
  ".md": { icon: "MD", color: "#083fa1" },
  ".mdx": { icon: "MX", color: "#083fa1" },
  ".txt": { icon: "TX", color: "#d1d5db" },
  // Docker / DevOps
  ".dockerfile": { icon: "DK", color: "#2496ed" },
  // SQL
  ".sql": { icon: "SQ", color: "#e38c00" },
};

const SPECIAL_FILES: Record<string, { icon: string; color: string }> = {
  "Dockerfile": { icon: "DK", color: "#2496ed" },
  "Makefile": { icon: "MK", color: "#427819" },
  ".gitignore": { icon: "GI", color: "#f05032" },
  "README.md": { icon: "RM", color: "#083fa1" },
  "CLAUDE.md": { icon: "CL", color: "#c23616" },
  "PROBLEM.md": { icon: "PR", color: "#c23616" },
  "package.json": { icon: "NP", color: "#cb3837" },
  "tsconfig.json": { icon: "TS", color: "#3178c6" },
  "go.mod": { icon: "GO", color: "#00add8" },
  "Cargo.toml": { icon: "RS", color: "#ce422b" },
  "requirements.txt": { icon: "PY", color: "#3776ab" },
  "Gemfile": { icon: "RB", color: "#cc342d" },
};

function getFileIcon(fileName: string): { icon: string; color: string } {
  if (SPECIAL_FILES[fileName]) return SPECIAL_FILES[fileName];
  const ext = fileName.lastIndexOf(".") >= 0 ? fileName.slice(fileName.lastIndexOf(".")) : "";
  return FILE_ICONS[ext] || { icon: "F", color: "#9a948a" };
}

// ── Syntax Highlighting (lightweight) ──────────────

const KEYWORD_PATTERNS: Record<string, { keywords: string[]; color: string }[]> = {
  js: [
    { keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "new", "this", "try", "catch", "throw", "switch", "case", "break", "continue", "typeof", "instanceof", "of", "in", "yield"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "undefined", "NaN", "Infinity"], color: "#d19a66" },
  ],
  ts: [
    { keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "new", "this", "try", "catch", "throw", "type", "interface", "extends", "implements", "enum", "namespace", "as", "is", "keyof", "typeof", "instanceof", "of", "in", "readonly", "abstract", "declare", "module"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "undefined", "void", "never", "any", "unknown", "string", "number", "boolean", "object", "symbol", "bigint"], color: "#d19a66" },
  ],
  py: [
    { keywords: ["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "with", "try", "except", "finally", "raise", "pass", "break", "continue", "and", "or", "not", "in", "is", "lambda", "yield", "async", "await", "global", "nonlocal"], color: "#c678dd" },
    { keywords: ["True", "False", "None", "self", "cls"], color: "#d19a66" },
  ],
  go: [
    { keywords: ["func", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "go", "defer", "select", "chan", "map", "struct", "interface", "type", "package", "import", "var", "const"], color: "#c678dd" },
    { keywords: ["true", "false", "nil", "string", "int", "int64", "float64", "bool", "byte", "error", "any"], color: "#d19a66" },
  ],
  rs: [
    { keywords: ["fn", "let", "mut", "return", "if", "else", "for", "while", "loop", "match", "struct", "enum", "impl", "trait", "pub", "use", "mod", "crate", "self", "super", "where", "as", "ref", "move", "async", "await", "unsafe", "dyn", "type"], color: "#c678dd" },
    { keywords: ["true", "false", "None", "Some", "Ok", "Err", "Self", "i32", "u32", "f64", "bool", "str", "String", "Vec", "Option", "Result"], color: "#d19a66" },
  ],
};

function getLang(fileName: string): string {
  const ext = fileName.lastIndexOf(".") >= 0 ? fileName.slice(fileName.lastIndexOf(".") + 1) : "";
  const map: Record<string, string> = {
    js: "js", jsx: "js", mjs: "js", cjs: "js",
    ts: "ts", tsx: "ts",
    py: "py", pyx: "py",
    go: "go",
    rs: "rs",
    java: "js", kt: "js", // approximate
    rb: "py", // approximate
    c: "js", cpp: "js", h: "js", hpp: "js",
    php: "js",
    sh: "py", bash: "py",
  };
  return map[ext] || "";
}

function highlightLine(line: string, lang: string): (string | { text: string; color: string })[] {
  if (!lang || !KEYWORD_PATTERNS[lang]) return [line];

  const patterns = KEYWORD_PATTERNS[lang];
  const result: (string | { text: string; color: string })[] = [];

  // Simple token-based highlighting
  const tokens = line.split(/(\b\w+\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*$|#.*$|\d+\.?\d*)/g);

  for (const token of tokens) {
    if (!token) continue;

    // String literals
    if (/^["'`]/.test(token)) {
      result.push({ text: token, color: "#98c379" });
      continue;
    }

    // Comments
    if (/^\/\/|^#/.test(token)) {
      result.push({ text: token, color: "#5c6370" });
      continue;
    }

    // Numbers
    if (/^\d+\.?\d*$/.test(token)) {
      result.push({ text: token, color: "#d19a66" });
      continue;
    }

    // Keywords
    let matched = false;
    for (const group of patterns) {
      if (group.keywords.includes(token)) {
        result.push({ text: token, color: group.color });
        matched = true;
        break;
      }
    }

    if (!matched) result.push(token);
  }

  return result;
}

// ── File Tree ──────────────────────────────────────

function buildFileTree(events: SessionEvent[]): {
  root: FileNode;
  fileContents: Map<string, { content: string; timestamp: string }>;
} {
  const root: FileNode = { name: "", path: "", isDir: true, children: new Map() };
  const fileContents = new Map<string, { content: string; timestamp: string }>();

  for (const event of events) {
    const filePath = (event.data.file_path as string) || (event.data.path as string) || "";
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
          name: part, path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast, children: new Map(),
          lastChanged: isLast ? event.timestamp : undefined,
        });
      }

      const node = current.children.get(part)!;
      if (isLast) node.lastChanged = event.timestamp;
      current = node;
    }
  }

  return { root, fileContents };
}

function isRecentChange(timestamp: string | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < 30_000;
}

function TreeNode({ node, depth, selectedPath, onSelect }: {
  node: FileNode; depth: number; selectedPath: string; onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  if (!node.isDir) {
    const { icon, color } = getFileIcon(node.name);
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`w-full text-left py-1 px-2 font-mono text-xs flex items-center gap-1.5 hover:bg-cream-dark/80 transition-colors ${
          selectedPath === node.path ? "bg-cream-dark text-ink" : "text-ink/70"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isRecentChange(node.lastChanged) && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        )}
        <span
          className="inline-flex items-center justify-center w-5 h-4 rounded-sm text-[8px] font-bold shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left py-1 px-2 font-mono text-xs text-ink hover:bg-cream-dark/80 transition-colors flex items-center gap-1.5"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        <span className="text-muted text-[10px] w-3 text-center">{expanded ? "▾" : "▸"}</span>
        <span className="text-amber-600 text-[10px]">📁</span>
        <span className="font-medium">{node.name}</span>
      </button>
      {expanded && sortedChildren.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ── Code Viewer with Syntax Highlighting ───────────

function CodeViewer({ content, fileName }: { content: string; fileName: string }) {
  const lang = getLang(fileName);
  const lines = content.split("\n");
  const lineNumWidth = String(lines.length).length;

  return (
    <div className="font-mono text-xs leading-5 overflow-x-auto">
      {lines.map((line, i) => {
        const tokens = highlightLine(line, lang);
        return (
          <div key={i} className="flex hover:bg-ink/[0.02]">
            <span className="select-none text-muted/50 text-right pr-4 shrink-0" style={{ width: `${lineNumWidth + 2}ch` }}>
              {i + 1}
            </span>
            <span className="whitespace-pre-wrap break-all">
              {tokens.map((t, j) =>
                typeof t === "string" ? (
                  <span key={j}>{t}</span>
                ) : (
                  <span key={j} style={{ color: t.color }}>{t.text}</span>
                )
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────

export function FileExplorer({ events }: FileExplorerProps) {
  const [selectedPath, setSelectedPath] = useState("");
  const [codeHeight, setCodeHeight] = useState(400);
  const resizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    startY.current = e.clientY;
    startHeight.current = codeHeight;

    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const delta = e.clientY - startY.current;
      setCodeHeight(Math.max(200, Math.min(900, startHeight.current + delta)));
    };

    const onMouseUp = () => {
      resizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [codeHeight]);

  const fileEvents = useMemo(
    () => events.filter((e) => e.type === "file.change" || e.type === "file_change" || e.type === "file.write" || e.type === "file.create"),
    [events]
  );

  const { root, fileContents } = useMemo(() => buildFileTree(fileEvents), [fileEvents]);
  const selectedContent = selectedPath ? fileContents.get(selectedPath) : null;
  const selectedFileName = selectedPath.split("/").pop() || "";

  if (fileEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono text-sm text-muted">No file changes yet</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row" style={{ height: `${codeHeight}px` }}>
        {/* File tree sidebar */}
        <div className="sm:w-56 border-b sm:border-b-0 sm:border-r border-border overflow-y-auto bg-cream-dark/30 shrink-0 max-h-48 sm:max-h-none">
          <div className="py-2">
            {Array.from(root.children.values())
              .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => (
                <TreeNode key={child.path} node={child} depth={0} selectedPath={selectedPath} onSelect={setSelectedPath} />
              ))}
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: "#fafaf8" }}>
          {selectedContent ? (
            <div className="h-full flex flex-col">
              {/* File header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-cream-dark/40">
                <div className="flex items-center gap-2">
                  {(() => {
                    const { icon, color } = getFileIcon(selectedFileName);
                    return (
                      <span
                        className="inline-flex items-center justify-center w-5 h-4 rounded-sm text-[8px] font-bold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {icon}
                      </span>
                    );
                  })()}
                  <span className="font-mono text-xs text-ink">{selectedPath}</span>
                </div>
                <span className="font-mono text-[10px] text-muted">
                  {new Date(selectedContent.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Code */}
              <div className="flex-1 overflow-auto p-4">
                <CodeViewer content={selectedContent.content} fileName={selectedFileName} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="font-mono text-xs text-muted">Select a file to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="h-1.5 bg-border/50 hover:bg-rust/30 cursor-ns-resize transition-colors flex items-center justify-center"
      >
        <div className="w-8 h-0.5 rounded-full bg-muted/40" />
      </div>
    </div>
  );
}
