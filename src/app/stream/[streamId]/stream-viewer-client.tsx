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

// Razorpay types
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

const currencySymbol = (c: string) => (c === "INR" ? "₹" : c);

export function StreamViewerClient({
  streamId,
  initialDonations,
}: {
  streamId: string;
  initialDonations: Donation[];
}) {
  const [donations, setDonations] = useState<Donation[]>(initialDonations);
  const seenIds = useRef<Set<string>>(new Set(initialDonations.map((d) => d.id)));

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pusher: subscribe to live superchat events
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`stream-${streamId}`);

    channel.bind("superchat:new", (data: Donation) => {
      if (seenIds.current.has(data.id)) return; // deduplicate
      seenIds.current.add(data.id);
      setDonations((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`stream-${streamId}`);
    };
  }, [streamId]);

  // Load Razorpay checkout script once
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

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

      // Step 2: Open Razorpay Checkout
      const options: RazorpayOptions = {
        key: keyId,
        amount: parsedAmount * 100, // paise — for display only, order amount is authoritative
        currency: "INR",
        order_id: orderId,
        name: "StreamDrop",
        description: "Superchat",
        prefill: { name: name.trim() },
        theme: { color: "#7c3aed" },
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
            // Pusher will push the confirmed superchat — no need to manually add here
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

      await new Promise<void>((resolve) => {
        if (window.Razorpay) return resolve();
        const script = document.getElementById("razorpay-script");
        script?.addEventListener("load", () => resolve());
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
      {/* Superchat form */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
        <h3 className="font-semibold text-base">Send a Superchat</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mohit"
              required
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Message{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Great stream bro!"
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Amount (₹) <span className="text-red-400">*</span>
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              type="number"
              min="1"
              max="100000"
              required
              className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            {submitting ? "Opening payment…" : "Send Superchat"}
          </button>
        </form>
      </div>

      {/* Superchat feed */}
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          Superchats
        </h3>

        {donations.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
            No superchats yet. Be the first!
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
