"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Divider } from "@/components/ui/divider";

const BADGE_IMAGES: Record<string, string> = {
  "first-blood": "/badges/first-blood.png", "five-down": "/badges/five-down.png",
  "ten-strong": "/badges/ten-strong.png", "quarter-century": "/badges/quarter-century.png",
  "streak-3": "/badges/streak-3.png", "streak-7": "/badges/streak-7.png", "streak-30": "/badges/streak-30.png",
  "top-10": "/badges/top-10.png", "speed-demon": "/badges/speed-demon.png",
  "perfect-score": "/badges/perfect-score.png", "polyglot": "/badges/polyglot.png",
  "claude-master": "/badges/claude-master.png", "cursor-pro": "/badges/cursor-pro.png",
  "early-adopter": "/badges/early-adopter.png",
};

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", category: "milestone" });
  const [saving, setSaving] = useState(false);

  function fetchBadges() {
    adminApi.get("/api/admin/badges")
      .then((data) => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchBadges(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ name: "", slug: "", description: "", icon: "", category: "milestone" });
    setShowForm(true);
  }

  function openEdit(b: any) {
    setEditId(b.id);
    setForm({ name: b.name, slug: b.slug, description: b.description, icon: b.icon, category: b.category });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId) {
        await adminApi.put(`/api/admin/badges/${editId}`, form);
      } else {
        await adminApi.post("/api/admin/badges", form);
      }
      setShowForm(false);
      fetchBadges();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleToggle(id: string) {
    try {
      const result = await adminApi.patch(`/api/admin/badges/${id}/toggle`);
      setBadges((prev) => prev.map((b) => b.id === id ? { ...b, is_active: result.is_active } : b));
    } catch { /* ignore */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Badges</h1>
        <Button onClick={openCreate}>New Badge</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{badges.length} badge definitions</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">{editId ? "Edit Badge" : "New Badge"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
          </div>
          <div className="mb-4">
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-border bg-transparent font-mono text-sm">
                <option value="milestone">Milestone</option>
                <option value="skill">Skill</option>
                <option value="streak">Streak</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>
          <p className="font-mono text-[10px] text-muted mb-4">
            Badge image: place a PNG at <code className="bg-ink/5 px-1">client/public/badges/&#123;slug&#125;.png</code> — it will automatically display.
            Use the asset generation guide at <code className="bg-ink/5 px-1">docs/asset-generation-guide.md</code> to create matching images.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-1">Icon</span>
            <span className="col-span-3">Name</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-2 text-right">Earned</span>
            <span className="col-span-1 text-center">Active</span>
            <span className="col-span-3 text-right">Actions</span>
          </div>
          {badges.map((b: any) => (
            <div key={b.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <span className="col-span-1">
                {BADGE_IMAGES[b.slug] ? <img src={BADGE_IMAGES[b.slug]} alt={b.name} className="w-8 h-8 object-contain" /> : <span className="text-lg">🏅</span>}
              </span>
              <div className="col-span-3">
                <p className="font-display text-sm">{b.name}</p>
                <p className="font-mono text-[10px] text-muted">{b.slug}</p>
              </div>
              <span className="col-span-2"><Badge variant="default">{b.category}</Badge></span>
              <span className="col-span-2 font-mono text-xs text-muted text-right">{b.earned_count || 0} developers</span>
              <span className="col-span-1 text-center">
                <button onClick={() => handleToggle(b.id)} className={`w-8 h-5 rounded-full transition-colors ${b.is_active ? "bg-green-500" : "bg-border"} relative cursor-pointer`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${b.is_active ? "left-3.5" : "left-0.5"}`} />
                </button>
              </span>
              <span className="col-span-3 text-right flex justify-end gap-3">
                <button onClick={() => openEdit(b)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors cursor-pointer">Edit</button>
                <button onClick={async () => { if (confirm(`Delete "${b.name}"?`)) { await adminApi.delete(`/api/admin/badges/${b.id}`); fetchBadges(); } }} className="font-mono text-[10px] text-muted hover:text-rust transition-colors cursor-pointer">Delete</button>
              </span>
            </div>
          ))}
        </div></div>
      )}
    </div>
  );
}
