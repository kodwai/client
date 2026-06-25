"use client";

const KNOWN_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "Bash",
  "Glob",
  "Grep",
  "Agent",
  "WebSearch",
  "WebFetch",
  "NotebookEdit",
];

interface ToolConfigProps {
  allowedTools: string[] | null;
  disallowedTools: string[] | null;
  onChange: (config: { allowedTools: string[] | null; disallowedTools: string[] | null }) => void;
}

export function ToolConfig({ allowedTools, disallowedTools, onChange }: ToolConfigProps) {
  const allowed = allowedTools ?? [];
  const disallowed = disallowedTools ?? [];

  function toggleAllowed(tool: string) {
    if (allowed.includes(tool)) {
      const next = allowed.filter((t) => t !== tool);
      onChange({ allowedTools: next.length > 0 ? next : null, disallowedTools });
    } else {
      // If adding to allowed, remove from disallowed
      const nextDisallowed = disallowed.filter((t) => t !== tool);
      onChange({
        allowedTools: [...allowed, tool],
        disallowedTools: nextDisallowed.length > 0 ? nextDisallowed : null,
      });
    }
  }

  function toggleDisallowed(tool: string) {
    if (disallowed.includes(tool)) {
      const next = disallowed.filter((t) => t !== tool);
      onChange({ allowedTools, disallowedTools: next.length > 0 ? next : null });
    } else {
      // If adding to disallowed, remove from allowed
      const nextAllowed = allowed.filter((t) => t !== tool);
      onChange({
        allowedTools: nextAllowed.length > 0 ? nextAllowed : null,
        disallowedTools: [...disallowed, tool],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-4">
          Allowed Tools
        </label>
        <p className="font-mono text-xs text-muted/70 mb-3">
          If set, only these tools will be available. Leave empty to allow all.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {KNOWN_TOOLS.map((tool) => (
            <label
              key={`allowed-${tool}`}
              className="flex items-center gap-2 cursor-pointer font-mono text-sm text-ink hover:text-rust transition-colors"
            >
              <input
                type="checkbox"
                checked={allowed.includes(tool)}
                onChange={() => toggleAllowed(tool)}
                className="accent-rust"
              />
              {tool}
            </label>
          ))}
        </div>
      </div>

      <div className="w-12 h-px bg-border" />

      <div>
        <label className="block font-mono text-xs uppercase tracking-widest text-muted mb-4">
          Blocked Tools
        </label>
        <p className="font-mono text-xs text-muted/70 mb-3">
          These tools will be explicitly blocked during the session.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {KNOWN_TOOLS.map((tool) => (
            <label
              key={`blocked-${tool}`}
              className="flex items-center gap-2 cursor-pointer font-mono text-sm text-ink hover:text-rust transition-colors"
            >
              <input
                type="checkbox"
                checked={disallowed.includes(tool)}
                onChange={() => toggleDisallowed(tool)}
                className="accent-rust"
              />
              {tool}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
