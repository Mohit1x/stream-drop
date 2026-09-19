import { prisma } from "@/lib/prisma";
import { triggerSuperchat } from "@/lib/pusher-server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { donationId, razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    body as Record<string, unknown>;

  if (
    typeof donationId !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find donation and verify it belongs to the claimed order
  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    select: {
      id: true,
      streamId: true,
      status: true,
      razorpayOrderId: true,
      viewerName: true,
      message: true,
      amount: true,
      currency: true,
      createdAt: true,
    },
  });

  if (!donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  // Ensure the order ID matches what we stored — never trust the frontend
  if (donation.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order ID mismatch" }, { status: 400 });
  }

  // Idempotency: already PAID, return success without re-triggering
  if (donation.status === "PAID") {
    return NextResponse.json({ success: true });
  }

  // Verify Razorpay signature server-side
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Mark PAID and store payment ID
  const updated = await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: "PAID",
      razorpayPaymentId: razorpay_payment_id,
    },
  });

  // Trigger Pusher — only fires because we just transitioned PENDING → PAID
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
    // Pusher failure must NOT roll back the payment state
    console.error("[verify] Pusher trigger failed:", err);
  }

  return NextResponse.json({ success: true });
}
