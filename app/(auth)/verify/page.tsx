"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Divider } from "@/components/ui/divider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "verifying" | "verified" | "error">(
    token ? "verifying" : "pending"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        await api.get(`/api/auth/verify-email?token=${token}`);
        setStatus("verified");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    }

    verify();
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="text-center">
        <h2 className="font-display text-3xl mb-4">Verifying your email...</h2>
        <p className="text-muted font-mono text-sm">Please wait a moment.</p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="text-center">
        <h2 className="font-display text-3xl mb-4">Email verified</h2>
        <Divider className="my-6" />
        <p className="text-muted font-mono text-sm mb-8">
          Your account has been verified successfully.
        </p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <h2 className="font-display text-3xl mb-4">Verification failed</h2>
        <Divider className="my-6" />
        <p className="text-rust font-mono text-sm mb-8">{error}</p>
        <Link href="/login">
          <Button variant="secondary">Back to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="font-display text-3xl mb-4">Check your email</h2>
      <Divider className="my-6" />
      <p className="text-muted font-mono text-sm mb-2">
        We&apos;ve sent a verification link to your email address.
      </p>
      <p className="text-muted font-mono text-sm mb-8">
        Click the link in the email to activate your account.
      </p>
      <Link href="/login">
        <Button variant="secondary">Back to login</Button>
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center">
          <p className="text-muted font-mono text-sm">Loading...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
