import { NextResponse } from "next/server";
import { getSession } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
