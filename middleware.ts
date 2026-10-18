import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "cr7_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const hasCookie = Boolean(token && token.length > 20);

  // Dashboard without cookie → home (never /login)
  if (pathname.startsWith("/dashboard") && !hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Home with cookie → dashboard (stay logged in)
  if (pathname === "/" && hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Never auto-redirect to /login from middleware
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/"],
};
