import { NextResponse } from "next/server";

export async function GET() {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
  const nextAuthUrl = (process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");

  return NextResponse.json({
    has_DISCORD_CLIENT_ID: Boolean(clientId),
    client_id_length: clientId.length,
    client_id_is_numeric: /^\d+$/.test(clientId),
    client_id_preview: clientId ? `${clientId.slice(0, 4)}...${clientId.slice(-4)}` : null,
    has_DISCORD_CLIENT_SECRET: Boolean(clientSecret),
    client_secret_length: clientSecret.length,
    NEXTAUTH_URL: nextAuthUrl,
    expected_callback: nextAuthUrl ? `${nextAuthUrl}/api/auth/callback/discord` : null,
    has_NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
  });
}
