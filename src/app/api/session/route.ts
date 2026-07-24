import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionTokenFromHeaders, createSessionIfNeeded, associateUserWithSession, endSession } from "@/lib/tracking/session";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionTokenFromHeaders(request.headers);
    const session = await createSessionIfNeeded(sessionToken, request);

    if (!session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const body = await request.json();
    const { userId, metadata } = body;

    if (userId && session.userId !== userId) {
      await associateUserWithSession(session.sessionToken, userId);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        userId: session.userId,
        startedAt: session.startedAt,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, userId, endedAt, metadata } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    const session = await endSession(sessionToken, userId, endedAt ? new Date(endedAt) : undefined);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = getSessionTokenFromHeaders(request.headers);
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Session token required" }, { status: 400 });
    }

    const session = await prisma.sessionData.findUnique({
      where: { sessionToken },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        pageViewsRel: { orderBy: { enteredAt: "desc" }, take: 50 },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}