import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  const headerPayload = await headers();
  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id")!,
    "svix-timestamp": headerPayload.get("svix-timestamp")!,
    "svix-signature": headerPayload.get("svix-signature")!,
  };

  const payload = await req.text();

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, first_name, last_name, image_url, email_addresses } =
      event.data;
    const email = email_addresses[0]?.email_address ?? "";
    const firstName = first_name ?? null;
    const lastName = last_name ?? null;
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
    await prisma.user.upsert({
      where: { clerkId: id },
      update: {},
      create: {
        clerkId: id,
        email,
        firstName,
        lastName,
        fullName,
        imageUrl: image_url ?? null,
      },
    });
  }

  return new Response(null, { status: 200 });
}
