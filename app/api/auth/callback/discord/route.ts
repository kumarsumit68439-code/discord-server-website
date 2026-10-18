import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  createSessionToken,
  applySessionCookie,
} from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;
  const oauthOrigin = req.cookies.get("oauth_origin")?.value;
  const origin = (oauthOrigin || req.nextUrl.origin).replace(/\/+$/, "");

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  // State mismatch: still try login if code present (some browsers drop cookies)
  if (state && storedState && state !== storedState) {
    console.warn("oauth state mismatch");
  }

  const result = await exchangeCode(code, origin);

  if (!result.ok) {
    const msg = encodeURIComponent(result.error);
    return NextResponse.redirect(`${origin}/?error=${msg}`);
  }

  const token = createSessionToken(result.user);
  const res = NextResponse.redirect(`${origin}/dashboard`);
  applySessionCookie(res, token);
  res.cookies.set({ name: "oauth_state", value: "", path: "/", maxAge: 0 });
  res.cookies.set({ name: "oauth_origin", value: "", path: "/", maxAge: 0 });
  return res;
}
