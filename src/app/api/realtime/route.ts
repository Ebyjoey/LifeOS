import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const limit = parseInt(searchParams.get("limit") || "100");

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60 * 1000);

    const [recentActivities, recentEvents, recentPageViews, activeUsers] = await Promise.all([
      prisma.activity.findMany({
        where: { timestamp: { gte: sinceDate } },
        orderBy: { timestamp: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          session: { select: { id: true, sessionToken: true } },
        },
      }),
      prisma.event.findMany({
        where: { timestamp: { gte: sinceDate } },
        orderBy: { timestamp: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          session: { select: { id: true, sessionToken: true } },
        },
      }),
      prisma.pageView.findMany({
        where: { enteredAt: { gte: sinceDate } },
        orderBy: { enteredAt: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          session: { select: { id: true, sessionToken: true } },
        },
      }),
      prisma.sessionData.findMany({
        where: { isActive: true, startedAt: { gte: sinceDate } },
        select: { id: true, sessionToken: true, userId: true, country: true, city: true, device: true, browser: true, startedAt: true, pageViews: true },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      activities: recentActivities,
      events: recentEvents,
      pageViews: recentPageViews,
      activeUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Realtime fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch realtime data" }, { status: 500 });
  }
}