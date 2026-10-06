"use client";

import { SuperchatCard } from "./superchat-card";

interface SuperchatFormProps {
  name: string;
  message: string;
  amount: string;
  submitting: boolean;
  error: string | null;
  onNameChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SuperchatForm({
  name,
  message,
  amount,
  submitting,
  error,
  onNameChange,
  onMessageChange,
  onAmountChange,
  onSubmit,
}: SuperchatFormProps) {
  const parsedAmount = parseInt(amount, 10);
  const previewAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      <h3 className="font-semibold text-base">Send a Superchat</h3>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Mohit"
            required
            maxLength={100}
            className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Message{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Great stream bro!"
            maxLength={500}
            rows={2}
            className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors resize-none overflow-hidden"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Amount (₹) <span className="text-red-400">*</span>
          </label>
          <input
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="50"
            type="number"
            min="1"
            max="100000"
            required
            className="bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Live preview */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Superchat Preview
          </p>
          <div className="overflow-hidden">
            <SuperchatCard
              data={{
                viewerName: name,
                message: message || null,
                amount: previewAmount,
                currency: "INR",
              }}
              variant="preview"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

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
  );
}
