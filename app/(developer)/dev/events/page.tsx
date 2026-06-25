"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { formatDateTime } from "@/lib/date";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "ended";
  is_finalized: boolean;
}

const statusVariant: Record<Event["status"], "success" | "info" | "default"> = {
  active: "success",
  upcoming: "info",
  ended: "default",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await api.get("/api/events");
        setEvents(data || []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="font-display text-3xl">Events</h1>
        {!loading && (
          <span className="font-mono text-xs text-muted">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <p className="text-muted font-mono text-sm mb-2">
        Compete in timed coding events and claim your spot on the board
      </p>
      <Divider className="mx-0 my-8" />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-sm text-muted uppercase tracking-widest">Loading...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-display text-xl mb-2">No events yet</p>
          <p className="font-mono text-sm text-muted">
            Check back soon — events will be announced here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link key={event.id} href={`/dev/events/${event.slug}`}>
              <Card className="h-full hover:border-rust/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={statusVariant[event.status]}>
                    {event.status}
                  </Badge>
                  {event.is_finalized && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-rust">
                      Finalized
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg mb-2 group-hover:text-rust transition-colors">
                  {event.title}
                </h3>
                <p className="font-mono text-xs text-muted line-clamp-2 mb-4">
                  {event.description}
                </p>
                <div className="flex flex-col gap-1 mt-auto font-mono text-[10px] text-muted uppercase tracking-widest">
                  <span>From {formatDateTime(event.starts_at)}</span>
                  <span>To {formatDateTime(event.ends_at)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
