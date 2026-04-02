"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type UserType = "developer" | "company" | null;

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = {
        name,
        email,
        password,
        user_type: userType!,
      };
      if (userType === "company") {
        body.organization_name = company;
      } else {
        body.username = username;
      }
      await api.post("/api/auth/signup", body);
      router.push("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Choose user type
  if (!userType) {
    return (
      <div>
        <h2 className="font-display text-3xl mb-2">Join kodwai</h2>
        <p className="text-muted font-mono text-sm mb-8">
          How will you use kodwai?
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setUserType("developer")}
            className="w-full text-left p-6 border border-border hover:border-rust/50 transition-colors group"
          >
            <p className="font-display text-xl mb-1 group-hover:text-rust transition-colors">
              I&apos;m a Developer
            </p>
            <p className="font-mono text-xs text-muted">
              Solve AI-agent coding challenges, compete on leaderboards, build your profile
            </p>
          </button>

          <button
            onClick={() => setUserType("company")}
            className="w-full text-left p-6 border border-border hover:border-rust/50 transition-colors group"
          >
            <p className="font-display text-xl mb-1 group-hover:text-rust transition-colors">
              I&apos;m Hiring
            </p>
            <p className="font-mono text-xs text-muted">
              Run AI-native technical interviews with full session capture and scoring
            </p>
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

  // Step 2: Registration form
  return (
    <div>
      <button
        onClick={() => setUserType(null)}
        className="font-mono text-xs text-muted hover:text-ink transition-colors mb-6 inline-block"
      >
        &larr; Back
      </button>

      <h2 className="font-display text-3xl mb-2">Create your account</h2>
      <p className="text-muted font-mono text-sm mb-8">
        {userType === "developer"
          ? "Start solving AI-agent coding challenges"
          : "Start running AI-powered interviews"}
      </p>

      {error && (
        <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {userType === "developer" && (
          <Input
            label="Username"
            type="text"
            placeholder="janesmith"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            required
            minLength={3}
          />
        )}

        <Input
          label="Email"
          type="email"
          placeholder={userType === "developer" ? "you@email.com" : "you@company.com"}
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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center font-mono text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-rust hover:text-rust-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
