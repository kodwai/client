"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { adminApi } from "@/lib/admin-api";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  category: BlogCategory | null;
  tags: BlogTag[];
  status: string;
  published_at: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content_md: "",
  cover_image_url: "",
  author_name: "Kodwai Team",
  category_id: "",
  tag_ids: [] as string[],
  seo_title: "",
  seo_description: "",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // For dropdowns
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);

  // Image upload
  const [uploading, setUploading] = useState(false);

  function fetchPosts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    adminApi.get(`/api/admin/blog/posts?${params}`)
      .then((data) => {
        setPosts(data?.posts || []);
        setTotal(data?.total || 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }

  function fetchMeta() {
    adminApi.get("/api/admin/blog/categories").then(setCategories).catch(() => {});
    adminApi.get("/api/admin/blog/tags").then(setTags).catch(() => {});
  }

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 200);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  async function togglePublish(id: string) {
    try {
      const result = await adminApi.patch(`/api/admin/blog/posts/${id}/publish`);
      setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: result.status } : p));
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(`/api/admin/blog/posts/${deleteTarget.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setShowPreview(false);
    setShowForm(true);
  }

  async function openEdit(id: string) {
    try {
      const post = await adminApi.get(`/api/admin/blog/posts/${id}`);
      setEditId(id);
      setForm({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content_md: post.content_md || "",
        cover_image_url: post.cover_image_url || "",
        author_name: post.author_name || "Kodwai Team",
        category_id: post.category?.id || "",
        tag_ids: (post.tags || []).map((t: BlogTag) => t.id),
        seo_title: post.seo_title || "",
        seo_description: post.seo_description || "",
      });
      setFormError("");
      setShowPreview(false);
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
        excerpt: form.excerpt,
        content_md: form.content_md,
        cover_image_url: form.cover_image_url || null,
        author_name: form.author_name,
        category_id: form.category_id || null,
        tag_ids: form.tag_ids,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      };
      if (editId) {
        await adminApi.put(`/api/admin/blog/posts/${editId}`, body);
      } else {
        await adminApi.post("/api/admin/blog/posts", body);
      }
      setShowForm(false);
      fetchPosts();
    } catch (err: any) {
      setFormError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const token = localStorage.getItem("kodwai_admin_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/api/admin/blog/images`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail);
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, cover_image_url: data.url }));
    } catch (err: any) {
      setFormError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function toggleTagId(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl">Blog Posts</h1>
        <Button onClick={openCreate}>New Post</Button>
      </div>
      <p className="text-muted font-mono text-sm mb-2">{total} total posts</p>
      <Divider className="mx-0 my-6" />

      {/* Create/Edit form */}
      {showForm && (
        <Card accent className="mb-6">
          <h2 className="font-display text-lg mb-4">{editId ? "Edit Post" : "New Post"}</h2>
          {formError && <p className="font-mono text-xs text-rust mb-3">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  ...(!editId ? { slug: autoSlug(title) } : {}),
                }));
              }}
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
              required
            />
          </div>

          <div className="mb-4">
            <Textarea label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted">Content (Markdown)</label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink transition-colors cursor-pointer"
              >
                {showPreview ? "Edit" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div className="border border-border p-4 min-h-[300px] prose prose-sm max-w-none font-mono text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content_md || "*No content yet*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={form.content_md}
                onChange={(e) => setForm({ ...form, content_md: e.target.value })}
                className="w-full border-b-2 border-border bg-transparent py-2 font-mono text-sm text-ink outline-none transition-colors focus:border-rust min-h-[300px] resize-y"
                placeholder="Write your blog post in Markdown..."
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              options={[
                { value: "", label: "No category" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input label="Author Name" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Cover Image</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="font-mono text-xs"
              />
              {uploading && <p className="font-mono text-[10px] text-muted mt-1">Uploading...</p>}
              {form.cover_image_url && (
                <div className="mt-2">
                  <img src={form.cover_image_url} alt="Cover" className="h-20 rounded border border-border object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagId(tag.id)}
                  className={`px-3 py-1 border font-mono text-xs transition-colors cursor-pointer ${
                    form.tag_ids.includes(tag.id)
                      ? "border-rust text-rust bg-rust/5"
                      : "border-border text-muted hover:text-ink"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <p className="font-mono text-[10px] text-muted">No tags yet. Create tags first.</p>}
            </div>
          </div>

          {/* SEO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input label="SEO Title (optional)" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            <Input label="SEO Description (optional)" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Create"}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="max-w-md flex-1">
          <Input label="" placeholder="Search by title or slug..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          label=""
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12"><p className="font-mono text-sm text-muted">No posts found</p></Card>
      ) : (
        <div className="admin-table-scroll"><div className="border border-border">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 border-b border-border bg-white/30 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="col-span-3">Title</span>
            <span className="col-span-2">Category</span>
            <span className="col-span-1 text-center">Status</span>
            <span className="col-span-1 text-center">Published</span>
            <span className="col-span-2">Author</span>
            <span className="col-span-1 text-right">Created</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {posts.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <div className="col-span-3">
                <p className="font-display text-sm truncate">{p.title}</p>
                <p className="font-mono text-[10px] text-muted">{p.slug}</p>
              </div>
              <span className="col-span-2 font-mono text-xs text-muted">{p.category?.name || "—"}</span>
              <span className="col-span-1 text-center">
                <Badge variant={p.status === "published" ? "success" : "info"}>{p.status}</Badge>
              </span>
              <span className="col-span-1 text-center">
                <button
                  onClick={() => togglePublish(p.id)}
                  className={`w-8 h-5 rounded-full transition-colors ${p.status === "published" ? "bg-green-500" : "bg-border"} relative cursor-pointer`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${p.status === "published" ? "left-3.5" : "left-0.5"}`} />
                </button>
              </span>
              <span className="col-span-2 font-mono text-xs text-muted truncate">{p.author_name}</span>
              <span className="col-span-1 font-mono text-[10px] text-muted text-right">{formatDate(p.created_at)}</span>
              <span className="col-span-2 text-right flex justify-end gap-2">
                <button onClick={() => openEdit(p.id)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors cursor-pointer">Edit</button>
                <button onClick={() => setDeleteTarget(p)} className="font-mono text-[10px] text-muted hover:text-rust transition-colors cursor-pointer">Delete</button>
              </span>
            </div>
          ))}
        </div></div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Post"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
