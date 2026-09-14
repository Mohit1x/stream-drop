import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, description, thumbnailUrl, youtubeVideoId, youtubeChannelId } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const stream = await prisma.stream.create({
    data: {
      userId: dbUser.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      youtubeVideoId: youtubeVideoId ?? null,
      youtubeChannelId: youtubeChannelId ?? null,
    },
  });

  return NextResponse.json(stream, { status: 201 });
}
