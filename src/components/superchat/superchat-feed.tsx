"use client";

import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { SuperchatCard, type SuperchatCardData } from "./superchat-card";

interface SuperchatFeedProps {
  streamId: string;
  initialDonations: SuperchatCardData[];
}

export function SuperchatFeed({
  streamId,
  initialDonations,
}: SuperchatFeedProps) {
  const [donations, setDonations] =
    useState<SuperchatCardData[]>(initialDonations);
  const seenIds = useRef<Set<string>>(
    new Set(initialDonations.map((d) => d.id ?? "")),
  );

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind(
      "superchat:new",
      (data: SuperchatCardData & { id: string }) => {
        if (seenIds.current.has(data.id)) return;
        seenIds.current.add(data.id);
        setDonations((prev) => [data, ...prev]);
      },
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`stream-${streamId}`);
    };
  }, [streamId]);

  if (donations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
        No superchats yet. Be the first!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {donations.map((d, i) => (
        <SuperchatCard key={d.id ?? i} data={d} variant="feed" />
      ))}
    </div>
  );
}
