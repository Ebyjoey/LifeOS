import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/config";
import { SessionsContent } from "./SessionsContent";

export const metadata: Metadata = {
  title: "Sessions | User Activity Monitor",
  description: "View and manage user sessions",
};

export default async function SessionsPage() {
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

  return <SessionsContent user={user} />;
}