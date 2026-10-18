import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDiscordAuthUrl } from "@/lib/discord-auth";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");
  const url = getDiscordAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return res;
}
