"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

interface FeatureFlagsContextValue {
  isEnabled: (key: string) => boolean;
  loading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  isEnabled: () => false,
  loading: true,
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/feature-flags")
      .then((data: { key: string; active: boolean }[]) => {
        const map: Record<string, boolean> = {};
        (data || []).forEach((f) => { map[f.key] = f.active; });
        setActive(map);
      })
      .catch(() => setActive({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ isEnabled: (k) => active[k] ?? false, loading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
