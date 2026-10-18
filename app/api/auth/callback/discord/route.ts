import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  createSessionToken,
  sessionCookieOptions,
  getBaseUrlSafe,
} from "@/lib/discord-auth-callback";

// re-export helpers inline to avoid circular issues
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

  const { exchangeCode, createSessionToken, sessionCookieOptions } = await import(
    "@/lib/discord-auth"
  );

  const result = await exchangeCode(code);

  if (!result.ok) {
    const msg = encodeURIComponent(result.error);
    const details = encodeURIComponent(JSON.stringify(result.details || {}));
    return NextResponse.redirect(`${root}/login?error=${msg}&details=${details}`);
  }

  const token = createSessionToken(result.user);
  const res = NextResponse.redirect(`${root}/dashboard`);
  const cookie = sessionCookieOptions(token);
  res.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
