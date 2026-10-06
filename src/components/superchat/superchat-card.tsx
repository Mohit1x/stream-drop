"use client";

import { useState } from "react";
import {
  getSuperchatTier,
  currencySymbol,
  type SuperchatTier,
} from "@/lib/superchat-tiers";

const CLAMP_THRESHOLD = 120; // chars before showing read more

function FeedMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > CLAMP_THRESHOLD;

  return (
    <span className="text-sm text-zinc-300 leading-snug break-words">
      {isLong && !expanded ? (
        <>
          {message.slice(0, CLAMP_THRESHOLD).trimEnd()}…{" "}
          <button
            onClick={() => setExpanded(true)}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            read more
          </button>
        </>
      ) : (
        <>
          {message}{" "}
          {isLong && (
            <button
              onClick={() => setExpanded(false)}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              show less
            </button>
          )}
        </>
      )}
    </span>
  );
}

export interface SuperchatCardData {
  id?: string;
  viewerName: string;
  message: string | null;
  amount: number;
  currency: string;
}

interface SuperchatCardProps {
  data: SuperchatCardData;
  /** Pass a pre-resolved tier to skip re-computing (e.g. overlay) */
  tier?: SuperchatTier;
  /** Extra wrapper class */
  className?: string;
  /** Compact mode for overlay — larger text, no tier badge */
  variant?: "feed" | "preview" | "overlay";
}

export function SuperchatCard({
  data,
  tier: tierProp,
  className = "",
  variant = "feed",
}: SuperchatCardProps) {
  const tier = tierProp ?? getSuperchatTier(data.amount);
  const symbol = currencySymbol(data.currency);

  const isOverlay = variant === "overlay";
  const isPreview = variant === "preview";

  return (
    <div
      className={`
        sc-card relative overflow-hidden rounded-xl border
        ${tier.borderClass}
        ${tier.animationClass}
        ${isOverlay ? "px-6 py-4 min-w-[300px] max-w-[420px]" : "px-4 py-3 w-full"}
        ${className}
      `}
      style={{
        background: tier.bg,
        boxShadow: tier.glowStyle ?? undefined,
      }}
    >
      {/* Shimmer sweep — HYPE and above */}
      {tier.shimmer && (
        <span
          className="sc-shimmer pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
      )}

      {/* Pulse ring — EPIC and above */}
      {tier.pulse && (
        <span
          className="sc-pulse pointer-events-none absolute inset-0 rounded-xl"
          aria-hidden="true"
        />
      )}

      {/* Overlay: single row */}
      {isOverlay && (
        <div className="relative flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 font-bold leading-tight text-lg ${tier.nameClass}`}
            style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {data.viewerName}
          </span>
          <span className="flex-1 min-w-0 text-zinc-300 text-sm leading-snug" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.message}
          </span>
          <span className={`shrink-0 font-extrabold tabular-nums text-2xl ${tier.amountClass}`}>
            {symbol}{data.amount}
          </span>
        </div>
      )}

      {/* Feed / Preview: YouTube-style stacked */}
      {!isOverlay && (
        <div className="relative flex flex-col gap-1 min-w-0">
          {/* Top row: tier badge + name + amount */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`
                hidden sm:inline-flex shrink-0 text-[10px] font-bold uppercase tracking-widest
                px-1.5 py-0.5 rounded-md border ${tier.borderClass} opacity-70
                ${tier.amountClass}
              `}
            >
              {tier.label}
            </span>
            <span
              className={`shrink-0 font-bold text-sm leading-tight ${tier.nameClass}`}
              style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {data.viewerName || (isPreview ? "Your name" : "")}
            </span>
            <span className={`ml-auto shrink-0 font-extrabold tabular-nums text-sm ${tier.amountClass}`}>
              {symbol}{data.amount > 0 ? data.amount : isPreview ? "0" : data.amount}
            </span>
          </div>

          {/* Message row */}
          {(data.message || isPreview) && (
            isPreview ? (
              <span
                className="text-sm text-zinc-300 leading-snug break-words"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {data.message || <span className="opacity-40 italic">Your message…</span>}
              </span>
            ) : data.message ? (
              <FeedMessage message={data.message} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
