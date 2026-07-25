import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export interface SessionInfo {
  id: string;
  sessionToken: string;
  userId?: string;
  startedAt: Date;
  isActive: boolean;
}

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["session_token"] || cookies["sessionToken"] || null;
}

export function getSessionTokenFromHeaders(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["session_token"] || cookies["sessionToken"] || null;
}

export async function createSessionIfNeeded(
  sessionToken: string | null,
  request: Request
): Promise<SessionInfo | null> {
  let token = sessionToken;

  if (!token) {
    token = randomBytes(32).toString("hex");
  }

  let session = await prisma.sessionData.findUnique({
    where: { sessionToken: token },
  });

  if (!session) {
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";
    const ip = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { device, browser, os } = parseUserAgent(userAgent);

    session = await prisma.sessionData.create({
      data: {
        sessionToken: token,
        ip,
        userAgent,
        referrer,
        device,
        browser,
        os,
        startedAt: new Date(),
        isActive: true,
      },
    });

    await prisma.session.create({
      data: {
        sessionToken: token,
        userId: "",
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else if (!session.isActive) {
    await prisma.sessionData.update({
      where: { sessionToken: token },
      data: { isActive: true, endedAt: null, updatedAt: new Date() },
    });
  }

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    userId: session.userId || undefined,
    startedAt: session.startedAt,
    isActive: session.isActive,
  };
}

export async function associateUserWithSession(
  sessionToken: string,
  userId: string
): Promise<void> {
  await prisma.sessionData.update({
    where: { sessionToken },
    data: { userId, updatedAt: new Date() },
  });

  await prisma.session.updateMany({
    where: { sessionToken },
    data: { userId },
  });
}

export async function endSession(sessionToken: string, userId?: string, endedAt?: Date): Promise<void> {
  const session = await prisma.sessionData.findUnique({
    where: { sessionToken },
  });

  if (session && session.isActive) {
    const endTime = endedAt || new Date();
    const duration = Math.floor(
      (endTime.getTime() - session.startedAt.getTime()) / 1000
    );

    await prisma.sessionData.update({
      where: { sessionToken },
      data: {
        isActive: false,
        endedAt: endTime,
        duration,
        ...(userId ? { userId } : {}),
        updatedAt: new Date(),
      },
    });
  }
}

function parseUserAgent(userAgent: string): {
  device: string;
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  let device = "Desktop";
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    device = /ipad/i.test(ua) ? "Tablet" : "Mobile";
  }

  let browser = "Unknown";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";
  else if (ua.includes("opera/") || ua.includes("opr/")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { device, browser, os };
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function setSessionCookie(response: Response, token: string): void {
  response.headers.set(
    "Set-Cookie",
    `session_token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`
  );
}

export function clearSessionCookie(response: Response): void {
  response.headers.set(
    "Set-Cookie",
    "session_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/"
  );
}