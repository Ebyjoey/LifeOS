import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/config";
import { SettingsContent } from "./SettingsContent";

export const metadata: Metadata = {
  title: "Settings | User Activity Monitor",
  description: "Manage your account and application settings",
};

export default async function SettingsPage() {
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

  return <SettingsContent user={user} />;
}