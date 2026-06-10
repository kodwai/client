"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

interface Quest {
  key: string;
  scope: string;
  title: string;
  description: string;
  target: number;
  reward_xp: number;
  metric: string;
  is_active: number | boolean;
  sort_order: number;
}

const SCOPES = ["daily", "weekly"] as const;
const METRICS = ["solved", "high80", "categories"] as const;

const selectClass =
  "w-full border-b-2 border-border bg-transparent py-2 font-display text-base text-ink outline-none transition-colors focus:border-rust";

function QuestRow({ quest, onChanged }: { quest: Quest; onChanged: () => void }) {
  const [title, setTitle] = useState(quest.title);
  const [description, setDescription] = useState(quest.description);
  const [target, setTarget] = useState(String(quest.target));
  const [rewardXp, setRewardXp] = useState(String(quest.reward_xp));
  const [scope, setScope] = useState(quest.scope);
  const [metric, setMetric] = useState(quest.metric);
  const [isActive, setIsActive] = useState(!!quest.is_active);
  const [sortOrder, setSortOrder] = useState(String(quest.sort_order));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.put(`/api/admin/quests/${quest.key}`, {
        title,
        description,
        target: Number(target),
        reward_xp: Number(rewardXp),
        scope,
        metric,
        is_active: isActive,
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
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="font-mono text-[10px] text-muted">{quest.key}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {isActive ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={`w-8 h-5 rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-border"} relative cursor-pointer`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-3.5" : "left-0.5"}`} />
          </button>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-widest text-muted">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={selectClass}>
            {SCOPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block font-mono text-xs uppercase tracking-widest text-muted">Metric</label>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className={selectClass}>
            {METRICS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <Input
          label="Target"
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Input
          label="Reward XP"
          type="number"
          value={rewardXp}
          onChange={(e) => setRewardXp(e.target.value)}
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

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    key: "",
    title: "",
    description: "",
    target: "1",
    reward_xp: "0",
    scope: "daily",
    metric: "solved",
    sort_order: "0",
  });
  const [saving, setSaving] = useState(false);

  function fetchQuests() {
    adminApi
      .get("/api/admin/quests")
      .then((data) =>
        setQuests(
          Array.isArray(data)
            ? [...data].sort((a, b) => a.sort_order - b.sort_order)
            : []
        )
      )
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchQuests();
  }, []);

  function openCreate() {
    setForm({
      key: "",
      title: "",
      description: "",
      target: "1",
      reward_xp: "0",
      scope: "daily",
      metric: "solved",
      sort_order: "0",
    });
    setShowForm(true);
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await adminApi.post("/api/admin/quests", {
        key: form.key,
        title: form.title,
        description: form.description,
        target: Number(form.target),
        reward_xp: Number(form.reward_xp),
        scope: form.scope,
        metric: form.metric,
        sort_order: Number(form.sort_order),
      });
      setShowForm(false);
      fetchQuests();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Quests</h1>
        <Button onClick={openCreate}>New Quest</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">Daily and weekly objectives that award XP.</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">New Quest</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
            />
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-widest text-muted">Scope</label>
              <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={selectClass}>
                {SCOPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-widest text-muted">Metric</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className={selectClass}>
                {METRICS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <Input
              label="Target"
              type="number"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
            <Input
              label="Reward XP"
              type="number"
              value={form.reward_xp}
              onChange={(e) => setForm({ ...form, reward_xp: e.target.value })}
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
      ) : quests.length === 0 ? (
        <p className="font-mono text-sm text-muted text-center py-12">No quests yet.</p>
      ) : (
        <div className="border border-border">
          {quests.map((quest) => (
            <QuestRow key={quest.key} quest={quest} onChanged={fetchQuests} />
          ))}
        </div>
      )}
    </div>
  );
}
