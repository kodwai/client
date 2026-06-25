"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface Tier {
  key: string;
  name: string;
  min_rating: number;
  color: string;
  sort_order: number;
}

function TierRow({ tier, onChanged }: { tier: Tier; onChanged: () => void }) {
  const [name, setName] = useState(tier.name);
  const [minRating, setMinRating] = useState(String(tier.min_rating));
  const [color, setColor] = useState(tier.color);
  const [sortOrder, setSortOrder] = useState(String(tier.sort_order));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.put(`/api/admin/tiers/${tier.key}`, {
        name,
        min_rating: Number(minRating),
        color,
        sort_order: Number(sortOrder),
      });
      onChanged();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-5 h-5 rounded-full border border-border shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-[10px] text-muted">{tier.key}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Min rating"
          type="number"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
        />
        <Input
          label="Color"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#rrggbb"
        />
        <Input
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", min_rating: "0", color: "#888888", sort_order: "0" });
  const [saving, setSaving] = useState(false);

  function fetchTiers() {
    adminApi
      .get("/api/admin/tiers")
      .then((data) =>
        setTiers(
          Array.isArray(data)
            ? [...data].sort((a, b) => a.min_rating - b.min_rating)
            : []
        )
      )
      .catch(() => setTiers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTiers();
  }, []);

  function openCreate() {
    setForm({ key: "", name: "", min_rating: "0", color: "#888888", sort_order: "0" });
    setShowForm(true);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await adminApi.post("/api/admin/tiers", {
        key: form.key,
        name: form.name,
        min_rating: Number(form.min_rating),
        color: form.color,
        sort_order: Number(form.sort_order),
      });
      setShowForm(false);
      fetchTiers();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Tiers</h1>
        <Button onClick={openCreate}>New Tier</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">Rating bands shown on profiles and the leaderboard.</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">New Tier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
            />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              label="Min rating"
              type="number"
              value={form.min_rating}
              onChange={(e) => setForm({ ...form, min_rating: e.target.value })}
            />
            <Input
              label="Color"
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              placeholder="#rrggbb"
            />
            <Input
              label="Sort order"
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : tiers.length === 0 ? (
        <p className="font-mono text-sm text-muted text-center py-12">No tiers yet.</p>
      ) : (
        <div className="border border-border">
          {tiers.map((tier) => (
            <TierRow key={tier.key} tier={tier} onChanged={fetchTiers} />
          ))}
        </div>
      )}
    </div>
  );
}
