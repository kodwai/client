"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface ApiKey {
  id: string;
  label: string;
  last4: string;
  status: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [keyValue, setKeyValue] = useState("");
  const [keyLabel, setKeyLabel] = useState("");
  const [adding, setAdding] = useState(false);

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

  async function handleDelete(id: string) {
    setError("");
    try {
      await api.delete(`/api/api-keys/${id}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete API key.");
    }
  }

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
        <h1 className="font-display text-2xl sm:text-3xl">API Keys</h1>
        <Button
          variant="secondary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add API Key"}
        </Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        Add your Anthropic API key so candidates can use Claude Code during
        interviews. Your key is encrypted and never logged.
      </p>
      <Divider className="mx-0 my-8" />

      {error && (
        <p className="font-mono text-xs text-rust mb-4">{error}</p>
      )}

      {showForm && (
        <Card accent className="mb-8">
          <h2 className="font-display text-xl mb-4">Add a New Key</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              label="Label"
              value={keyLabel}
              onChange={(e) => setKeyLabel(e.target.value)}
              placeholder="e.g. Production Key"
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

      {keys.length === 0 ? (
        <Card>
          <p className="font-mono text-sm text-muted text-center py-4">
            No API keys configured. Add one to enable Claude Code in interviews.
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
                    {"····" + k.last4}
                  </p>
                </div>
                <Badge variant="success">{k.status}</Badge>
              </div>
              <button
                onClick={() => handleDelete(k.id)}
                className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
              >
                Delete
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
