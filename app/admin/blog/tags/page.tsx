"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface BlogTag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
}

const emptyForm = { name: "", slug: "" };

export default function AdminBlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogTag | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchTags() {
    setLoading(true);
    adminApi.get("/api/admin/blog/tags")
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchTags(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(tag: BlogTag) {
    setEditId(tag.id);
    setForm({ name: tag.name, slug: tag.slug });
    setFormError("");
    setShowForm(true);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const body = { name: form.name, slug: form.slug };
      if (editId) {
        await adminApi.put(`/api/admin/blog/tags/${editId}`, body);
      } else {
        await adminApi.post("/api/admin/blog/tags", body);
      }
      setShowForm(false);
      fetchTags();
    } catch (err: any) {
      setFormError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(`/api/admin/blog/tags/${deleteTarget.id}`);
      setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Blog Tags</h1>
        <Button onClick={openCreate}>New Tag</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{tags.length} tags</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">{editId ? "Edit Tag" : "New Tag"}</h2>
          {formError && <p className="font-mono text-xs text-rust mb-3">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({ ...prev, name, ...(!editId ? { slug: autoSlug(name) } : {}) }));
              }}
              required
            />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} required />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : tags.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No tags yet</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-4">Name</span>
            <span className="col-span-4">Slug</span>
            <span className="col-span-1 text-right">Posts</span>
            <span className="col-span-3 text-right">Actions</span>
          </div>
          {tags.map((tag) => (
            <div key={tag.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <span className="col-span-4 font-display text-sm">{tag.name}</span>
              <span className="col-span-4 font-mono text-xs text-muted">{tag.slug}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{tag.post_count}</span>
              <span className="col-span-3 text-right flex justify-end gap-2">
                <button onClick={() => openEdit(tag)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors cursor-pointer">Edit</button>
                <button onClick={() => setDeleteTarget(tag)} className="font-mono text-[10px] text-muted hover:text-rust transition-colors cursor-pointer">Delete</button>
              </span>
            </div>
          ))}
        </div></div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Tag"
        description={`Delete "${deleteTarget?.name}"? It will be removed from all posts.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
