import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  createSessionToken,
  applySessionCookie,
  type SessionUser,
} from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json({
    user: {
      id: session.id,
      name: session.name,
      siteName: session.siteName || session.name,
      image: session.image,
      email: session.email,
    },
  });
}

/** Save website display name (customize on this site) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const siteName = String(body.siteName || "").trim().slice(0, 32);
  if (!siteName) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const updated: SessionUser = {
    ...session,
    siteName,
  };

  const token = createSessionToken(updated);
  const res = NextResponse.json({ ok: true, siteName });
  applySessionCookie(res, token);
  return res;
}
