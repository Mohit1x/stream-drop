"use client";

import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";

type SuperchatAlert = {
  id: string;
  viewerName: string;
  message: string | null;
  amount: number;
  currency: string;
};

const currencySymbol = (c: string) => (c === "INR" ? "₹" : c);

export function OverlayClient({ streamId }: { streamId: string }) {
  const [alert, setAlert] = useState<SuperchatAlert | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.log("[Overlay] Initializing Pusher for stream:", streamId);
    const pusher = getPusherClient();

    pusher.connection.bind("connecting", () => console.log("[Overlay] Pusher connecting..."));
    pusher.connection.bind("connected", () => console.log("[Overlay] Pusher connected. Socket ID:", pusher.connection.socket_id));
    pusher.connection.bind("disconnected", () => console.warn("[Overlay] Pusher disconnected."));
    pusher.connection.bind("failed", () => console.error("[Overlay] Pusher connection failed."));
    pusher.connection.bind("error", (err: unknown) => console.error("[Overlay] Pusher connection error:", err));

    console.log("[Overlay] Subscribing to channel:", `stream:${streamId}`);
    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind("pusher:subscription_succeeded", () => console.log("[Overlay] Channel subscription succeeded."));
    channel.bind("pusher:subscription_error", (err: unknown) => console.error("[Overlay] Channel subscription error:", err));

    channel.bind("superchat:new", (data: SuperchatAlert) => {
      console.log("[Overlay] superchat:new received:", data);
      if (seenIds.current.has(data.id)) {
        console.log("[Overlay] Duplicate superchat ignored:", data.id);
        return;
      }
      seenIds.current.add(data.id);

      setAlert(data);

      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setAlert(null), 6000);
    });

    return () => {
      console.log("[Overlay] Cleaning up Pusher for stream:", streamId);
      channel.unbind_all();
      pusher.unsubscribe(`stream-${streamId}`);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [streamId]);

  return (
    <div
      style={{ background: "transparent" }}
      className="w-screen h-screen flex items-end justify-start p-8 pointer-events-none"
    >
      {alert && (
        <div className="bg-black/80 border border-purple-500/60 rounded-2xl px-8 py-5 flex flex-col items-center gap-1 min-w-[280px] max-w-sm shadow-2xl">
          <span className="text-white font-bold text-lg leading-tight">
            {alert.viewerName}
          </span>
          <span className="text-purple-300 font-extrabold text-2xl">
            {currencySymbol(alert.currency)}{alert.amount}
          </span>
          {alert.message && (
            <span className="text-zinc-300 text-sm text-center mt-1">
              "{alert.message}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
