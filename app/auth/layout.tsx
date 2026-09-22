import type { Metadata } from "next";

// OAuth callback and CLI authorization screens: utility pages, never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthUtilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
