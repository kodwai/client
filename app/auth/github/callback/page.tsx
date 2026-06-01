"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import posthog from "posthog-js";

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
      .then((data) => {
        localStorage.setItem("token", data.access_token);
        const userType = data.user?.user_type;
        posthog.identify(data.user?.id ?? data.user?.email, {
          email: data.user?.email,
          user_type: userType,
        });
        posthog.capture("github_auth_completed", { user_type: userType });
        router.push(userType === "developer" ? "/dev/challenges" : "/dashboard");
      })
      .catch((err) => {
        posthog.captureException(err);
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
