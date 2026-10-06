"use client";

import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

function ReauthorizeCallback({ redirectUrl }: { redirectUrl: string }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace(redirectUrl);
      return;
    }
    user
      .reload()
      .then(() => router.replace(redirectUrl))
      .catch(() => router.replace(redirectUrl));
  }, [isLoaded, user, router, redirectUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );
}

function SSOCallbackInner() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/streamer-dashboard";
  const isReauth = searchParams.get("reauth") === "true";

  if (isReauth) {
    return <ReauthorizeCallback redirectUrl={redirectUrl} />;
  }

  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl={redirectUrl}
      signUpForceRedirectUrl={redirectUrl}
    />
  );
}

export default function SSOCallback() {
  return (
    <Suspense>
      <SSOCallbackInner />
    </Suspense>
  );
}
