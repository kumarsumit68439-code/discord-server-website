import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// Ensure no trailing slash (Discord requires exact redirect_uri match)
if (typeof process !== "undefined" && process.env.NEXTAUTH_URL?.endsWith("/")) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/\/+$/, "");
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: (process.env.DISCORD_CLIENT_ID || "").trim(),
      clientSecret: (process.env.DISCORD_CLIENT_SECRET || "").trim(),
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const p = profile as {
          id?: string;
          username?: string;
          global_name?: string;
          image_url?: string;
        };
        token.id = p.id;
        token.name = p.global_name || p.username || token.name;
        if (p.image_url) token.picture = p.image_url;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = (token.name as string) || session.user.name;
        session.user.image = (token.picture as string) || session.user.image;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const root = baseUrl.replace(/\/+$/, "");
      if (url.startsWith("/")) return `${root}/dashboard`;
      try {
        if (new URL(url).origin === new URL(root).origin) return url;
      } catch {
        /* ignore */
      }
      return `${root}/dashboard`;
    },
  },
};
