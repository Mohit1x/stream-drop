import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import Image from "next/image";
import { FaYoutube } from "react-icons/fa";
import { Radio } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SuperchatFeed } from "./superchat-feed";

export default async function LiveStreamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) redirect("/sign-in");

  // Get the most recent stream for this user
  const stream = await prisma.stream.findFirst({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    include: {
      donations: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          viewerName: true,
          message: true,
          amount: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  });

  if (!stream) redirect("/streamer-dashboard/create-stream");

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const obsUrl = `${origin}/overlay/${stream.id}`;
  const publicUrl = `${origin}/stream/${stream.id}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/streamer-dashboard" className="text-xl font-bold tracking-tight">
          Stream<span className="text-purple-500">Drop</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-widest">Live Stream</span>
          </div>
          <h1 className="text-2xl font-bold">{stream.title}</h1>
          {stream.description && (
            <p className="text-muted-foreground text-sm mt-1">{stream.description}</p>
          )}
        </div>

        {/* Thumbnail + YouTube info */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {stream.thumbnailUrl && (
            <Image
              src={stream.thumbnailUrl}
              alt={stream.title}
              width={800}
              height={450}
              className="w-full object-cover aspect-video"
            />
          )}
          <div className="p-5 flex items-center gap-2">
            <FaYoutube className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-medium text-green-400">YouTube Connected ✓</span>
            {stream.youtubeChannelId && (
              <span className="text-sm text-muted-foreground ml-1">
                · Channel: {stream.youtubeChannelId}
              </span>
            )}
          </div>
        </div>


        {/* StreamDrop Links */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
            StreamDrop Links
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">OBS Browser Source URL</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="text-sm font-mono truncate flex-1">{obsUrl}</span>
                <CopyButton text={obsUrl} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Public Stream URL</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="text-sm font-mono truncate flex-1">{publicUrl}</span>
                <CopyButton text={publicUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* Superchats */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
            Superchats
          </h2>
          <SuperchatFeed streamId={stream.id} initialDonations={stream.donations} />
        </div>
      </div>
    </main>
  );
}
