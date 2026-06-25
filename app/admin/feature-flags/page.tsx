"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface Flag {
  key: string;
  name: string;
  description: string;
  enabled: number;
  starts_at: string | null;
  ends_at: string | null;
  updated_at: string;
}

// Convert a stored ISO-8601 string to a value usable by <input type="datetime-local"> (YYYY-MM-DDTHH:MM).
function toLocalInput(value: string | null): string {
  if (!value) return "";
  // Strip any timezone and seconds, keep YYYY-MM-DDTHH:MM.
  const trimmed = value.replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : "";
}

// Build the payload value for a window field: ISO string when set, "" to clear.
function toPayloadValue(input: string): string {
  if (!input) return "";
  return input.length === 16 ? `${input}:00` : input;
}

function FlagRow({ flag, onChanged }: { flag: Flag; onChanged: () => void }) {
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(flag.starts_at));
  const [endsAt, setEndsAt] = useState<string>(toLocalInput(flag.ends_at));
  const [savingWindow, setSavingWindow] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  const isEnabled = flag.enabled === 1;

  async function handleToggle() {
    setTogglingEnabled(true);
    try {
      await adminApi.put(`/api/admin/feature-flags/${flag.key}`, { enabled: !isEnabled });
      onChanged();
    } catch {
      /* ignore */
    } finally {
      setTogglingEnabled(false);
    }
  }

  async function handleSaveWindow() {
    setSavingWindow(true);
    try {
      await adminApi.put(`/api/admin/feature-flags/${flag.key}`, {
        starts_at: toPayloadValue(startsAt),
        ends_at: toPayloadValue(endsAt),
      });
      onChanged();
    } catch {
      /* ignore */
    } finally {
      setSavingWindow(false);
    }
  }

  return (
    <div className="px-4 py-4 border-b border-border last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-base">{flag.name}</p>
          <p className="font-mono text-[10px] text-muted">{flag.key}</p>
          {flag.description && (
            <p className="text-sm text-ink/70 mt-1">{flag.description}</p>
          )}
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {isEnabled ? "On" : "Off"}
          </span>
          <button
            onClick={handleToggle}
            disabled={togglingEnabled}
            className={`w-8 h-5 rounded-full transition-colors ${isEnabled ? "bg-green-500" : "bg-border"} relative cursor-pointer disabled:opacity-50`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? "left-3.5" : "left-0.5"}`} />
          </button>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-widest text-muted">Starts at</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full border-b-2 border-border bg-transparent py-2 font-display text-base text-ink outline-none transition-colors focus:border-rust"
          />
        </div>
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-widest text-muted">Ends at</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full border-b-2 border-border bg-transparent py-2 font-display text-base text-ink outline-none transition-colors focus:border-rust"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Button onClick={handleSaveWindow} disabled={savingWindow}>
          {savingWindow ? "Saving..." : "Save window"}
        </Button>
        <p className="font-mono text-[10px] text-muted">Leave blank for always-on.</p>
      </div>
    </div>
  );
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);

  function fetchFlags() {
    adminApi
      .get("/api/admin/feature-flags")
      .then((data) => setFlags(Array.isArray(data) ? data : []))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchFlags();
  }, []);

  function openCreate() {
    setForm({ key: "", name: "", description: "" });
    setShowForm(true);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await adminApi.post("/api/admin/feature-flags", form);
      setShowForm(false);
      fetchFlags();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Feature Flags</h1>
        <Button onClick={openCreate}>New Flag</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">Turn features on/off, or schedule a window.</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">New Flag</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
            />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-4">
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : flags.length === 0 ? (
        <p className="font-mono text-sm text-muted text-center py-12">No feature flags yet.</p>
      ) : (
        <div className="border border-border">
          {flags.map((flag) => (
            <FlagRow key={flag.key} flag={flag} onChanged={fetchFlags} />
          ))}
        </div>
      )}
    </div>
  );
}
