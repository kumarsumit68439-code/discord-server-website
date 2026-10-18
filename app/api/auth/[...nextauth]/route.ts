import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth reads NEXTAUTH_URL directly — trailing slash breaks Discord OAuth
if (process.env.NEXTAUTH_URL?.endsWith("/")) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/\/+$/, "");
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
