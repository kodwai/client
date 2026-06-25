"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { adminApi } from "@/lib/admin-api";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
      const data = await adminApi.post("/api/admin/login", { email, password });
      localStorage.setItem("kodwai_admin_token", data.access_token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust mt-2">Admin</p>
          <Divider className="mt-4" />
        </div>

        <h2 className="font-display text-2xl mb-2">Admin Login</h2>
        <p className="text-muted font-mono text-sm mb-8">Sign in with your admin account</p>

        {error && (
          <div className="mb-6 p-4 border border-rust/20 bg-rust/5 font-mono text-sm text-rust">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign in to Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
