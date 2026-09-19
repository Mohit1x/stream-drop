import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      youtubeVideoId: true,
      youtubeChannelId: true,
      createdAt: true,
    },
  });

  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  return NextResponse.json(stream);
}
