"use client";

import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { SuperchatForm } from "@/components/superchat/superchat-form";
import { SuperchatFeed } from "@/components/superchat/superchat-feed";
import type { SuperchatCardData } from "@/components/superchat/superchat-card";

// ── Razorpay types ────────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string };
  theme: { color: string };
  config: unknown;
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
}
// ─────────────────────────────────────────────────────────────────────────────

export function StreamViewerClient({
  streamId,
  initialDonations,
}: {
  streamId: string;
  initialDonations: SuperchatCardData[];
}) {
  const [donations, setDonations] = useState<SuperchatCardData[]>(initialDonations);
  const seenIds = useRef<Set<string>>(
    new Set(initialDonations.map((d) => d.id ?? ""))
  );

  // Form state
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Pusher: subscribe to live superchat events ────────────────────────────
  // DO NOT CHANGE — channel: stream-${streamId}, event: superchat:new
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind("superchat:new", (data: SuperchatCardData & { id: string }) => {
      if (seenIds.current.has(data.id)) return;
      seenIds.current.add(data.id);
      setDonations((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`stream-${streamId}`);
    };
  }, [streamId]);

  // ── Load Razorpay checkout script once ───────────────────────────────────
  // DO NOT CHANGE
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Payment handler ───────────────────────────────────────────────────────
  // DO NOT CHANGE — full Razorpay order + verify flow preserved exactly
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseInt(amount, 10);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0)
      return setError("Enter a valid amount.");

    setSubmitting(true);
    try {
      // Step 1: Create PENDING donation + Razorpay order
      const res = await fetch(`/api/streams/${streamId}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerName: name.trim(),
          message: message.trim() || null,
          amount: parsedAmount,
          currency: "INR",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      const { donationId, orderId, keyId } = await res.json();

      if (!keyId || !orderId) {
        setError("Payment configuration error. Please try again.");
        setSubmitting(false);
        return;
      }

      // Step 2: Open Razorpay Checkout modal
      const options: RazorpayOptions = {
        key: keyId,
        amount: parsedAmount * 100,
        currency: "INR",
        order_id: orderId,
        name: "StreamDrop",
        description: "Superchat",
        prefill: { name: name.trim() },
        theme: { color: "#7c3aed" },
        config: {
          display: {
            blocks: {
              upi: { name: "UPI", instruments: [{ method: "upi" }] },
              netbanking: {
                name: "Net Banking",
                instruments: [{ method: "netbanking" }],
              },
            },
            sequence: ["block.upi", "block.netbanking"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment server-side
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                donationId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Verification request failed. Your payment may still be processing.");
          }
          setName("");
          setMessage("");
          setAmount("");
          setSubmitting(false);
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const script = document.getElementById("razorpay-script") as HTMLScriptElement | null;
        if (!script) return reject(new Error("Razorpay script not found"));
        script.addEventListener("load", () => resolve());
        script.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      });

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Superchat form + live preview */}
      <SuperchatForm
        name={name}
        message={message}
        amount={amount}
        submitting={submitting}
        error={error}
        onNameChange={setName}
        onMessageChange={setMessage}
        onAmountChange={setAmount}
        onSubmit={handleSubmit}
      />

      {/* Superchat feed — only PAID donations via Pusher or SSR */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          Superchats
        </h3>
        <SuperchatFeed streamId={streamId} initialDonations={donations} />
      </div>
    </div>
  );
}
