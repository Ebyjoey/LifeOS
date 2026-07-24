import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/config";
import { SessionsContent } from "./SessionsContent";

export const metadata: Metadata = {
  title: "Sessions | User Activity Monitor",
  description: "View and manage user sessions",
};

export default async function SessionsPage() {
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

  return <SessionsContent user={user} />;
}