"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitHubButton } from "@/components/ui/github-button";
import { api } from "@/lib/api";
import posthog from "posthog-js";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      const userType = data.user?.user_type;
      posthog.identify(data.user?.id ?? email, {
        email,
        user_type: userType,
      });
      posthog.capture("user_logged_in", { method: "email", user_type: userType });
      // Honor a relative ?next= target (e.g. the CLI authorization page) over the default home.
      const next = new URLSearchParams(window.location.search).get("next");
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push(userType === "developer" ? "/dev/challenges" : "/dashboard");
      }
    } catch (err) {
      posthog.captureException(err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Welcome back</h2>
      <p className="text-muted font-mono text-sm mb-8">
        Sign in to your account
      </p>

      {error && (
        <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
          {error}
        </div>
      )}

      <GitHubButton label="Sign in with GitHub" />

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="text-right -mt-2">
          <Link
            href="/forgot-password"
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center font-mono text-xs text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-rust hover:text-rust-hover transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
