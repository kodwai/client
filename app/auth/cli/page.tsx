"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const KODWAI_WORDMARK = {
  fontFamily: "var(--font-logo), Georgia, serif",
  fontWeight: 550,
  fontSize: 24,
  letterSpacing: "0.75px",
  color: "#353431",
} as const;

interface MeUser {
  id: string;
  name: string;
  email: string;
  username?: string;
}

/** Only allow loopback redirect targets (the local CLI server). */
function isLoopbackRedirect(uri: string): boolean {
  try {
    const u = new URL(uri);
    return (
      u.protocol === "http:" &&
      (u.hostname === "127.0.0.1" || u.hostname === "localhost") &&
      u.pathname === "/callback"
    );
  } catch {
    return false;
  }
}

type Phase = "checking" | "ready" | "authorizing" | "redirecting" | "error";

function CliAuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectUri = params.get("redirect_uri") || "";
  const state = params.get("state") || "";

  const [phase, setPhase] = useState<Phase>("checking");
  const [user, setUser] = useState<MeUser | null>(null);
  const [error, setError] = useState("");

  // The page we should return to after a login (so the CLI flow resumes).
  const selfHref =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/auth/cli";

  useEffect(() => {
    if (!redirectUri || !state) {
      setError("This sign-in link is missing required parameters. Run `kodwai login` again.");
      setPhase("error");
      return;
    }
    if (!isLoopbackRedirect(redirectUri)) {
      setError("Invalid redirect target. For your security, CLI sign-in only works with the local Kodwai CLI.");
      setPhase("error");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(selfHref)}`);
      return;
    }
    api
      .get("/api/auth/me")
      .then((me) => {
        setUser(me);
        setPhase("ready");
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace(`/login?next=${encodeURIComponent(selfHref)}`);
      });
  }, [redirectUri, state, router, selfHref]);

  const authorize = useCallback(async () => {
    setPhase("authorizing");
    setError("");
    try {
      const { code } = await api.post("/api/auth/cli/authorize", {});
      setPhase("redirecting");
      const sep = redirectUri.includes("?") ? "&" : "?";
      window.location.href = `${redirectUri}${sep}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authorization failed. Please try again.");
      setPhase("ready");
    }
  }, [redirectUri, state]);

  const useDifferentAccount = useCallback(() => {
    localStorage.removeItem("token");
    router.replace(`/login?next=${encodeURIComponent(selfHref)}`);
  }, [router, selfHref]);

  if (phase === "checking") {
    return <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>;
  }

  if (phase === "error") {
    return (
      <div className="w-full max-w-[440px] text-center">
        <h1 style={KODWAI_WORDMARK}>kodwai</h1>
        <div className="mt-8 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">{error}</div>
      </div>
    );
  }

  if (phase === "redirecting") {
    return (
      <div className="text-center">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Returning to your terminal...</p>
        <p className="mt-3 font-mono text-xs text-muted">You can close this tab and head back to the CLI.</p>
      </div>
    );
  }

  return (
    <Card accent className="w-full max-w-[440px]">
      <h1 style={KODWAI_WORDMARK} className="mb-1">kodwai</h1>
      <h2 className="font-display text-2xl mb-2">Authorize the Kodwai CLI</h2>
      <p className="font-mono text-xs text-muted mb-6">
        The Kodwai command-line tool on this device is requesting access to your account. Approve only if
        you just ran <span className="text-ink">kodwai login</span> in your terminal.
      </p>

      <div className="border border-border bg-cream/40 px-4 py-3 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Signed in as</p>
        <p className="font-mono text-sm text-ink">{user?.name}</p>
        <p className="font-mono text-xs text-muted">{user?.email}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-rust/20 bg-rust/5 font-mono text-xs text-rust">{error}</div>
      )}

      <Button onClick={authorize} disabled={phase === "authorizing"} className="w-full">
        {phase === "authorizing" ? "Authorizing..." : "Authorize CLI"}
      </Button>
      <button
        onClick={useDifferentAccount}
        disabled={phase === "authorizing"}
        className="mt-4 w-full font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors disabled:opacity-50"
      >
        Not you? Use a different account
      </button>
    </Card>
  );
}

export default function CliAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense
        fallback={<p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>}
      >
        <CliAuthContent />
      </Suspense>
    </div>
  );
}
