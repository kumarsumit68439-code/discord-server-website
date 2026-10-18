import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export async function GET() {
  const res = NextResponse.redirect(`${baseUrl()}/`);
  const c = clearSessionCookie();
  res.cookies.set({
    name: c.name,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

export async function POST() {
  return GET();
}
