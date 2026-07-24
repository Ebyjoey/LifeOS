import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const metric = searchParams.get("metric") || "overview";

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case "24h":
        startDate = startOfDay(subDays(now, 1));
        break;
      case "7d":
        startDate = startOfDay(subDays(now, 7));
        break;
      case "30d":
        startDate = startOfDay(subDays(now, 30));
        break;
      case "90d":
        startDate = startOfDay(subDays(now, 90));
        break;
      default:
        startDate = startOfDay(subDays(now, 7));
    }

    const [totalUsers, newUsers, totalSessions, totalPageViews, totalEvents, avgSessionDuration, bounceRate] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.sessionData.count({ where: { startedAt: { gte: startDate, lte: endDate } } }),
      prisma.pageView.count({ where: { enteredAt: { gte: startDate, lte: endDate } } }),
      prisma.event.count({ where: { timestamp: { gte: startDate, lte: endDate } } }),
      prisma.sessionData.aggregate({
        where: { startedAt: { gte: startDate, lte: endDate }, duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.sessionData.count({ where: { startedAt: { gte: startDate, lte: endDate }, pageViews: 1, isActive: false } }),
    ]);

    const bounceRatePercent = totalSessions > 0 ? (bounceRate / totalSessions) * 100 : 0;

    let timeSeriesData: any[] = [];
    if (metric === "overview" || metric === "timeseries") {
      const days = period === "24h" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const groupBy = period === "24h" ? "hour" : "day";

      if (groupBy === "hour") {
        const hourly = await prisma.hourlyMetric.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        });
        timeSeriesData = hourly.map((h) => ({
          timestamp: h.date,
          activeUsers: h.activeUsers,
          sessions: h.totalSessions,
          pageViews: h.totalPageViews,
          events: h.totalEvents,
        }));
      } else {
        const daily = await prisma.dailyMetric.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        });
        timeSeriesData = daily.map((d) => ({
          timestamp: d.date,
          totalUsers: d.totalUsers,
          newUsers: d.newUsers,
          sessions: d.totalSessions,
          pageViews: d.totalPageViews,
          events: d.totalEvents,
          avgSessionDuration: d.avgSessionDuration,
          bounceRate: d.bounceRate,
        }));
      }
    }

    let topPages: any[] = [];
    let topEvents: any[] = [];
    let topCountries: any[] = [];
    let topBrowsers: any[] = [];
    let topDevices: any[] = [];

    if (metric === "overview" || metric === "top") {
      const [pages, events, countries, browsers, devices] = await Promise.all([
        prisma.activity.groupBy({
          by: ["page"],
          where: { type: "PAGE_VIEW", timestamp: { gte: startDate, lte: endDate }, page: { not: null } },
          _count: { page: true },
          orderBy: { _count: { page: "desc" } },
          take: 10,
        }),
        prisma.event.groupBy({
          by: ["name"],
          where: { timestamp: { gte: startDate, lte: endDate } },
          _count: { name: true },
          orderBy: { _count: { name: "desc" } },
          take: 10,
        }),
        prisma.sessionData.groupBy({
          by: ["country"],
          where: { startedAt: { gte: startDate, lte: endDate }, country: { not: null } },
          _count: { country: true },
          orderBy: { _count: { country: "desc" } },
          take: 10,
        }),
        prisma.sessionData.groupBy({
          by: ["browser"],
          where: { startedAt: { gte: startDate, lte: endDate }, browser: { not: null } },
          _count: { browser: true },
          orderBy: { _count: { browser: "desc" } },
          take: 10,
        }),
        prisma.sessionData.groupBy({
          by: ["device"],
          where: { startedAt: { gte: startDate, lte: endDate }, device: { not: null } },
          _count: { device: true },
          orderBy: { _count: { device: "desc" } },
          take: 10,
        }),
      ]);

      topPages = pages.map((p) => ({ page: p.page!, count: p._count.page }));
      topEvents = events.map((e) => ({ event: e.name, count: e._count.name }));
      topCountries = countries.map((c) => ({ country: c.country!, count: c._count.country }));
      topBrowsers = browsers.map((b) => ({ browser: b.browser!, count: b._count.browser }));
      topDevices = devices.map((d) => ({ device: d.device!, count: d._count.device }));
    }

    return NextResponse.json({
      period,
      startDate,
      endDate,
      overview: {
        totalUsers,
        newUsers,
        returningUsers: totalUsers - newUsers,
        totalSessions,
        totalPageViews,
        totalEvents,
        avgSessionDuration: avgSessionDuration._avg.duration || 0,
        bounceRate: bounceRatePercent,
      },
      timeSeries: timeSeriesData,
      topPages,
      topEvents,
      topCountries,
      topBrowsers,
      topDevices,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}