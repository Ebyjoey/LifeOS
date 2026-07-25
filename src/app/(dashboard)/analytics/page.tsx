import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { AnalyticsContent } from "./AnalyticsContent";

export const metadata: Metadata = {
  title: "Analytics | User Activity Monitor",
  description: "Detailed analytics and reports",
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true },
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return <AnalyticsContent user={user} />;
}