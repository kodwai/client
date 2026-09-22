import type { Metadata } from "next";
import { DeveloperLayoutShell } from "./developer-shell";

// Every /dev/* route is behind login, so none of it should be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return <DeveloperLayoutShell>{children}</DeveloperLayoutShell>;
}
