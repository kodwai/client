import { Divider } from "@/components/ui/divider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: "var(--font-logo), Georgia, serif", fontWeight: 550, fontSize: 24, letterSpacing: "0.75px", color: "#353431" }}>kodwai</h1>
          <Divider className="mt-4" />
        </div>
        {children}
      </div>
    </div>
  );
}
