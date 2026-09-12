import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.user.count();
    return Response.json({ ok: true, userCount: count });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
