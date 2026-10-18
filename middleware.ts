import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "cr7_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const hasSession = Boolean(token && token.length > 20);

  // Only protect dashboard. Never send users to login from Home/Music.
  if (pathname.startsWith("/dashboard") && !hasSession) {
    // Soft landing — home, not login page
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logged-in users opening / go to dashboard
  if (pathname === "/" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/"],
};
