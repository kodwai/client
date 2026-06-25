"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

interface Quest {
  key: string;
  scope: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward_xp: number;
  completed: boolean;
  claimed: boolean;
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/quests")
      .then((data) => setQuests(Array.isArray(data) ? data : []))
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, []);

  async function claimQuest(key: string) {
    try {
      await api.post("/api/quests/" + key + "/claim", {});
      const data = await api.get("/api/quests");
      setQuests(data);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Quests</h1>
      <p className="text-muted font-mono text-sm mb-2">
        Daily and weekly objectives — claim XP.
      </p>
      <Divider className="mx-0 my-8" />

      {loading ? (
        <p className="font-mono text-sm text-muted text-center py-12">Loading...</p>
      ) : quests.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No quests right now</p>
          <p className="font-mono text-sm text-muted">Check back soon for new objectives.</p>
        </Card>
      ) : (
        <Card>
          {(["daily", "weekly"] as const).map((scope) => {
            const scoped = quests.filter((q) => q.scope === scope);
            if (scoped.length === 0) return null;
            return (
              <div key={scope} className="mb-6 last:mb-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
                  {scope}
                </p>
                <div className="space-y-3">
                  {scoped.map((q) => {
                    const pct = q.target > 0 ? Math.min(100, (q.current / q.target) * 100) : 0;
                    return (
                      <div
                        key={q.key}
                        className="flex items-center gap-4 py-2 border-b border-border last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm">{q.title}</p>
                          <p className="font-mono text-xs text-muted mb-2">{q.description}</p>
                          <div className="h-1.5 bg-cream-dark/30 border border-border overflow-hidden">
                            <div className="h-full bg-rust" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="font-mono text-[10px] text-rust mt-1">+{q.reward_xp} XP</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {q.completed && !q.claimed ? (
                            <Button onClick={() => claimQuest(q.key)}>Claim</Button>
                          ) : q.claimed ? (
                            <span className="font-mono text-xs text-green-600">Claimed ✓</span>
                          ) : (
                            <span className="font-mono text-xs text-muted">
                              {q.current}/{q.target}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
