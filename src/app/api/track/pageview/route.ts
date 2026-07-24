import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageViews, userId, sessionToken } = body;

    if (!pageViews || !Array.isArray(pageViews) || pageViews.length === 0) {
      return NextResponse.json({ error: "PageViews array required" }, { status: 400 });
    }

    let session = sessionToken
      ? await prisma.sessionData.findUnique({ where: { sessionToken } })
      : null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const pv of pageViews) {
        const result = await tx.pageView.create({
          data: {
            sessionId: session.id,
            userId: pv.userId || userId || session.userId,
            path: pv.path,
            title: pv.title,
            referrer: pv.referrer,
            duration: pv.duration,
            enteredAt: pv.enteredAt ? new Date(pv.enteredAt) : new Date(),
            exitedAt: pv.exitedAt ? new Date(pv.exitedAt) : null,
            metadata: pv.metadata,
          },
        });
        created.push(result);
      }

      await tx.sessionData.update({
        where: { id: session.id },
        data: { pageViews: { increment: pageViews.length }, updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("PageView tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}