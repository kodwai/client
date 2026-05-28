"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Divider } from "@/components/ui/divider";

function OnboardingShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.user_type === "company") {
      router.replace("/dashboard");
      return;
    }
    if (user.has_claude_api_key) {
      router.replace("/dev/challenges");
    }
  }, [loading, user, router]);

  if (loading || !user || user.user_type === "company" || user.has_claude_api_key) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
          <Divider className="mt-4" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OnboardingShell>{children}</OnboardingShell>
    </AuthProvider>
  );
}
