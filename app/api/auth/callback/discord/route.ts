import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

function baseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const storedState = req.cookies.get("oauth_state")?.value;

  const root = baseUrl();

  if (error) {
    return NextResponse.redirect(`${root}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${root}/login?error=missing_code`);
  }

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${root}/login?error=invalid_state`);
  }

  const result = await exchangeCode(code);

  if (!result.ok) {
    const msg = encodeURIComponent(result.error);
    const details = encodeURIComponent(JSON.stringify(result.details || {}));
    return NextResponse.redirect(`${root}/login?error=${msg}&details=${details}`);
  }

  const token = createSessionToken(result.user);
  const cookie = sessionCookieOptions(token);

  // Set cookie on redirect response so browser stores it before loading dashboard
  const res = NextResponse.redirect(`${root}/dashboard`);
  res.cookies.set({
    name: cookie.name,
    value: cookie.value,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
    expires: cookie.expires,
  });
  res.cookies.set({
    name: "oauth_state",
    value: "",
    path: "/",
    maxAge: 0,
  });

  return res;
}
