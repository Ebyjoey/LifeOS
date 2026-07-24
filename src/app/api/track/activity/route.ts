import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activities, userId, sessionToken } = body;

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return NextResponse.json({ error: "Activities array required" }, { status: 400 });
    }

    let session = sessionToken 
      ? await prisma.sessionData.findUnique({ where: { sessionToken } })
      : null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const activity of activities) {
        const result = await tx.activity.create({
          data: {
            userId: activity.userId || userId || session.userId,
            sessionId: session.id,
            type: activity.type,
            page: activity.page,
            element: activity.element,
            elementType: activity.elementType,
            x: activity.x,
            y: activity.y,
            scrollX: activity.scrollX,
            scrollY: activity.scrollY,
            viewportWidth: activity.viewportWidth,
            viewportHeight: activity.viewportHeight,
            referrer: activity.referrer,
            userAgent: activity.userAgent,
            metadata: activity.metadata,
            timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
          },
        });
        created.push(result);
      }

      const pageViewCount = activities.filter((a) => a.type === "PAGE_VIEW").length;
      if (pageViewCount > 0) {
        await tx.sessionData.update({
          where: { id: session.id },
          data: { pageViews: { increment: pageViewCount }, updatedAt: new Date() },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Activity tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}