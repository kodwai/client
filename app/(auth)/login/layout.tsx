import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to kodwai to solve AI-agent coding challenges and track your scores.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
