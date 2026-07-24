import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/config";
import { EventsContent } from "./EventsContent";

export const metadata: Metadata = {
  title: "Events | User Activity Monitor",
  description: "Track and analyze user events",
};

export default async function EventsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true, role: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return <EventsContent user={user} />;
}