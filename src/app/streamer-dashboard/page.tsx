"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUserStore, DbUser } from "@/store/user-store";
import { UserButton } from "@clerk/nextjs";

async function syncUser(): Promise<DbUser> {
  const res = await fetch("/api/sync-user", { method: "POST" });
  if (!res.ok) throw new Error("Failed to sync user");
  return res.json();
}

export default function StreamerDashboard() {
  const setDbUser = useUserStore((s) => s.setDbUser);
  const dbUser = useUserStore((s) => s.dbUser);

  const { data, isPending, isError } = useQuery({
    queryKey: ["sync-user"],
    queryFn: syncUser,
    staleTime: Infinity,
    retry: 1,
  });

  useEffect(() => {
    if (data) setDbUser(data);
  }, [data, setDbUser]);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Stream<span className="text-purple-500">Drop</span>
        </h1>
        <UserButton />
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {isPending && (
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span>Setting up your account…</span>
          </div>
        )}

        {isError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
            Something went wrong syncing your account. Please refresh.
          </div>
        )}

        {dbUser && (
          <div className="flex flex-col gap-8">
            {/* Welcome */}
            <div>
              <p className="text-zinc-400 text-sm uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <h2 className="text-3xl font-bold">
                {dbUser.fullName ?? dbUser.email}
              </h2>
            </div>

            {/* Profile card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-5">
              {dbUser.imageUrl && (
                <img
                  src={dbUser.imageUrl}
                  alt="avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500"
                />
              )}
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-lg">
                  {dbUser.fullName ?? "—"}
                </span>
                <span className="text-zinc-400 text-sm">{dbUser.email}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full px-2.5 py-0.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {dbUser.role}
                </span>
              </div>
            </div>

            {/* Placeholder stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Total Streams", value: "—" },
                { label: "Total Donations", value: "—" },
                { label: "Total Earnings", value: "—" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-zinc-300">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
