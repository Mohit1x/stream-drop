import { razorpay } from "@/lib/razorpay";
import { NextResponse } from "next/server";

// DEBUG ONLY - Remove before production
export async function GET() {
  try {
    // Create a test order and inspect it
    const order = await razorpay.orders.create({
      amount: 100, // ₹1 in paise
      currency: "INR",
      receipt: "debug_test_" + Date.now(),
    });

    // Fetch the order back to see all details
    const fetchedOrder = await razorpay.orders.fetch(order.id);

    return NextResponse.json({
      message: "Debug info",
      env: {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
        NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        keysMatch: process.env.RAZORPAY_KEY_ID === process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        keyPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 8),
      },
      createdOrder: order,
      fetchedOrder: fetchedOrder,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
