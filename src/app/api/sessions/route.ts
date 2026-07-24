import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "startedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "ended") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { sessionToken: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { ip: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.startedAt = {};
      if (dateFrom) where.startedAt.gte = new Date(dateFrom);
      if (dateTo) where.startedAt.lte = new Date(dateTo);
    }

    const [sessions, total] = await Promise.all([
      prisma.sessionData.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, image: true } },
          pageViewsRel: { orderBy: { enteredAt: "desc" }, take: 5 },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.sessionData.count({ where }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionToken, action } = body;

    if (!sessionToken || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "end") {
      const sessionData = await prisma.sessionData.findUnique({
        where: { sessionToken },
      });

      if (!sessionData) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (sessionData.isActive) {
        const duration = Math.floor((Date.now() - sessionData.startedAt.getTime()) / 1000);

        await prisma.sessionData.update({
          where: { sessionToken },
          data: {
            isActive: false,
            endedAt: new Date(),
            duration,
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Session PATCH error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}