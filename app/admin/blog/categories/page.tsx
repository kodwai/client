"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  post_count: number;
  created_at: string;
}

const emptyForm = { name: "", slug: "", description: "", sort_order: "0" };

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchCategories() {
    setLoading(true);
    adminApi.get("/api/admin/blog/categories")
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(cat: BlogCategory) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || "", sort_order: String(cat.sort_order) });
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
      const body = { name: form.name, slug: form.slug, description: form.description, sort_order: parseInt(form.sort_order) || 0 };
      if (editId) {
        await adminApi.put(`/api/admin/blog/categories/${editId}`, body);
      } else {
        await adminApi.post("/api/admin/blog/categories", body);
      }
      setShowForm(false);
      fetchCategories();
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
      await adminApi.delete(`/api/admin/blog/categories/${deleteTarget.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Blog Categories</h1>
        <Button onClick={openCreate}>New Category</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{categories.length} categories</p>
      <Divider className="mx-0 my-6" />

      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">{editId ? "Edit Category" : "New Category"}</h2>
          {formError && <p className="font-mono text-xs text-rust mb-3">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
            <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
          <div className="mb-4">
            <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : categories.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No categories yet</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-3">Name</span>
            <span className="col-span-3">Slug</span>
            <span className="col-span-2">Description</span>
            <span className="col-span-1 text-right">Posts</span>
            <span className="col-span-1 text-right">Order</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <span className="col-span-3 font-display text-sm">{cat.name}</span>
              <span className="col-span-3 font-mono text-xs text-muted">{cat.slug}</span>
              <span className="col-span-2 font-mono text-xs text-muted truncate">{cat.description || "—"}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{cat.post_count}</span>
              <span className="col-span-1 font-mono text-xs text-muted text-right">{cat.sort_order}</span>
              <span className="col-span-2 text-right flex justify-end gap-2">
                <button onClick={() => openEdit(cat)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors cursor-pointer">Edit</button>
                <button onClick={() => setDeleteTarget(cat)} className="font-mono text-[10px] text-muted hover:text-rust transition-colors cursor-pointer">Delete</button>
              </span>
            </div>
          ))}
        </div></div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Posts in this category will become uncategorized.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
