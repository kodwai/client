import Link from "next/link";
import { Divider } from "@/components/ui/divider";
import { LANDING_URL } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px] text-center">
        <p style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</p>
        <Divider className="mt-4 mb-12" />

        <p className="font-mono text-xs uppercase tracking-widest text-rust mb-3">404</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-3">Page not found</h1>
        <p className="font-mono text-sm text-muted mb-10">
          This link is broken, or the page has moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-rust text-cream hover:bg-rust-hover font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Open the app
          </Link>
          <a
            href={LANDING_URL}
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-rust transition-colors"
          >
            Visit kodwai.com
          </a>
        </div>
      </div>
    </div>
  );
}
