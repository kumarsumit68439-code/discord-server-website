import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookieOn } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const res = NextResponse.redirect(`${origin}/`);
  clearSessionCookieOn(res);
  return res;
}

export async function POST(req: NextRequest) {
  return GET(req);
}
