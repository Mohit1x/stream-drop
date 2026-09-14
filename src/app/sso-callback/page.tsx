"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SSOCallback() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") ?? "/streamer-dashboard";

  return (
    <AuthenticateWithRedirectCallback
      afterSignInUrl={redirectUrl}
      afterSignUpUrl={redirectUrl}
    />
  );
}
