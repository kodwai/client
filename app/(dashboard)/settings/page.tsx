"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

export default function OrganizationSettingsPage() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/api/organizations/me")
      .then((data) => {
        setOrgName(data.name || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/api/organizations/me", { name: orgName });
      setSuccess("Organization updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
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
      <h1 className="font-display text-3xl mb-2">Organization Settings</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Manage your organization details
      </p>
      <Divider className="mx-0 my-8" />

      <Card accent>
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Corp"
            required
          />

          {error && <p className="font-mono text-xs text-rust">{error}</p>}
          {success && <p className="font-mono text-xs text-green-700">{success}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
