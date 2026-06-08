"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/challenges", label: "Challenges" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/badges", label: "Badges" },
  { href: "/admin/feature-flags", label: "Feature Flags" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/blog", label: "Blog Posts" },
  { href: "/admin/blog/categories", label: "Blog Categories" },
  { href: "/admin/blog/tags", label: "Blog Tags" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/system", label: "System" },
];

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { admin, logout, loading } = useAdminAuth();

  if (loading) {
    return (
      <aside className="hidden md:flex w-56 border-r border-border bg-ink/[0.02] items-center justify-center">
        <p className="font-mono text-xs text-muted uppercase tracking-widest">Loading...</p>
      </aside>
    );
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onClose} />}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 border-r border-border bg-cream flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:sticky md:top-0 md:translate-x-0 md:h-screen md:bg-ink/[0.02]
      `}>
        <div className="p-5 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 20, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rust mt-1">Admin Panel</p>
            <div className="h-px bg-rust mt-3 w-10" />
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-ink/70 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`block px-3 py-2 font-mono text-xs uppercase tracking-wide transition-colors ${
                  isActive
                    ? "text-rust border-l-2 border-rust bg-rust/5"
                    : "text-ink/60 hover:text-ink border-l-2 border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-border">
          {admin && (
            <div className="mb-2">
              <p className="font-display text-xs">{admin.name}</p>
              <p className="font-mono text-[10px] text-muted truncate">{admin.email}</p>
            </div>
          )}
          <button onClick={logout} className="font-mono text-[10px] uppercase tracking-widest text-muted hover:text-rust transition-colors">
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-white/50">
          <div>
            <span style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 18, color: "#353431" }}>kodwai</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-rust ml-2">admin</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-ink/70 hover:text-ink">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page doesn't need auth provider
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
