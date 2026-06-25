"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface SessionEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export function useSessionEvents(sessionId: string | null, pollInterval = 5000) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.get(`/api/sessions/${sessionId}/events`);
      const fetched: SessionEvent[] = (data.events || data || []).map(
        (e: Record<string, unknown>) => ({
          type: (e.type as string) || "unknown",
          data: (e.data as Record<string, unknown>) || e,
          timestamp: (e.timestamp as string) || new Date().toISOString(),
        })
      );
      setEvents(fetched);
    } catch {
      // Silently ignore fetch errors
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    setLoading(true);
    fetchEvents().finally(() => setLoading(false));

    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchEvents, pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, pollInterval, fetchEvents]);

  return { events, loading };
}
