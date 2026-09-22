import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Join kodwai and solve real coding challenges with Claude Code, Cursor, or Codex. Get scored on how well you direct the agent.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
