import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDiscordAuthUrl } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const state = crypto.randomBytes(16).toString("hex");
  const url = getDiscordAuthUrl(state, origin);

  const res = NextResponse.redirect(url);
  res.cookies.set({
    name: "oauth_state",
    value: state,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  // Remember which origin started login (for callback consistency)
  res.cookies.set({
    name: "oauth_origin",
    value: origin,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
