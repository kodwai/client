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
    { keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "new", "this", "try", "catch", "throw", "switch", "case", "break", "continue", "typeof", "instanceof", "of", "in", "yield", "super", "extends", "static", "get", "set", "delete", "void", "with", "do", "finally", "debugger"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "undefined", "NaN", "Infinity"], color: "#b07d2e" },
    { keywords: ["console", "Math", "JSON", "Promise", "Array", "Object", "Map", "Set", "Date", "Error", "RegExp", "Symbol", "Proxy", "Reflect", "parseInt", "parseFloat", "setTimeout", "setInterval", "fetch", "require", "module", "exports", "window", "document", "process"], color: "#b8860b" },
  ],
  ts: [
    { keywords: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "new", "this", "try", "catch", "throw", "type", "interface", "extends", "implements", "enum", "namespace", "as", "is", "keyof", "typeof", "instanceof", "of", "in", "readonly", "abstract", "declare", "module", "switch", "case", "break", "continue", "super", "static", "get", "set", "delete", "void", "do", "finally", "infer", "satisfies", "using"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "undefined", "void", "never", "any", "unknown", "string", "number", "boolean", "object", "symbol", "bigint"], color: "#b07d2e" },
    { keywords: ["React", "useState", "useEffect", "useCallback", "useMemo", "useRef", "useContext", "useReducer", "JSX", "FC", "ReactNode", "Promise", "Array", "Record", "Partial", "Required", "Omit", "Pick", "Exclude", "Extract", "ReturnType", "Awaited"], color: "#b8860b" },
  ],
  py: [
    { keywords: ["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "with", "try", "except", "finally", "raise", "pass", "break", "continue", "and", "or", "not", "in", "is", "lambda", "yield", "async", "await", "global", "nonlocal", "del", "assert", "match", "case"], color: "#c678dd" },
    { keywords: ["True", "False", "None", "self", "cls"], color: "#b07d2e" },
    { keywords: ["print", "len", "range", "list", "dict", "set", "tuple", "str", "int", "float", "bool", "type", "isinstance", "issubclass", "super", "property", "staticmethod", "classmethod", "dataclass", "enumerate", "zip", "map", "filter", "sorted", "reversed", "open", "input", "Exception", "ValueError", "TypeError", "KeyError", "IndexError", "AttributeError", "RuntimeError", "OSError", "FileNotFoundError"], color: "#b8860b" },
  ],
  go: [
    { keywords: ["func", "return", "if", "else", "for", "range", "switch", "case", "default", "break", "continue", "go", "defer", "select", "chan", "map", "struct", "interface", "type", "package", "import", "var", "const", "fallthrough", "goto"], color: "#c678dd" },
    { keywords: ["true", "false", "nil", "iota"], color: "#b07d2e" },
    { keywords: ["string", "int", "int8", "int16", "int32", "int64", "uint", "uint8", "uint16", "uint32", "uint64", "float32", "float64", "complex64", "complex128", "bool", "byte", "rune", "error", "any", "comparable"], color: "#b8860b" },
    { keywords: ["fmt", "log", "os", "io", "net", "http", "json", "context", "sync", "time", "errors", "strings", "strconv", "math", "testing", "reflect", "sort", "encoding", "bytes", "regexp", "crypto", "path", "filepath", "bufio"], color: "#61afef" },
  ],
  rs: [
    { keywords: ["fn", "let", "mut", "return", "if", "else", "for", "while", "loop", "match", "struct", "enum", "impl", "trait", "pub", "use", "mod", "crate", "self", "super", "where", "as", "ref", "move", "async", "await", "unsafe", "dyn", "type", "extern", "const", "static", "macro_rules"], color: "#c678dd" },
    { keywords: ["true", "false", "None", "Some", "Ok", "Err", "Self"], color: "#b07d2e" },
    { keywords: ["i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize", "f32", "f64", "bool", "char", "str", "String", "Vec", "Box", "Rc", "Arc", "Option", "Result", "HashMap", "HashSet", "BTreeMap", "Cow", "Pin", "Future", "Iterator", "Display", "Debug", "Clone", "Copy", "Send", "Sync", "Drop", "Default", "From", "Into", "TryFrom", "TryInto", "AsRef", "Deref"], color: "#b8860b" },
  ],
  css: [
    { keywords: ["import", "media", "keyframes", "font-face", "supports", "layer", "container", "property", "charset"], color: "#c678dd" },
    { keywords: ["none", "auto", "inherit", "initial", "unset", "revert", "transparent", "currentColor", "important"], color: "#b07d2e" },
    { keywords: ["display", "position", "width", "height", "margin", "padding", "border", "background", "color", "font", "text", "flex", "grid", "align", "justify", "overflow", "opacity", "transform", "transition", "animation", "cursor", "z-index", "box-shadow", "border-radius", "gap", "content", "top", "right", "bottom", "left", "min-width", "max-width", "min-height", "max-height", "outline", "visibility", "float", "clear"], color: "#b8860b" },
  ],
  html: [
    { keywords: ["DOCTYPE", "html", "head", "body", "div", "span", "p", "a", "img", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "table", "tr", "td", "th", "form", "input", "button", "select", "option", "textarea", "label", "script", "style", "link", "meta", "title", "header", "footer", "nav", "main", "section", "article", "aside", "figure", "figcaption", "video", "audio", "canvas", "svg", "path"], color: "#e06c75" },
    { keywords: ["class", "id", "href", "src", "alt", "type", "name", "value", "placeholder", "action", "method", "target", "rel", "content", "charset", "viewport", "width", "height", "style", "onclick", "onchange", "onsubmit", "data", "aria", "role", "tabindex", "disabled", "required", "readonly", "checked", "selected", "hidden", "async", "defer", "crossorigin"], color: "#b07d2e" },
  ],
  java: [
    { keywords: ["public", "private", "protected", "class", "interface", "extends", "implements", "abstract", "final", "static", "void", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "try", "catch", "finally", "throw", "throws", "new", "this", "super", "import", "package", "instanceof", "synchronized", "volatile", "transient", "native", "enum", "assert", "record", "sealed", "permits", "yield", "var"], color: "#c678dd" },
    { keywords: ["true", "false", "null"], color: "#b07d2e" },
    { keywords: ["String", "Integer", "Long", "Double", "Float", "Boolean", "Character", "Byte", "Short", "Object", "List", "ArrayList", "Map", "HashMap", "Set", "HashSet", "Optional", "Stream", "Collection", "Iterator", "Comparable", "Runnable", "Thread", "Exception", "RuntimeException", "IOException", "System", "Math", "Arrays", "Collections"], color: "#b8860b" },
  ],
  rb: [
    { keywords: ["def", "end", "class", "module", "if", "elsif", "else", "unless", "while", "until", "for", "do", "begin", "rescue", "ensure", "raise", "return", "yield", "block_given", "require", "require_relative", "include", "extend", "prepend", "attr_accessor", "attr_reader", "attr_writer", "public", "private", "protected", "self", "super", "then", "when", "case", "lambda", "proc", "and", "or", "not", "in", "defined"], color: "#c678dd" },
    { keywords: ["true", "false", "nil", "self", "__FILE__", "__LINE__", "__dir__"], color: "#b07d2e" },
    { keywords: ["puts", "print", "p", "gets", "chomp", "to_s", "to_i", "to_f", "to_a", "to_h", "each", "map", "select", "reject", "reduce", "inject", "find", "any", "all", "none", "sort", "flatten", "compact", "uniq", "freeze", "frozen", "dup", "clone", "respond_to", "send", "method_missing", "new", "initialize", "inspect"], color: "#b8860b" },
  ],
  php: [
    { keywords: ["function", "class", "interface", "trait", "extends", "implements", "abstract", "final", "public", "private", "protected", "static", "return", "if", "else", "elseif", "for", "foreach", "while", "do", "switch", "case", "break", "continue", "default", "try", "catch", "finally", "throw", "new", "use", "namespace", "require", "require_once", "include", "include_once", "echo", "print", "die", "exit", "isset", "unset", "empty", "list", "array", "match", "enum", "readonly", "fn", "yield", "as", "instanceof", "global", "const", "var"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "TRUE", "FALSE", "NULL", "self", "parent", "static"], color: "#b07d2e" },
    { keywords: ["string", "int", "float", "bool", "array", "object", "callable", "iterable", "void", "never", "mixed", "null"], color: "#b8860b" },
  ],
  c: [
    { keywords: ["int", "char", "float", "double", "void", "long", "short", "unsigned", "signed", "const", "static", "extern", "register", "volatile", "auto", "struct", "union", "enum", "typedef", "sizeof", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "goto", "inline", "restrict", "_Bool", "_Complex", "_Imaginary", "_Atomic", "_Thread_local", "_Static_assert", "_Alignof", "_Alignas", "_Generic", "_Noreturn"], color: "#c678dd" },
    { keywords: ["NULL", "EOF", "true", "false", "stdin", "stdout", "stderr"], color: "#b07d2e" },
    { keywords: ["printf", "scanf", "fprintf", "fscanf", "sprintf", "sscanf", "malloc", "calloc", "realloc", "free", "memcpy", "memset", "memmove", "strlen", "strcpy", "strcat", "strcmp", "strncpy", "strncat", "strncmp", "fopen", "fclose", "fread", "fwrite", "fgets", "fputs", "fseek", "ftell", "exit", "abort", "assert", "perror", "strerror", "atoi", "atof", "atol", "rand", "srand", "time", "clock", "sleep"], color: "#b8860b" },
  ],
  cpp: [
    { keywords: ["int", "char", "float", "double", "void", "long", "short", "unsigned", "signed", "const", "static", "extern", "volatile", "auto", "struct", "union", "enum", "typedef", "sizeof", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "goto", "class", "public", "private", "protected", "virtual", "override", "final", "friend", "operator", "template", "typename", "namespace", "using", "new", "delete", "try", "catch", "throw", "noexcept", "constexpr", "consteval", "constinit", "concept", "requires", "co_await", "co_yield", "co_return", "inline", "explicit", "mutable", "thread_local", "decltype", "nullptr"], color: "#c678dd" },
    { keywords: ["true", "false", "nullptr", "NULL", "this"], color: "#b07d2e" },
    { keywords: ["std", "string", "vector", "map", "unordered_map", "set", "unordered_set", "list", "deque", "queue", "stack", "priority_queue", "pair", "tuple", "optional", "variant", "any", "array", "span", "string_view", "unique_ptr", "shared_ptr", "weak_ptr", "make_unique", "make_shared", "move", "forward", "swap", "sort", "find", "count", "accumulate", "transform", "copy", "fill", "begin", "end", "size", "empty", "push_back", "emplace_back", "insert", "erase", "clear", "front", "back", "at", "cout", "cin", "cerr", "endl", "getline"], color: "#b8860b" },
  ],
  sh: [
    { keywords: ["if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac", "in", "function", "return", "exit", "break", "continue", "local", "export", "source", "readonly", "declare", "typeset", "unset", "shift", "set", "eval", "exec", "trap", "wait", "select", "until", "coproc", "time"], color: "#c678dd" },
    { keywords: ["true", "false"], color: "#b07d2e" },
    { keywords: ["echo", "printf", "read", "cat", "grep", "sed", "awk", "cut", "sort", "uniq", "wc", "head", "tail", "find", "xargs", "mkdir", "rm", "cp", "mv", "ls", "cd", "pwd", "chmod", "chown", "curl", "wget", "tar", "gzip", "gunzip", "zip", "unzip", "ssh", "scp", "rsync", "git", "docker", "npm", "node", "python", "pip", "make", "gcc", "test", "basename", "dirname", "realpath", "which", "whereis", "whoami", "date", "sleep", "kill", "ps", "top", "df", "du", "mount", "umount"], color: "#b8860b" },
  ],
  sql: [
    { keywords: ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "DROP", "ALTER", "TABLE", "INDEX", "VIEW", "DATABASE", "SCHEMA", "JOIN", "INNER", "LEFT", "RIGHT", "OUTER", "FULL", "CROSS", "ON", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE", "IS", "NULL", "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "UNION", "ALL", "DISTINCT", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "CHECK", "DEFAULT", "CONSTRAINT", "AUTO_INCREMENT", "AUTOINCREMENT", "IF", "NOT", "EXISTS", "CASCADE", "TRIGGER", "PROCEDURE", "FUNCTION", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "GRANT", "REVOKE",
      "select", "from", "where", "insert", "into", "values", "update", "set", "delete", "create", "drop", "alter", "table", "index", "view", "database", "schema", "join", "inner", "left", "right", "outer", "full", "cross", "on", "and", "or", "not", "in", "between", "like", "is", "null", "as", "order", "by", "group", "having", "limit", "offset", "union", "all", "distinct", "exists", "case", "when", "then", "else", "end", "asc", "desc", "primary", "key", "foreign", "references", "unique", "check", "default", "constraint"], color: "#c678dd" },
    { keywords: ["INTEGER", "TEXT", "REAL", "BLOB", "VARCHAR", "CHAR", "INT", "BIGINT", "SMALLINT", "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "BOOLEAN", "DATE", "DATETIME", "TIMESTAMP", "SERIAL",
      "integer", "text", "real", "blob", "varchar", "char", "int", "bigint", "smallint", "decimal", "numeric", "float", "double", "boolean", "date", "datetime", "timestamp", "serial"], color: "#b8860b" },
  ],
  yaml: [
    { keywords: ["true", "false", "yes", "no", "on", "off", "null", "True", "False", "Yes", "No", "On", "Off", "Null", "TRUE", "FALSE", "NULL"], color: "#b07d2e" },
  ],
  json: [],
  kt: [
    { keywords: ["fun", "val", "var", "class", "object", "interface", "abstract", "open", "sealed", "data", "enum", "annotation", "companion", "override", "return", "if", "else", "when", "for", "while", "do", "try", "catch", "finally", "throw", "import", "package", "as", "is", "in", "out", "by", "init", "constructor", "this", "super", "suspend", "inline", "crossinline", "noinline", "reified", "typealias", "where", "get", "set", "field", "it", "lateinit", "lazy", "internal", "private", "protected", "public", "const", "tailrec", "operator", "infix", "expect", "actual"], color: "#c678dd" },
    { keywords: ["true", "false", "null", "Unit", "Nothing", "Any"], color: "#b07d2e" },
    { keywords: ["String", "Int", "Long", "Double", "Float", "Boolean", "Char", "Byte", "Short", "Array", "List", "MutableList", "Map", "MutableMap", "Set", "MutableSet", "Pair", "Triple", "Sequence", "Flow", "Deferred", "Job", "CoroutineScope", "Channel", "StateFlow", "SharedFlow", "LiveData", "ViewModel", "Activity", "Fragment", "Context", "Intent", "Bundle", "View", "ViewGroup", "RecyclerView", "Adapter", "Composable", "remember", "mutableStateOf", "LaunchedEffect"], color: "#b8860b" },
  ],
  swift: [
    { keywords: ["func", "var", "let", "class", "struct", "enum", "protocol", "extension", "import", "return", "if", "else", "guard", "for", "while", "repeat", "switch", "case", "break", "continue", "default", "do", "try", "catch", "throw", "throws", "rethrows", "async", "await", "actor", "typealias", "associatedtype", "init", "deinit", "subscript", "operator", "precedencegroup", "infix", "prefix", "postfix", "where", "self", "Self", "super", "in", "is", "as", "some", "any", "inout", "mutating", "nonmutating", "lazy", "weak", "unowned", "static", "final", "override", "private", "fileprivate", "internal", "public", "open", "convenience", "required", "optional", "indirect", "willSet", "didSet", "get", "set", "defer", "fallthrough"], color: "#c678dd" },
    { keywords: ["true", "false", "nil"], color: "#b07d2e" },
    { keywords: ["String", "Int", "Double", "Float", "Bool", "Character", "Array", "Dictionary", "Set", "Optional", "Result", "Error", "Codable", "Decodable", "Encodable", "Hashable", "Equatable", "Comparable", "Identifiable", "ObservableObject", "Published", "State", "Binding", "View", "Text", "Image", "Button", "NavigationView", "List", "ForEach", "VStack", "HStack", "ZStack", "Spacer", "Color", "Font", "CGFloat", "CGPoint", "CGSize", "CGRect", "URL", "Data", "Date", "Timer", "Task", "MainActor", "Sendable"], color: "#b8860b" },
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
    css: "css", scss: "css", less: "css",
    html: "html", htm: "html", xml: "html", svg: "html",
    java: "java",
    kt: "kt", kts: "kt",
    rb: "rb", rake: "rb", gemspec: "rb",
    php: "php",
    c: "c", h: "c",
    cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
    sh: "sh", bash: "sh", zsh: "sh",
    sql: "sql",
    yaml: "yaml", yml: "yaml",
    json: "json",
    swift: "swift",
  };
  return map[ext] || "";
}

function highlightLine(line: string, lang: string): (string | { text: string; color: string })[] {
  if (!lang) return [line];

  // JSON: color keys and values
  if (lang === "json") {
    const result: (string | { text: string; color: string })[] = [];
    const tokens = line.split(/("(?:[^"\\]|\\.)*")\s*(:)?/g);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (!t) continue;
      if (t === ":") { result.push({ text: ":", color: "#abb2bf" }); continue; }
      if (/^"/.test(t)) {
        const isKey = tokens[i + 1] === ":";
        result.push({ text: t, color: isKey ? "#e06c75" : "#98c379" });
      } else if (/^[\d.]+$/.test(t.trim())) {
        result.push({ text: t, color: "#b07d2e" });
      } else if (/true|false|null/.test(t)) {
        result.push({ text: t, color: "#b07d2e" });
      } else {
        result.push(t);
      }
    }
    return result;
  }

  // CSS: color properties, values, selectors
  if (lang === "css") {
    const result: (string | { text: string; color: string })[] = [];
    const trimmed = line.trim();
    // Comments
    if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return [{ text: line, color: "#5c6370" }];
    }
    // @rules
    if (trimmed.startsWith("@")) {
      return [{ text: line, color: "#c678dd" }];
    }
    // Property: value
    const propMatch = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.+?)(;?\s*)$/);
    if (propMatch) {
      result.push(propMatch[1]);
      result.push({ text: propMatch[2], color: "#b8860b" });
      result.push(propMatch[3]);
      // Color hex values, numbers, and common values
      const val = propMatch[4].replace(/(#[0-9a-fA-F]{3,8})/g, "§HEX§$1§/HEX§")
        .replace(/(\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?)/g, "§NUM§$1§/NUM§");
      const parts = val.split(/§(HEX|NUM|\/HEX|\/NUM)§/);
      let inHex = false, inNum = false;
      for (const p of parts) {
        if (p === "HEX") { inHex = true; continue; }
        if (p === "/HEX") { inHex = false; continue; }
        if (p === "NUM") { inNum = true; continue; }
        if (p === "/NUM") { inNum = false; continue; }
        if (inHex) result.push({ text: p, color: "#56b6c2" });
        else if (inNum) result.push({ text: p, color: "#b07d2e" });
        else result.push({ text: p, color: "#98c379" });
      }
      result.push(propMatch[5]);
      return result;
    }
    // Selector lines
    if (trimmed.endsWith("{") || trimmed.endsWith(",")) {
      return [{ text: line, color: "#e06c75" }];
    }
    return [line];
  }

  // HTML: color tags and attributes
  if (lang === "html") {
    const result: (string | { text: string; color: string })[] = [];
    const tokens = line.split(/(<\/?[\w-]+|>|\/?>|[\w-]+=|"[^"]*"|'[^']*'|<!--.*?-->)/g);
    for (const t of tokens) {
      if (!t) continue;
      if (/^<!--/.test(t)) { result.push({ text: t, color: "#5c6370" }); continue; }
      if (/^<\/?[\w-]+$/.test(t)) { result.push({ text: t, color: "#e06c75" }); continue; }
      if (/^\/?>$|^>$/.test(t)) { result.push({ text: t, color: "#e06c75" }); continue; }
      if (/^[\w-]+=$/.test(t)) { result.push({ text: t, color: "#b07d2e" }); continue; }
      if (/^["']/.test(t)) { result.push({ text: t, color: "#98c379" }); continue; }
      result.push(t);
    }
    return result;
  }

  // YAML: keys and values
  if (lang === "yaml") {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) return [{ text: line, color: "#5c6370" }];
    const kvMatch = line.match(/^(\s*)([\w.-]+)(\s*:\s*)(.*)/);
    if (kvMatch) {
      const result: (string | { text: string; color: string })[] = [];
      result.push(kvMatch[1]);
      result.push({ text: kvMatch[2], color: "#e06c75" });
      result.push(kvMatch[3]);
      const val = kvMatch[4];
      if (/^["']/.test(val)) result.push({ text: val, color: "#98c379" });
      else if (/^(true|false|yes|no|null|on|off)$/i.test(val.trim())) result.push({ text: val, color: "#b07d2e" });
      else if (/^\d/.test(val.trim())) result.push({ text: val, color: "#b07d2e" });
      else result.push({ text: val, color: "#98c379" });
      return result;
    }
    if (trimmed.startsWith("- ")) {
      return [{ text: line.slice(0, line.indexOf("-")), color: "" }, { text: "- ", color: "#abb2bf" }, { text: line.slice(line.indexOf("-") + 2), color: "#98c379" }].filter(t => typeof t === "string" ? t : t.text);
    }
    return [line];
  }

  const patterns = KEYWORD_PATTERNS[lang];
  if (!patterns) return [line];

  const result: (string | { text: string; color: string })[] = [];

  // Determine comment prefix for the language
  const commentPrefix = ["py", "rb", "sh", "yaml"].includes(lang) ? "#" : "//";
  const commentRegex = lang === "py" || lang === "rb" || lang === "sh" || lang === "yaml"
    ? /(\b[\w]+\b|"[^"]*"|'[^']*'|`[^`]*`|#.*$|\d+\.?\d*)/g
    : /(\b[\w]+\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*$|\/\*.*?\*\/|\d+\.?\d*)/g;

  const tokens = line.split(commentRegex);

  for (const token of tokens) {
    if (!token) continue;

    // String literals
    if (/^["'`]/.test(token)) {
      result.push({ text: token, color: "#98c379" });
      continue;
    }

    // Comments
    if (token.startsWith(commentPrefix) || token.startsWith("/*")) {
      result.push({ text: token, color: "#5c6370" });
      continue;
    }

    // Numbers
    if (/^\d+\.?\d*$/.test(token)) {
      result.push({ text: token, color: "#b07d2e" });
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
