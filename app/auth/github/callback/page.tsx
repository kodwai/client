"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, isExpectedClientError } from "@/lib/api";
import { parseUTC } from "@/lib/date";
import posthog from "posthog-js";

interface GitHubCallbackResponse {
  access_token: string;
  is_new_user?: boolean;
  user?: { id?: string; email?: string; user_type?: string; created_at?: string };
}

// True when this callback created the account. Prefers the API's explicit flag;
// otherwise falls back to created_at, which is seconds old for an account made in
// this very request (the window absorbs client clock skew).
function isNewAccount(data: GitHubCallbackResponse): boolean {
  if (typeof data.is_new_user === "boolean") return data.is_new_user;
  const created = parseUTC(data.user?.created_at);
  return !!created && Math.abs(Date.now() - created.getTime()) < 10 * 60 * 1000;
}

// Fires signup_completed at most once per account on this browser. An email
// signup on this browser already reported it, so linking GitHub to that fresh
// account (same email, inside the created_at window) does not report it again.
function claimSignupEvent(userId: string | undefined, email: string | undefined): boolean {
  if (!userId) return true;
  const key = `kodwai_signup_completed:${userId}`;
  try {
    if (email && localStorage.getItem(`kodwai_signup_completed_email:${email.toLowerCase()}`)) return false;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
  } catch {
    // Storage unavailable: still report once for this page view.
  }
  return true;
}

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code received from GitHub.");
      return;
    }

    api
      .post("/api/auth/github/callback", { code })
      .then((data: GitHubCallbackResponse) => {
        localStorage.setItem("token", data.access_token);
        const userType = data.user?.user_type;
        const isNew = isNewAccount(data);
        posthog.identify(data.user?.id ?? data.user?.email, {
          email: data.user?.email,
          user_type: userType,
        });
        posthog.capture("github_auth_completed", { user_type: userType, is_new_user: isNew });
        if (isNew && claimSignupEvent(data.user?.id, data.user?.email)) {
          posthog.capture("signup_completed", { method: "github", user_type: userType });
        }
        router.push(userType === "developer" ? "/dev/challenges" : "/dashboard");
      })
      .catch((err) => {
        // Reused codes, banned accounts and missing verified emails are 4xx answers.
        if (!isExpectedClientError(err)) posthog.captureException(err);
        setError(err.message || "GitHub login failed");
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="w-full max-w-[480px] text-center">
        <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
        <div className="mt-8 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
          {error}
        </div>
        <a href="/login" className="mt-4 inline-block font-mono text-xs text-muted hover:text-ink transition-colors">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-mono text-sm text-muted uppercase tracking-widest">Signing in with GitHub...</p>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      }>
        <GitHubCallbackContent />
      </Suspense>
    </div>
  );
}
