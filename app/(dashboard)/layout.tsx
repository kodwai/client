"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Divider } from "@/components/ui/divider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/sessions", label: "Sessions" },
  { href: "/settings", label: "Settings" },
];

function MobileHeader({ onToggle }: { onToggle: () => void }) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-white/50">
      <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 20, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
      <button
        onClick={onToggle}
        className="p-2 text-ink/70 hover:text-ink transition-colors"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
    </header>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <aside className="hidden md:flex w-64 border-r border-border bg-white/50 items-center justify-center">
        <p className="font-mono text-xs text-muted uppercase tracking-widest">Loading...</p>
      </aside>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-cream flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:sticky md:top-0 md:translate-x-0 md:h-screen md:bg-white/50
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="inline-block">
              <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
              <div className="h-px bg-rust mt-2 w-full" />
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1 text-ink/70 hover:text-ink transition-colors"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`block px-4 py-2.5 font-mono text-sm uppercase tracking-wide transition-colors ${
                  isActive
                    ? "text-rust border-l-2 border-rust"
                    : "text-ink/70 hover:text-ink border-l-2 border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border">
          {user && (
            <div className="mb-3">
              <p className="font-display text-sm">{user.name}</p>
              <p className="font-mono text-xs text-muted truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Guard: redirect developer users to their dashboard
  useEffect(() => {
    if (!loading && user && (user as any).user_type === "developer") {
      router.push("/dev/challenges");
    }
  }, [loading, user, router]);

  if (!loading && user && (user as any).user_type === "developer") {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader onToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
