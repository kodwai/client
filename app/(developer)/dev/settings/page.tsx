"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import posthog from "posthog-js";
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
  const { user, refreshUser } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess(false);

    const candidate = username.trim().toLowerCase();
    if (candidate === user?.username) return;

    setSavingUsername(true);
    try {
      await api.patch("/api/auth/me/username", { username: candidate });
      await refreshUser();
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 2500);
    } catch (err: unknown) {
      setUsernameError(err instanceof Error ? err.message : "Could not update username.");
    } finally {
      setSavingUsername(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch("/api/auth/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  }

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
      posthog.capture("api_key_added", { label: keyLabel });
      setKeyValue("");
      setKeyLabel("");
      setShowForm(false);
      await fetchKeys();
      await refreshUser();
    } catch (err: unknown) {
      posthog.captureException(err);
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
      posthog.capture("api_key_deleted", { label: deleteTarget.label });
      setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      setDeleteTarget(null);
      await refreshUser();
    } catch (err: unknown) {
      posthog.captureException(err);
      setError(err instanceof Error ? err.message : "Failed to delete API key.");
    } finally {
      setDeleting(false);
    }
  }

  const usernameDirty = username.trim().toLowerCase() !== (user?.username || "");

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Settings</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Manage your account and API keys
      </p>
      <Divider className="mx-0 my-8" />

      <div className="mb-8">
        <h2 className="font-display text-xl">Username</h2>
        <p className="font-mono text-xs text-muted mt-1 mb-4">
          Lowercase letters, numbers, hyphens, and underscores. 3 to 50 characters.
        </p>

        {usernameError && (
          <div className="mb-4 p-3 border border-rust/20 bg-rust/5 font-mono text-xs text-rust">
            {usernameError}
          </div>
        )}
        {usernameSuccess && (
          <div className="mb-4 p-3 border border-border bg-white/50 font-mono text-xs text-ink/80">
            Username updated.
          </div>
        )}

        <form onSubmit={handleUsernameSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              minLength={3}
              maxLength={50}
              placeholder="your-handle"
              required
            />
          </div>
          <Button type="submit" disabled={savingUsername || !usernameDirty}>
            {savingUsername ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>

      <Divider className="mx-0 my-8" />

      <div className="mb-8">
        <h2 className="font-display text-xl">Password</h2>
        <p className="font-mono text-xs text-muted mt-1 mb-4">
          Enter your current password to set a new one. Forgot it?{" "}
          <Link href="/forgot-password" className="text-rust hover:text-rust-hover transition-colors">
            Reset by email
          </Link>
          .
        </p>

        {passwordError && (
          <div className="mb-4 p-3 border border-rust/20 bg-rust/5 font-mono text-xs text-rust">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 p-3 border border-border bg-white/50 font-mono text-xs text-ink/80">
            Password updated.
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Button
            type="submit"
            disabled={
              savingPassword || !currentPassword || !newPassword || !confirmPassword
            }
          >
            {savingPassword ? "Updating..." : "Update password"}
          </Button>
        </form>
      </div>

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

      <Divider className="mx-0 my-8" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Feedback</h2>
          <p className="font-mono text-xs text-muted mt-1">
            View your submitted feedback, bug reports, and feature requests — including admin responses.
          </p>
        </div>
        <Link href="/dev/settings/feedback">
          <Button variant="secondary">View Feedback</Button>
        </Link>
      </div>
    </div>
  );
}
