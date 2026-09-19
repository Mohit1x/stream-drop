"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useUserStore, DbUser } from "@/store/user-store";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/>
      <path fill="#FFFFFF" d="M9.75 15.5 15.5 12 9.75 8.5v7z"/>
    </svg>
  );
}

type StreamWithCount = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  _count: { donations: number };
};

type StreamsResponse = {
  streams: StreamWithCount[];
  total: number;
  page: number;
  totalPages: number;
};

async function syncUser(): Promise<DbUser> {
  const res = await fetch("/api/sync-user", { method: "POST" });
  if (!res.ok) throw new Error("Failed to sync user");
  return res.json();
}

async function fetchStreams(page: number): Promise<StreamsResponse> {
  const res = await fetch(`/api/streams?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch streams");
  return res.json();
}

async function fetchYouTubeChannel(): Promise<{ title: string; thumbnailUrl: string | null } | null> {
  const res = await fetch("/api/youtube/live-stream");
  if (!res.ok) return null;
  const data = await res.json();
  return data?.channel ?? null;
}

export default function StreamerDashboard() {
  const setDbUser = useUserStore((s) => s.setDbUser);
  const dbUser = useUserStore((s) => s.dbUser);
  const { user } = useUser();
  const [page, setPage] = useState(1);

  const googleAccount = user?.externalAccounts.find((a) => a.provider === "google");
  const isYouTubeConnected = googleAccount?.approvedScopes.includes("youtube") ?? false;

  const { data, isPending, isError } = useQuery({
    queryKey: ["sync-user"],
    queryFn: syncUser,
    staleTime: Infinity,
    retry: 1,
  });

  const { data: streamsData, isPending: streamsPending } = useQuery({
    queryKey: ["streams", page],
    queryFn: () => fetchStreams(page),
    enabled: !!dbUser,
  });

  const { data: ytChannel } = useQuery({
    queryKey: ["yt-channel"],
    queryFn: fetchYouTubeChannel,
    enabled: isYouTubeConnected,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setDbUser(data);
  }, [data, setDbUser]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Stream<span className="text-purple-500">Drop</span>
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {isPending && (
          <div className="flex flex-col gap-8">
            {/* Welcome skeleton */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-48" />
            </div>
            {/* Profile card skeleton */}
            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
              <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full mt-1" />
              </div>
            </div>
            {/* Actions skeleton */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-36 rounded-lg" />
              <Skeleton className="h-11 w-44 rounded-lg" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
            {/* Streams skeleton */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-3 w-24" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <Skeleton className="w-24 h-[54px] rounded-lg flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
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
            <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
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
                <span className="text-muted-foreground text-sm">{dbUser.email}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-full px-2.5 py-0.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {dbUser.role}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/streamer-dashboard/create-stream"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Stream
              </Link>
              {isYouTubeConnected ? (
                <Link
                  href="/streamer-dashboard/create-stream?mode=youtube"
                  className="inline-flex items-center gap-2 border border-red-500/40 bg-red-500/5 hover:border-red-500 px-4 py-2.5 rounded-lg text-sm transition-colors"
                >
                  <YouTubeIcon className="w-5 h-5 flex-shrink-0" />
                  {ytChannel?.thumbnailUrl && (
                    <Image
                      src={ytChannel.thumbnailUrl}
                      alt={ytChannel.title}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="font-medium truncate max-w-[160px]">
                    {ytChannel?.title ?? "YouTube Connected"}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/streamer-dashboard/create-stream?mode=youtube"
                  className="inline-flex items-center gap-2 border border-border hover:border-red-500 hover:bg-red-500/5 font-semibold px-5 py-3 rounded-lg transition-colors text-sm"
                >
                  <YouTubeIcon className="w-5 h-5" /> Connect YouTube
                </Link>
              )}
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
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Streams with donations */}
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
                Your Streams
              </p>

              {streamsPending && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                      <Skeleton className="w-24 h-[54px] rounded-lg flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!streamsPending && streamsData?.streams.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                  No streams with donations yet.
                </div>
              )}

              {!streamsPending && streamsData && streamsData.streams.length > 0 && (
                <>
                  <div className="flex flex-col gap-3">
                    {streamsData.streams.map((stream) => (
                      <Link
                        key={stream.id}
                        href={`/streamer-dashboard/live-stream?streamId=${stream.id}`}
                        className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-purple-500 transition-colors"
                      >
                        {stream.thumbnailUrl && (
                          <img
                            src={stream.thumbnailUrl}
                            alt={stream.title}
                            className="w-24 aspect-video object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{stream.title}</p>
                          {stream.description && (
                            <p className="text-muted-foreground text-sm truncate mt-0.5">
                              {stream.description}
                            </p>
                          )}
                          <p className="text-xs text-purple-400 mt-1">
                            {stream._count.donations} superchat{stream._count.donations !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {streamsData.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {page} / {streamsData.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === streamsData.totalPages}
                        className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
