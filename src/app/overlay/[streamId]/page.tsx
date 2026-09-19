import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OverlayClient } from "./overlay-client";

export default async function OverlayPage({
  params,
}: {
  params: Promise<{ streamId: string }>;
}) {
  const { streamId } = await params;

  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    select: { id: true, title: true },
  });

  if (!stream) notFound();

  return <OverlayClient streamId={stream.id} />;
}
