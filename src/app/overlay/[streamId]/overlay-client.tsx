"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { SuperchatCard, type SuperchatCardData } from "@/components/superchat/superchat-card";
import { getSuperchatTier } from "@/lib/superchat-tiers";

// Tier-based sound config — frequencies, duration, gain per tier
const SOUND_CONFIGS: Record<string, { freq: number[]; duration: number; gain: number }> = {
  BASIC:     { freq: [520, 660],             duration: 0.35, gain: 0.25 },
  HYPE:      { freq: [600, 750, 900],        duration: 0.45, gain: 0.35 },
  EPIC:      { freq: [660, 880, 1100],       duration: 0.55, gain: 0.45 },
  LEGENDARY: { freq: [740, 988, 1320, 1480], duration: 0.70, gain: 0.55 },
  ULTRA:     { freq: [880, 1100, 1320, 1760],duration: 0.90, gain: 0.65 },
};

export function OverlayClient({ streamId }: { streamId: string }) {
  const [alert, setAlert] = useState<SuperchatCardData | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ONE shared AudioContext for the lifetime of this overlay instance
  const audioCtx = useRef<AudioContext | null>(null);

  // Lazily create (or resume) the shared AudioContext on first user gesture.
  // Must be called from a user-interaction handler so browsers/OBS allow it.
  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioCtx.current || audioCtx.current.state === "closed") {
        audioCtx.current = new AudioContext();
      }
      if (audioCtx.current.state === "suspended") {
        // Non-blocking resume — next sound call will benefit from it
        audioCtx.current.resume().catch(() => {});
      }
      return audioCtx.current;
    } catch {
      return null;
    }
  }, []);

  // Unlock the shared AudioContext on first click/keydown (OBS/browser policy)
  useEffect(() => {
    function unlock() {
      getAudioContext();
    }
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [getAudioContext]);

  // Close the shared AudioContext when the overlay unmounts
  useEffect(() => {
    return () => {
      if (audioCtx.current && audioCtx.current.state !== "closed") {
        audioCtx.current.close().catch(() => {});
        audioCtx.current = null;
      }
    };
  }, []);

  // Play a tier-aware chime using the SHARED AudioContext.
  // Only called inside superchat:new — never on preview, form, or PENDING.
  const playSound = useCallback((amount: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const tier = getSuperchatTier(amount);
    const cfg = SOUND_CONFIGS[tier.name] ?? SOUND_CONFIGS.BASIC;

    // If still suspended after unlock attempt, bail silently
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
      return;
    }

    const now = ctx.currentTime;
    const step = cfg.duration / cfg.freq.length;

    cfg.freq.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * step);

      gainNode.gain.setValueAtTime(0, now + i * step);
      gainNode.gain.linearRampToValueAtTime(cfg.gain, now + i * step + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * step + step);

      osc.start(now + i * step);
      osc.stop(now + i * step + step);

      // Disconnect nodes after they finish to avoid accumulation
      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
      };
    });
  }, [getAudioContext]);

  // Pusher subscription — channel and event names unchanged
  useEffect(() => {
    console.log("[Overlay] Initializing Pusher for stream:", streamId);
    const pusher = getPusherClient();

    pusher.connection.bind("connecting", () => console.log("[Overlay] Pusher connecting..."));
    pusher.connection.bind("connected", () => console.log("[Overlay] Pusher connected. Socket ID:", pusher.connection.socket_id));
    pusher.connection.bind("disconnected", () => console.warn("[Overlay] Pusher disconnected."));
    pusher.connection.bind("failed", () => console.error("[Overlay] Pusher connection failed."));
    pusher.connection.bind("error", (err: unknown) => console.error("[Overlay] Pusher connection error:", err));

    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind("pusher:subscription_succeeded", () => console.log("[Overlay] Channel subscription succeeded."));
    channel.bind("pusher:subscription_error", (err: unknown) => console.error("[Overlay] Channel subscription error:", err));

    // DO NOT CHANGE — channel: stream-${streamId}, event: superchat:new
    channel.bind("superchat:new", (data: SuperchatCardData & { id: string }) => {
      console.log("[Overlay] superchat:new received:", data);
      if (seenIds.current.has(data.id)) {
        console.log("[Overlay] Duplicate superchat ignored:", data.id);
        return;
      }
      seenIds.current.add(data.id);

      // Sound plays ONLY here — confirmed PAID superchat on the OBS overlay
      playSound(data.amount);

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
  }, [streamId, playSound]);

  return (
    <div
      style={{ background: "transparent" }}
      className="w-screen h-screen flex items-end justify-start p-8 pointer-events-none"
    >
      {alert && (
        <SuperchatCard
          data={alert}
          variant="overlay"
        />
      )}
    </div>
  );
}
