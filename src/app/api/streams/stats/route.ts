import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [totalStreams, agg] = await Promise.all([
    prisma.stream.count({ where: { userId: dbUser.id } }),
    prisma.donation.aggregate({
      where: { stream: { userId: dbUser.id }, status: "PAID" },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ]);

  return NextResponse.json({
    totalStreams,
    totalDonations: agg._count.id,
    totalEarnings: agg._sum.amount ?? 0,
  });
}
