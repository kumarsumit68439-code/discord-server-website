import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/discord-auth";

function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export async function GET() {
  const res = NextResponse.redirect(`${baseUrl()}/`);
  const c = clearSessionCookie();
  res.cookies.set(c.name, c.value, {
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
    path: c.path,
    maxAge: c.maxAge,
  });
  return res;
}

export async function POST() {
  return GET();
}
