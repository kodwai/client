"use client";

import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { useAuth } from "@/lib/auth";

const stats = [
  { label: "Total Projects", value: "0" },
  { label: "Active Sessions", value: "0" },
  { label: "Completed Sessions", value: "0" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl mb-2">
        Welcome{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="text-muted font-mono text-sm mb-2">
        Your AI interview platform overview
      </p>
      <Divider className="mx-0 my-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} accent>
            <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
              {stat.label}
            </p>
            <p className="font-display text-4xl">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
