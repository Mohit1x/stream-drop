import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "5"));
  const skip = (page - 1) * limit;

  const [streams, total] = await Promise.all([
    prisma.stream.findMany({
      where: {
        userId: dbUser.id,
        donations: { some: { status: "PAID" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { donations: { where: { status: "PAID" } } } },
      },
    }),
    prisma.stream.count({
      where: {
        userId: dbUser.id,
        donations: { some: { status: "PAID" } },
      },
    }),
  ]);

  return NextResponse.json({ streams, total, page, totalPages: Math.ceil(total / limit) });
}

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

  // Upsert: reuse existing stream for same user + youtubeVideoId
  let stream;
  if (youtubeVideoId) {
    stream = await prisma.stream.upsert({
      where: { userId_youtubeVideoId: { userId: dbUser.id, youtubeVideoId } },
      update: {
        title: title.trim(),
        description: description?.trim() ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        youtubeChannelId: youtubeChannelId ?? null,
      },
      create: {
        userId: dbUser.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        youtubeVideoId,
        youtubeChannelId: youtubeChannelId ?? null,
      },
    });
  } else {
    stream = await prisma.stream.create({
      data: {
        userId: dbUser.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        youtubeVideoId: null,
        youtubeChannelId: null,
      },
    });
  }

  return NextResponse.json(stream, { status: 201 });
}
