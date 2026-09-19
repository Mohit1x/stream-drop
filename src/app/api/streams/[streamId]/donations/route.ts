import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { NextResponse } from "next/server";

const MIN_AMOUNT = 1;      // ₹1
const MAX_AMOUNT = 100000; // ₹1,00,000
const MAX_NAME_LEN = 100;
const MAX_MSG_LEN = 500;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;

  const stream = await prisma.stream.findUnique({ where: { id: streamId }, select: { id: true } });
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

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

  return NextResponse.json(donations);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const { streamId } = await params;

  const stream = await prisma.stream.findUnique({ where: { id: streamId }, select: { id: true } });
  if (!stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { viewerName, message, amount } = body as Record<string, unknown>;

  // Validate viewerName
  if (!viewerName || typeof viewerName !== "string" || viewerName.trim().length === 0) {
    return NextResponse.json({ error: "viewerName is required" }, { status: 400 });
  }
  if (viewerName.trim().length > MAX_NAME_LEN) {
    return NextResponse.json({ error: `viewerName must be ${MAX_NAME_LEN} characters or less` }, { status: 400 });
  }

  // Validate message
  if (message !== undefined && message !== null) {
    if (typeof message !== "string") {
      return NextResponse.json({ error: "message must be a string" }, { status: 400 });
    }
    if (message.trim().length > MAX_MSG_LEN) {
      return NextResponse.json({ error: `message must be ${MAX_MSG_LEN} characters or less` }, { status: 400 });
    }
  }

  // Validate amount
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || !Number.isInteger(parsedAmount)) {
    return NextResponse.json({ error: "amount must be a whole number" }, { status: 400 });
  }
  if (parsedAmount < MIN_AMOUNT) {
    return NextResponse.json({ error: `Minimum donation is ₹${MIN_AMOUNT}` }, { status: 400 });
  }
  if (parsedAmount > MAX_AMOUNT) {
    return NextResponse.json({ error: `Maximum donation is ₹${MAX_AMOUNT}` }, { status: 400 });
  }

  // Create PENDING donation first
  const donation = await prisma.donation.create({
    data: {
      streamId,
      viewerName: viewerName.trim(),
      message: typeof message === "string" ? message.trim() || null : null,
      amount: parsedAmount,
      currency: "INR",
      status: "PENDING",
    },
  });

  // Create Razorpay order (amount in paise)
  let order;
  try {
    console.log("[donations] Using Razorpay key:", process.env.RAZORPAY_KEY_ID);
    order = await razorpay.orders.create({
      amount: parsedAmount * 100, // paise
      currency: "INR",
      receipt: donation.id,
    });
  } catch (err) {
    // Roll back the donation if order creation fails
    await prisma.donation.delete({ where: { id: donation.id } });
    console.error("[donations/POST] Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Payment provider error. Please try again." }, { status: 502 });
  }

  // Store Razorpay order ID on the donation
  await prisma.donation.update({
    where: { id: donation.id },
    data: { razorpayOrderId: order.id },
  });

  return NextResponse.json(
    {
      donationId: donation.id,
      orderId: order.id,
      amount: parsedAmount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
    { status: 201 }
  );
}
