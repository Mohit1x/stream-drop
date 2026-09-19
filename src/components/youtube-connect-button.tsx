"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { RefreshCw, Unlink } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/>
      <path fill="#FFFFFF" d="M9.75 15.5 15.5 12 9.75 8.5v7z"/>
    </svg>
  );
}

type Variant = "connect" | "switch" | "disconnect";

export function YouTubeConnectButton({
  onConnected,
  variant = "connect",
}: {
  onConnected: () => void;
  variant?: Variant;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getGoogleAccount = useCallback(() => {
    return user?.externalAccounts.find((a) => a.provider === "google") ?? null;
  }, [user]);

  const triggerOAuth = useCallback(
    async (forceAccountPicker = false) => {
      if (!user) return;
      const googleAccount = getGoogleAccount();
      if (!googleAccount) {
        alert("No Google account connected to your StreamDrop account.");
        return;
      }
      setLoading(true);
      try {
        const callbackUrl = new URL("/sso-callback", window.location.origin);
        callbackUrl.searchParams.set("reauth", "true");
        callbackUrl.searchParams.set("redirect_url", window.location.href);

        const result = await googleAccount.reauthorize({
          additionalScopes: ["https://www.googleapis.com/auth/youtube.readonly"],
          redirectUrl: callbackUrl.toString(),
        });
        const verifyUrl = result.verification?.externalVerificationRedirectURL;
        if (verifyUrl) {
          const url = new URL(verifyUrl.toString());
          url.searchParams.set("prompt", forceAccountPicker ? "select_account" : "consent");
          window.location.href = url.toString();
        } else {
          onConnected();
          setLoading(false);
        }
      } catch (err) {
        console.error("YouTube OAuth error", err);
        alert("Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    [user, getGoogleAccount, onConnected]
  );

  const handleConnect = useCallback(() => triggerOAuth(), [triggerOAuth]);

  const handleSwitch = useCallback(
    () => triggerOAuth(true),
    [triggerOAuth]
  );

  const handleDisconnectConfirmed = useCallback(async () => {
    if (!user) return;
    const googleAccount = getGoogleAccount();
    if (!googleAccount) return;
    setLoading(true);
    try {
      // Reauthorize with no YouTube scope — effectively removes YouTube access
      // Full account removal requires Clerk's user profile (needs re-verification)
      const callbackUrl = new URL("/sso-callback", window.location.origin);
      callbackUrl.searchParams.set("reauth", "true");
      callbackUrl.searchParams.set("redirect_url", window.location.href);

      const result = await googleAccount.reauthorize({
        additionalScopes: [],
        redirectUrl: callbackUrl.toString(),
      });
      const verifyUrl = result.verification?.externalVerificationRedirectURL;
      if (verifyUrl) {
        window.location.href = verifyUrl.toString();
      } else {
        await user.reload();
        setConfirmOpen(false);
        onConnected();
        setLoading(false);
      }
    } catch (err) {
      console.error("YouTube disconnect error", err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [user, getGoogleAccount, onConnected]);

  if (variant === "switch") {
    return (
      <button
        onClick={handleSwitch}
        disabled={loading}
        title="Switch to a different YouTube account"
        className="flex items-center gap-1.5 border border-border hover:border-purple-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        Switch Account
      </button>
    );
  }

  if (variant === "disconnect") {
    return (
      <>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          title="Disconnect YouTube"
          className="flex items-center gap-1.5 border border-border hover:border-red-500 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Unlink className="w-3.5 h-3.5" />
          Disconnect
        </button>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Disconnect YouTube?"
          description="This will remove YouTube access from StreamDrop. You can reconnect at any time."
          confirmLabel="Disconnect"
          destructive
          loading={loading}
          onConfirm={handleDisconnectConfirmed}
        />
      </>
    );
  }

  // Default: full connect button
  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-start gap-3 border border-border rounded-xl p-5 hover:border-red-500 hover:bg-red-500/5 transition-colors text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <YouTubeIcon className="w-6 h-6 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-semibold text-base block">Connect YouTube</span>
        <span className="text-muted-foreground text-sm">
          Automatically use info from your current YouTube live stream.
        </span>
      </div>
    </button>
  );
}
