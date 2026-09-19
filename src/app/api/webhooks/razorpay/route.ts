import { prisma } from "@/lib/prisma";
import { triggerSuperchat } from "@/lib/pusher-server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature using webhook secret (different from key secret)
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event;
  const paymentEntity = (
    event.payload?.payment as { entity?: Record<string, unknown> } | undefined
  )?.entity;

  if (!paymentEntity) {
    return NextResponse.json({ received: true });
  }

  const razorpayOrderId = paymentEntity.order_id as string | undefined;
  const razorpayPaymentId = paymentEntity.id as string | undefined;

  if (!razorpayOrderId) {
    return NextResponse.json({ received: true });
  }

  const donation = await prisma.donation.findUnique({
    where: { razorpayOrderId },
    select: {
      id: true,
      streamId: true,
      status: true,
      viewerName: true,
      message: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  });

  // Unknown order — acknowledge to stop Razorpay retries
  if (!donation) {
    return NextResponse.json({ received: true });
  }

  if (eventType === "payment.captured") {
    // Idempotency: already PAID, do not re-trigger Pusher
    if (donation.status === "PAID") {
      return NextResponse.json({ received: true });
    }

    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: "PAID",
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      },
    });

    try {
      await triggerSuperchat(donation.streamId, {
        id: updated.id,
        viewerName: updated.viewerName,
        message: updated.message,
        amount: updated.amount,
        currency: updated.currency,
        createdAt: updated.createdAt.toISOString(),
      });
    } catch (err) {
      // Pusher failure must NOT affect payment state
      console.error("[webhook/razorpay] Pusher trigger failed:", err);
    }
  } else if (eventType === "payment.failed") {
    // Only PENDING → FAILED
    if (donation.status === "PENDING") {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "FAILED" },
      });
    }
  } else if (eventType === "refund.processed") {
    // Only PAID → REFUNDED
    if (donation.status === "PAID") {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "REFUNDED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
