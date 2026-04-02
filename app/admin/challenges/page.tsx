"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface Challenge {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  category: string;
  is_public: boolean;
  is_featured: boolean;
  submission_count: number;
  avg_score: number | null;
  created_at: string;
}

const difficultyVariant: Record<string, "success" | "warning" | "error"> = { easy: "success", medium: "warning", hard: "error" };

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", problem_statement_md: "", difficulty: "medium", category: "backend", tags: "", time_limit_minutes: "60" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function fetchChallenges() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    adminApi.get(`/api/admin/challenges?${params}`)
      .then((data) => {
        // API returns {challenges: [...], total: N}
        if (Array.isArray(data)) {
          // Fallback if API returns plain array
          setChallenges(data);
          setTotal(data.length);
        } else {
          setChallenges(data?.challenges || []);
          setTotal(data?.total || 0);
        }
      })
      .catch((err) => { console.error("Admin challenges fetch error:", err); setChallenges([]); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(fetchChallenges, 200);
    return () => clearTimeout(timer);
  }, [search]);

  async function togglePublish(id: string) {
    try {
      const result = await adminApi.patch(`/api/admin/challenges/${id}/publish`);
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, is_public: result.is_public } : c));
    } catch { /* ignore */ }
  }

  async function toggleFeature(id: string) {
    try {
      const result = await adminApi.patch(`/api/admin/challenges/${id}/feature`);
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, is_featured: result.is_featured } : c));
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(`/api/admin/challenges/${deleteTarget.id}`);
      setChallenges((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  function openCreate() {
    setEditId(null);
    setForm({ title: "", slug: "", description: "", problem_statement_md: "", difficulty: "medium", category: "backend", tags: "", time_limit_minutes: "60" });
    setFormError("");
    setShowForm(true);
  }

  async function openEdit(id: string) {
    try {
      const ch = await adminApi.get(`/api/admin/challenges/${id}`);
      setEditId(id);
      setForm({
        title: ch.title || "",
        slug: ch.slug || "",
        description: ch.description || "",
        problem_statement_md: ch.problem_statement_md || "",
        difficulty: ch.difficulty || "medium",
        category: ch.category || "backend",
        tags: (ch.tags || []).join(", "),
        time_limit_minutes: String(ch.time_limit_minutes || 60),
      });
      setFormError("");
      setShowForm(true);
    } catch { /* ignore */ }
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const body = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        problem_statement_md: form.problem_statement_md,
        difficulty: form.difficulty,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        time_limit_minutes: parseInt(form.time_limit_minutes) || 60,
      };
      if (editId) {
        await adminApi.put(`/api/admin/challenges/${editId}`, body);
      } else {
        await adminApi.post("/api/admin/challenges", body);
      }
      setShowForm(false);
      fetchChallenges();
    } catch (err: any) {
      setFormError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Challenges</h1>
        <Button onClick={openCreate}>New Challenge</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{total} total challenges</p>
      <Divider className="mx-0 my-6" />

      {/* Create/Edit form */}
      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">{editId ? "Edit Challenge" : "New Challenge"}</h2>
          {formError && <p className="font-mono text-xs text-rust mb-3">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required />
          </div>
          <div className="mb-4">
            <Textarea label="Description (short)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="mb-4">
            <Textarea label="Problem Statement (Markdown)" value={form.problem_statement_md} onChange={(e) => setForm({ ...form, problem_statement_md: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-3 py-2 border border-border bg-transparent font-mono text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-border bg-transparent font-mono text-sm">
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
                <option value="fullstack">Fullstack</option>
                <option value="algorithms">Algorithms</option>
                <option value="system-design">System Design</option>
                <option value="data">Data</option>
                <option value="devops">DevOps</option>
              </select>
            </div>
            <Input label="Time Limit (min)" type="number" value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value })} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-6 max-w-md">
        <Input label="" placeholder="Search by title or slug..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : challenges.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No challenges found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-3">Title</span>
            <span className="col-span-1">Difficulty</span>
            <span className="col-span-1">Category</span>
            <span className="col-span-1 text-center">Published</span>
            <span className="col-span-1 text-center">Featured</span>
            <span className="col-span-1 text-right">Submissions</span>
            <span className="col-span-1 text-right">Avg Score</span>
            <span className="col-span-1 text-right">Created</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>
          {challenges.map((c) => (
            <div key={c.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <div className="col-span-3">
                <p className="font-display text-sm truncate">{c.title}</p>
                <p className="font-mono text-[10px] text-muted">{c.slug}</p>
              </div>
              <span className="col-span-1"><Badge variant={difficultyVariant[c.difficulty] || "info"}>{c.difficulty}</Badge></span>
              <span className="col-span-1 font-mono text-xs text-muted">{c.category}</span>
              <span className="col-span-1 text-center">
                <button onClick={() => togglePublish(c.id)} className={`w-8 h-5 rounded-full transition-colors ${c.is_public ? "bg-green-500" : "bg-border"} relative cursor-pointer`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${c.is_public ? "left-3.5" : "left-0.5"}`} />
                </button>
              </span>
              <span className="col-span-1 text-center">
                <button onClick={() => toggleFeature(c.id)} className={`w-8 h-5 rounded-full transition-colors ${c.is_featured ? "bg-amber-500" : "bg-border"} relative cursor-pointer`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${c.is_featured ? "left-3.5" : "left-0.5"}`} />
                </button>
              </span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{c.submission_count}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{c.avg_score?.toFixed(0) || "—"}</span>
              <span className="col-span-1 font-mono text-[10px] text-muted text-right">{formatDate(c.created_at)}</span>
              <span className="col-span-1 text-right flex justify-end gap-2">
                <button onClick={() => openEdit(c.id)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors cursor-pointer">Edit</button>
                <button onClick={() => setDeleteTarget(c)} className="font-mono text-[10px] text-muted hover:text-rust transition-colors cursor-pointer">Delete</button>
              </span>
            </div>
          ))}
        </div></div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Challenge"
        description={`Delete "${deleteTarget?.title}"? This will also delete all submissions for this challenge.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
