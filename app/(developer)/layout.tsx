"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { FeatureFlagsProvider } from "@/lib/feature-flags";
import { Divider } from "@/components/ui/divider";
import { PlatformFeedbackModal } from "@/components/feedback/platform-feedback-modal";
import { ClaudeKeyGate } from "@/components/claude-key-gate";

const navLinks = [
  { href: "/dev/challenges", label: "Challenges" },
  { href: "/dev/quests", label: "Quests" },
  { href: "/dev/submissions", label: "Submissions" },
  { href: "/dev/leaderboard", label: "Leaderboard" },
  { href: "/dev/events", label: "Events" },
  { href: "/dev/badges", label: "Badges" },
  { href: "/dev/profile", label: "Profile" },
  { href: "/dev/settings", label: "Settings" },
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

function Sidebar({ open, onClose, onFeedback }: { open: boolean; onClose: () => void; onFeedback: () => void }) {
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
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mt-3">Developer Platform</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
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
            <div className="mb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-border flex-shrink-0">
                <img
                  src={`/avatars/avatar-${((user.username || user.email).split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 8) + 1}.png`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm truncate">{user.name}</p>
                <p className="font-mono text-xs text-muted truncate">@{user.username || user.email}</p>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={onFeedback}
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
            >
              Send Feedback
            </button>
            <button
              onClick={logout}
              className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function DeveloperShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // First-time developers see the welcome intro once (server-tracked).
  const needsWelcome =
    !!user && user.user_type === "developer" && user.can_submit && !user.welcomed && pathname !== "/dev/welcome";

  useEffect(() => {
    if (loading || !user) return;
    if (user.user_type === "company") {
      router.push("/dashboard");
      return;
    }
    if (needsWelcome) {
      router.replace("/dev/welcome");
    }
  }, [loading, user, router, needsWelcome]);

  if (!loading && user && user.user_type === "company") {
    return null;
  }

  // Developers who have spent their free submissions and have no own key are
  // blocked behind a non-dismissable gate until they connect a key.
  if (!loading && user && user.user_type === "developer" && !user.can_submit) {
    return <ClaudeKeyGate />;
  }

  // While redirecting a first-time developer to the welcome intro, render nothing.
  if (!loading && needsWelcome) {
    return null;
  }

  // The welcome intro renders full-bleed, without the sidebar chrome.
  if (!loading && user && user.user_type === "developer" && pathname === "/dev/welcome") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onFeedback={() => setFeedbackOpen(true)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader onToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
      <PlatformFeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <DeveloperShell>{children}</DeveloperShell>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}
