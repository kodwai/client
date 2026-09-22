"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitHubButton } from "@/components/ui/github-button";
import { api, isExpectedClientError } from "@/lib/api";
import posthog from "posthog-js";

type UserType = "developer" | "company" | null;

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [productNews, setProductNews] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string | boolean> = {
        name,
        email,
        password,
        user_type: userType!,
        marketing_consent: productNews,
      };
      if (userType === "company") {
        body.organization_name = company;
      }
      const data = await api.post("/api/auth/signup", body);
      posthog.identify(data?.user?.id ?? email, {
        email,
        name,
        user_type: userType!,
      });
      posthog.capture("user_signed_up", {
        method: "email",
        user_type: userType,
      });
      posthog.capture("signup_completed", { method: "email", user_type: userType });
      // Lets /verify offer "Resend verification email" without asking again.
      try {
        sessionStorage.setItem("kodwai_verify_email", email);
        // Stops the GitHub callback from counting this account as a second signup.
        localStorage.setItem(`kodwai_signup_completed_email:${email.trim().toLowerCase()}`, "1");
      } catch {
        // Storage can be unavailable (private mode); /verify then asks for the email.
      }
      router.push("/verify");
    } catch (err) {
      // "Email already registered" and validation errors are expected answers.
      if (!isExpectedClientError(err)) posthog.captureException(err);
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  if (userType === null) {
    return (
      <div>
        <h2 className="font-display text-3xl mb-2">Join kodwai</h2>
        <p className="text-muted font-mono text-sm mb-8">
          How will you use the platform?
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setUserType("developer"); posthog.capture("signup_user_type_selected", { user_type: "developer" }); }}
            className="w-full text-left bg-white/50 border border-border hover:border-l-2 hover:border-l-rust p-5 transition-colors group"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-rust">▸</span>
              <div>
                <div className="font-mono text-sm uppercase tracking-widest text-ink group-hover:text-rust transition-colors">
                  I&apos;m a Developer
                </div>
                <div className="font-mono text-xs text-muted mt-1">
                  Solve AI-agent coding challenges
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setUserType("company"); posthog.capture("signup_user_type_selected", { user_type: "company" }); }}
            className="w-full text-left bg-white/50 border border-border hover:border-l-2 hover:border-l-rust p-5 transition-colors group"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-rust">▸</span>
              <div>
                <div className="font-mono text-sm uppercase tracking-widest text-ink group-hover:text-rust transition-colors">
                  I&apos;m Hiring
                </div>
                <div className="font-mono text-xs text-muted mt-1">
                  Run AI-agent interview sessions
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-8 text-center font-mono text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-rust hover:text-rust-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const headline = userType === "developer" ? "Join kodwai" : "Set up your team";
  const subline =
    userType === "developer"
      ? "Start solving AI-agent coding challenges"
      : "Create an org and start running interview sessions";

  return (
    <div>
      <button
        type="button"
        onClick={() => setUserType(null)}
        className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors mb-6"
      >
        ← Back
      </button>

      <h2 className="font-display text-3xl mb-2">{headline}</h2>
      <p className="text-muted font-mono text-sm mb-8">{subline}</p>

      {error && (
        <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
          {error}
        </div>
      )}

      <GitHubButton label="Sign up with GitHub" />

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          placeholder="Choose a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {userType === "company" && (
          <Input
            label="Company name"
            type="text"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={productNews}
            onChange={(e) => setProductNews(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-rust cursor-pointer"
          />
          <span className="font-mono text-xs text-muted leading-relaxed">
            Also send me occasional product news.
          </span>
        </label>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      {userType === "developer" && (
        <p className="mt-6 font-mono text-xs text-muted leading-relaxed">
          We&apos;ll send a few onboarding emails to help you get your first score. Unsubscribe anytime.
        </p>
      )}

      <p className="mt-8 text-center font-mono text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-rust hover:text-rust-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
