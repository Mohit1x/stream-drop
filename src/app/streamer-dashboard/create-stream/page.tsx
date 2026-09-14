"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { YouTubeConnectButton } from "@/components/youtube-connect-button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Radio, RefreshCw, PenLine, Plus } from "lucide-react";
import { FaYoutube } from "react-icons/fa";

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
  pastStreams?: StreamItem[];
};

async function fetchYouTubeLiveStream(): Promise<YouTubeLiveResponse> {
  const res = await fetch("/api/youtube/live-stream");
  return res.json();
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
    refetch: refetchYt,
  } = useQuery({
    queryKey: ["youtube-live-stream"],
    queryFn: fetchYouTubeLiveStream,
    enabled: mode === "youtube",
    retry: false,
    staleTime: 0,
  });

  async function createStream(payload: {
    title: string;
    description?: string;
    thumbnailUrl?: string | null;
    youtubeVideoId?: string | null;
    youtubeChannelId?: string | null;
  }) {
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
      router.push("/streamer-dashboard");
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
    createStream({
      title: ls.title,
      description: ls.description || undefined,
      thumbnailUrl: ls.thumbnailUrl,
      youtubeVideoId: ls.videoId,
      youtubeChannelId: ls.channelId,
    });
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
              <FaYoutube className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
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

            {ytLoading && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                <span>Checking your YouTube channel…</span>
              </div>
            )}

            {!ytLoading && ytData && (
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
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                          <FaYoutube className="w-4 h-4 text-red-500" /> YouTube
                          Connected
                        </p>
                        <p className="font-semibold">{ytData.channel.title}</p>
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
                      <div className="flex flex-col gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                          <p className="font-medium">
                            No currently live stream found.
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            Start your stream on YouTube first, then try again.
                          </p>
                          <button
                            onClick={() => refetchYt()}
                            className="mt-3 flex items-center gap-1.5 border border-border hover:border-purple-500 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                          >
                            <RefreshCw className="w-4 h-4" /> Check Again
                          </button>
                        </div>

                        {ytData.pastStreams &&
                          ytData.pastStreams.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                                Recent Streams
                              </p>
                              {ytData.pastStreams.map((stream) => (
                                <div
                                  key={stream.videoId}
                                  className="flex gap-4 bg-card border border-border rounded-xl p-4 items-start"
                                >
                                  {stream.thumbnailUrl && (
                                    <Image
                                      src={stream.thumbnailUrl}
                                      alt={stream.title}
                                      width={112}
                                      height={63}
                                      className="w-28 rounded-lg object-cover aspect-video flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {stream.title}
                                    </p>
                                    {stream.description && (
                                      <p className="text-muted-foreground text-xs line-clamp-2">
                                        {stream.description}
                                      </p>
                                    )}
                                    <button
                                      onClick={() =>
                                        createStream({
                                          title: stream.title,
                                          description:
                                            stream.description || undefined,
                                          thumbnailUrl: stream.thumbnailUrl,
                                          youtubeVideoId: stream.videoId,
                                          youtubeChannelId: stream.channelId,
                                        })
                                      }
                                      disabled={submitting}
                                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors w-fit"
                                    >
                                      Use This Stream
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
