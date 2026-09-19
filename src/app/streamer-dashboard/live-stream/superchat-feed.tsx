"use client";

import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";

type Donation = {
  id: string;
  viewerName: string;
  message: string | null;
  amount: number;
  currency: string;
  createdAt: string | Date;
};

const currencySymbol = (c: string) => (c === "INR" ? "₹" : c);

export function SuperchatFeed({
  streamId,
  initialDonations,
}: {
  streamId: string;
  initialDonations: Donation[];
}) {
  const [donations, setDonations] = useState<Donation[]>(initialDonations);
  const seenIds = useRef<Set<string>>(new Set(initialDonations.map((d) => d.id)));

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind("superchat:new", (data: Donation) => {
      if (seenIds.current.has(data.id)) return;
      seenIds.current.add(data.id);
      setDonations((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`stream-${streamId}`);
    };
  }, [streamId]);

  if (donations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
        No superchats yet. Share your public stream link to start receiving donations.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {donations.map((d) => (
        <div
          key={d.id}
          className="bg-card border border-border rounded-xl px-5 py-4 flex items-start justify-between gap-4"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">{d.viewerName}</span>
            {d.message && (
              <span className="text-muted-foreground text-sm">"{d.message}"</span>
            )}
          </div>
          <span className="font-bold text-purple-400 whitespace-nowrap">
            {currencySymbol(d.currency)}{d.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
