"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Divider } from "@/components/ui/divider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/sessions", label: "Sessions" },
  { href: "/settings", label: "Settings" },
];

function Sidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <aside className="w-64 border-r border-border bg-white/50 flex items-center justify-center">
        <p className="font-mono text-xs text-muted uppercase tracking-widest">Loading...</p>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-white/50 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="font-display text-xl tracking-wide">Kodwai</h1>
        <Divider className="mt-3 mx-0" />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
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
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
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
