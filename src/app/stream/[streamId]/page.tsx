import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { StreamViewerClient } from "./stream-viewer-client";

export default async function StreamPage({
  params,
}: {
  params: Promise<{ streamId: string }>;
}) {
  const { streamId } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
    },
  });

  if (!stream) notFound();

  const donations = await prisma.donation.findMany({
    where: { streamId, status: "PAID" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      viewerName: true,
      message: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          Stream<span className="text-purple-500">Drop</span>
        </h1>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Stream info */}
        <div className="flex flex-col gap-4">
          {stream.thumbnailUrl && (
            <Image
              src={stream.thumbnailUrl}
              alt={stream.title}
              width={800}
              height={450}
              className="w-full rounded-xl object-cover aspect-video"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold">{stream.title}</h2>
            {stream.description && (
              <p className="text-muted-foreground text-sm mt-1">{stream.description}</p>
            )}
          </div>
        </div>

        {/* Client: superchat feed + form */}
        <StreamViewerClient streamId={streamId} initialDonations={donations} />
      </div>
    </main>
  );
}
