"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface ApiKey {
  id: string;
  label: string;
  key_last4: string;
  is_active: boolean;
  created_at: string;
}

export default function DeveloperSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [keyLabel, setKeyLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchKeys() {
    try {
      const data = await api.get("/api/api-keys");
      setKeys(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError("");

    try {
      await api.post("/api/api-keys", { key: keyValue, label: keyLabel });
      setKeyValue("");
      setKeyLabel("");
      setShowForm(false);
      await fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add API key.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/api/api-keys/${deleteTarget.id}`);
      setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete API key.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Settings</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Manage your account and API keys
      </p>
      <Divider className="mx-0 my-8" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl">Anthropic API Key</h2>
          <p className="font-mono text-xs text-muted mt-1">
            Your API key is used for AI-powered scoring after you submit a challenge.
            Without a key, you&apos;ll only get objective scoring (tests, code quality, time).
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add API Key"}
        </Button>
      </div>

      {error && (
        <p className="font-mono text-xs text-rust mb-4">{error}</p>
      )}

      {showForm && (
        <Card accent className="mb-6">
          <h3 className="font-display text-lg mb-4">Add a New Key</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              label="Label"
              value={keyLabel}
              onChange={(e) => setKeyLabel(e.target.value)}
              placeholder="e.g. My Key"
              required
            />
            <Input
              label="API Key"
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-ant-..."
              required
            />
            <Button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Save Key"}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <p className="font-mono text-sm text-muted text-center py-4">
            No API key configured. Add your Anthropic key to unlock full AI-powered scoring.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <Card key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div>
                  <p className="font-display text-lg">{k.label}</p>
                  <p className="font-mono text-sm text-muted mt-0.5">
                    {"····" + k.key_last4}
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <button
                onClick={() => setDeleteTarget(k)}
                className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
              >
                Delete
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete API Key"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? Without an API key, you'll only get objective scoring on future submissions.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
