"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { YouTubeConnectButton } from "@/components/youtube-connect-button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Radio, RefreshCw, PenLine } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"
      />
      <path fill="#FFFFFF" d="M9.75 15.5 15.5 12 9.75 8.5v7z" />
    </svg>
  );
}

type Mode = "choose" | "manual" | "youtube";

type StreamItem = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  channelId: string;
  channelTitle: string;
  publishedAt: string | null;
};

type YouTubeLiveResponse = {
  connected: boolean;
  error?: string;
  channel?: { id: string; title: string; thumbnailUrl: string | null } | null;
  liveStream?: StreamItem | null;
};

type StreamWithCount = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  _count: { donations: number };
};

async function fetchYouTubeLiveStream(): Promise<YouTubeLiveResponse> {
  const res = await fetch("/api/youtube/live-stream");
  return res.json();
}

async function fetchMyStreams(): Promise<StreamWithCount[]> {
  const res = await fetch("/api/streams?page=1&limit=20");
  if (!res.ok) return [];
  const data = await res.json();
  return data.streams ?? [];
}

export default function CreateStreamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("choose");

  useEffect(() => {
    if (searchParams.get("mode") === "youtube") setMode("youtube");
  }, [searchParams]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: ytData,
    isPending: ytLoading,
    isFetching: ytFetching,
    refetch: refetchYt,
  } = useQuery({
    queryKey: ["youtube-live-stream"],
    queryFn: fetchYouTubeLiveStream,
    enabled: mode === "youtube",
    retry: false,
    staleTime: 0,
  });

  const { data: myStreams, isPending: streamsPending } = useQuery({
    queryKey: ["my-streams"],
    queryFn: fetchMyStreams,
    enabled: mode === "youtube",
    staleTime: 30_000,
  });

  async function createStream(
    payload: {
      title: string;
      description?: string;
      thumbnailUrl?: string | null;
      youtubeVideoId?: string | null;
      youtubeChannelId?: string | null;
    },
    redirectToLive = false,
  ) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create stream.");
        return;
      }
      if (redirectToLive) {
        router.push("/streamer-dashboard/live-stream");
      } else {
        router.push("/streamer-dashboard");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createStream({ title, description: description || undefined });
  }

  function handleUseYouTubeStream() {
    if (!ytData?.liveStream) return;
    const ls = ytData.liveStream;
    createStream(
      {
        title: ls.title,
        description: ls.description || undefined,
        thumbnailUrl: ls.thumbnailUrl,
        youtubeVideoId: ls.videoId,
        youtubeChannelId: ls.channelId,
      },
      true,
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link
          href="/streamer-dashboard"
          className="text-xl font-bold tracking-tight"
        >
          Stream<span className="text-purple-500">Drop</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-2">Create Your Stream</h2>
        <p className="text-muted-foreground mb-8">
          Choose how you want to set it up.
        </p>

        {/* CHOOSE */}
        {mode === "choose" && (
          <div className="flex flex-col gap-4">
            <YouTubeConnectButton onConnected={() => setMode("youtube")} />
            <button
              onClick={() => setMode("youtube")}
              className="flex items-start gap-3 border border-border rounded-xl p-5 hover:border-red-500 hover:bg-red-500/5 transition-colors text-left w-full"
            >
              <YouTubeIcon className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-base block">
                  Import from YouTube
                </span>
                <span className="text-muted-foreground text-sm">
                  Already connected? Find your current live stream
                  automatically.
                </span>
              </div>
            </button>
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <div className="flex-1 h-px bg-border" />
              OR
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={() => setMode("manual")}
              className="flex items-start gap-3 border border-border rounded-xl p-5 hover:border-border/80 transition-colors text-left w-full"
            >
              <PenLine className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <span className="font-semibold text-base block">
                  Enter Manually
                </span>
                <span className="text-muted-foreground text-sm">
                  Create your StreamDrop stream yourself.
                </span>
              </div>
            </button>
          </div>
        )}

        {/* MANUAL */}
        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Road to 10K"
                required
                className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Playing ranked games with subscribers."
                rows={4}
                className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              {submitting ? "Creating…" : "Create Stream"}
            </button>
          </form>
        )}

        {/* YOUTUBE */}
        {mode === "youtube" && (
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {(ytLoading || ytFetching) && (
              <div className="flex flex-col gap-5">
                {/* Channel card skeleton */}
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                {/* Live stream card skeleton */}
                <div className="flex flex-col gap-4 bg-card border border-border rounded-xl p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="w-full rounded-lg aspect-video" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              </div>
            )}

            {!ytLoading && !ytFetching && ytData && (
              <>
                {(!ytData.connected ||
                  ytData.error === "youtube_scope_missing") && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
                      {ytData.error === "youtube_scope_missing"
                        ? "YouTube permission not granted. Please connect your YouTube account."
                        : "YouTube is not connected yet."}
                    </div>
                    <YouTubeConnectButton onConnected={() => refetchYt()} />
                  </div>
                )}

                {ytData.connected && ytData.error === "no_channel" && (
                  <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
                    No YouTube channel found on your Google account.
                  </div>
                )}

                {ytData.connected && ytData.error === "youtube_api_error" && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-5 text-sm">
                    YouTube API error. Please try again later.
                  </div>
                )}

                {ytData.connected && ytData.channel && !ytData.error && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                      {ytData.channel.thumbnailUrl && (
                        <Image
                          src={ytData.channel.thumbnailUrl}
                          alt={ytData.channel.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                          <YouTubeIcon className="w-4 h-4" /> YouTube Connected
                        </p>
                        <p className="font-semibold truncate">
                          {ytData.channel.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <YouTubeConnectButton
                          variant="switch"
                          onConnected={() => refetchYt()}
                        />
                        <YouTubeConnectButton
                          variant="disconnect"
                          onConnected={() => refetchYt()}
                        />
                      </div>
                    </div>

                    {ytData.liveStream && (
                      <div className="flex flex-col gap-4 bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-xs font-medium text-red-400 uppercase tracking-widest">
                            Currently Live
                          </span>
                        </div>
                        {ytData.liveStream.thumbnailUrl && (
                          <Image
                            src={ytData.liveStream.thumbnailUrl}
                            alt={ytData.liveStream.title}
                            width={560}
                            height={315}
                            className="w-full rounded-lg object-cover aspect-video"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-base">
                            {ytData.liveStream.title}
                          </p>
                          {ytData.liveStream.description && (
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
                              {ytData.liveStream.description}
                            </p>
                          )}
                        </div>
                        {error && (
                          <p className="text-red-400 text-sm">{error}</p>
                        )}
                        <button
                          onClick={handleUseYouTubeStream}
                          disabled={submitting}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                        >
                          {submitting ? "Creating…" : "Use This Stream"}
                        </button>
                      </div>
                    )}

                    {!ytData.liveStream && (
                      <div className="bg-card border border-border rounded-xl p-5">
                        <p className="font-medium">No currently live stream found.</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Start your stream on YouTube first, then try again.
                        </p>
                        <button
                          onClick={() => refetchYt()}
                          disabled={ytFetching}
                          className="mt-3 flex items-center gap-1.5 border border-border hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                        >
                          {ytFetching ? (
                            <Spinner size="xs" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {ytFetching ? "Checking…" : "Check Again"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {streamsPending && (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-3 w-40" />
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                    <Skeleton className="w-20 h-[45px] rounded-lg flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!streamsPending && myStreams && myStreams.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Your StreamDrop Streams
                </p>
                {myStreams.map((stream) => (
                  <Link
                    key={stream.id}
                    href={`/streamer-dashboard/live-stream?streamId=${stream.id}`}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-purple-500 transition-colors"
                  >
                    {stream.thumbnailUrl && (
                      <Image
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        width={80}
                        height={45}
                        className="w-20 aspect-video object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{stream.title}</p>
                      <p className="text-xs text-purple-400 mt-0.5">
                        {stream._count.donations} superchat{stream._count.donations !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
