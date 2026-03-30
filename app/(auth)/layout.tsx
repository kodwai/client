import { Divider } from "@/components/ui/divider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-12">
          <h1 className="font-display text-2xl tracking-wide">Kodwai</h1>
          <Divider className="mt-4" />
        </div>
        {children}
      </div>
    </div>
  );
}
