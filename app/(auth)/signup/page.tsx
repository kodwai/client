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
  // Developer-only pivot: skip user type selection, default to developer
  const [userType] = useState<UserType>("developer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company] = useState("");
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

  // User type selection — hidden (developer-only pivot)
  // Previously showed "I'm a Developer" / "I'm Hiring" buttons.
  // Company signup can be re-enabled by restoring the userType selection step.

  // Registration form (developer only)
  return (
    <div>
      <h2 className="font-display text-3xl mb-2">Join kodwai</h2>
      <p className="text-muted font-mono text-sm mb-8">
        Start solving AI-agent coding challenges
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

        <Input
          label="Username"
          type="text"
          placeholder="janesmith"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
          required
          minLength={3}
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

        {/* Company name field — hidden (developer-only pivot) */}
        {/* {userType === "company" && (
          <Input
            label="Company name"
            type="text"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        )} */}

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
