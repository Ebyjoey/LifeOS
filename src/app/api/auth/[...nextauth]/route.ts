import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

export const { GET, POST } = NextAuth(authOptions);