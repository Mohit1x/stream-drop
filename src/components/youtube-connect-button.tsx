"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback } from "react";
import { FaYoutube } from "react-icons/fa";

export function YouTubeConnectButton({ onConnected }: { onConnected: () => void }) {
  const { user } = useUser();

  const handleConnect = useCallback(async () => {
    if (!user) return;

    const googleAccount = user.externalAccounts.find(
      (a) => a.provider === "google"
    );

    if (!googleAccount) {
      alert("No Google account connected to your StreamDrop account.");
      return;
    }

    try {
      const result = await googleAccount.reauthorize({
        additionalScopes: ["https://www.googleapis.com/auth/youtube.readonly"],
        redirectUrl: `${window.location.origin}/sso-callback?redirect_url=${encodeURIComponent(window.location.href)}`,
      });

      // Clerk returns the verification with the Google OAuth redirect URL
      const redirectUrl = result.verification?.externalVerificationRedirectURL;
      if (redirectUrl) {
        window.location.href = redirectUrl.toString();
      } else {
        // Already has the scope, no redirect needed
        onConnected();
      }
    } catch (err) {
      console.error("YouTube connect error", err);
      alert("Failed to connect YouTube. Please try again.");
    }
  }, [user, onConnected]);

  return (
    <button
      onClick={handleConnect}
      className="flex items-start gap-3 border border-border rounded-xl p-5 hover:border-red-500 hover:bg-red-500/5 transition-colors text-left w-full"
    >
      <FaYoutube className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold text-base block">Connect YouTube</span>
        <span className="text-muted-foreground text-sm">
          Automatically use info from your current YouTube live stream.
        </span>
      </div>
    </button>
  );
}
