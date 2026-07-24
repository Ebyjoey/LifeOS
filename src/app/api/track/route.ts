import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionToken, createSessionIfNeeded } from "@/lib/tracking/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activities, events, sessionData } = body;

    const sessionToken = getSessionToken(request);
    let session = await createSessionIfNeeded(sessionToken, request);

    if (!session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const activityResults = [];
      const eventResults = [];

      if (activities && activities.length > 0) {
        for (const activity of activities) {
          const result = await tx.activity.create({
            data: {
              userId: activity.userId || session.userId,
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
          activityResults.push(result);
        }
      }

      if (events && events.length > 0) {
        for (const event of events) {
          const result = await tx.event.create({
            data: {
              userId: event.userId || session.userId,
              sessionId: session.id,
              name: event.name,
              category: event.category,
              action: event.action,
              label: event.label,
              value: event.value,
              metadata: event.metadata,
              timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            },
          });
          eventResults.push(result);
        }
      }

      if (sessionData) {
        await tx.sessionData.upsert({
          where: { sessionToken: session.sessionToken },
          update: {
            ...sessionData,
            userId: sessionData.userId || session.userId,
            updatedAt: new Date(),
          },
          create: {
            sessionToken: session.sessionToken,
            userId: sessionData.userId || session.userId,
            ip: sessionData.ip,
            userAgent: sessionData.userAgent,
            referrer: sessionData.referrer,
            device: sessionData.device,
            browser: sessionData.browser,
            os: sessionData.os,
            country: sessionData.country,
            city: sessionData.city,
            startedAt: sessionData.startedAt ? new Date(sessionData.startedAt) : new Date(),
            isActive: true,
          },
        });
      }

      await tx.sessionData.update({
        where: { sessionToken: session.sessionToken },
        data: {
          pageViews: { increment: activities?.filter((a: any) => a.type === "PAGE_VIEW").length || 0 },
          eventsCount: { increment: events?.length || 0 },
          updatedAt: new Date(),
        },
      });

      return { activities: activityResults, events: eventResults };
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionToken = searchParams.get("sessionToken");

  if (!sessionToken) {
    return NextResponse.json({ error: "Session token required" }, { status: 400 });
  }

  const session = await prisma.sessionData.findUnique({
    where: { sessionToken },
    include: {
      pageViewsRel: { orderBy: { enteredAt: "desc" }, take: 50 },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}