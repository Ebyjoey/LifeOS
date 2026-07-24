import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, userId, sessionToken } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Events array required" }, { status: 400 });
    }

    let session = sessionToken
      ? await prisma.sessionData.findUnique({ where: { sessionToken } })
      : null;

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const event of events) {
        const result = await tx.event.create({
          data: {
            userId: event.userId || userId || session.userId,
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
        created.push(result);
      }

      await tx.sessionData.update({
        where: { id: session.id },
        data: { eventsCount: { increment: events.length }, updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Event tracking error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}