import { NextRequest, NextResponse } from "next/server";
import { getSession, CHANNEL_ID, SERVER_ID } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const botToken = (process.env.DISCORD_BOT_TOKEN || "").trim();
  const channelId = req.nextUrl.searchParams.get("channel") || CHANNEL_ID;

  if (!botToken) {
    return NextResponse.json({
      botConfigured: false,
      messages: [],
      channelId,
      warning:
        "Add DISCORD_BOT_TOKEN in Vercel. Bot needs Read Message History in the channel.",
    });
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=25`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          botConfigured: true,
          messages: [],
          error: "Cannot read messages",
          details: text,
          channelId,
          serverId: SERVER_ID,
        },
        { status: 502 }
      );
    }

    const raw = await res.json();
    const messages = (Array.isArray(raw) ? raw : []).map(
      (m: {
        id: string;
        content: string;
        timestamp: string;
        author: { id: string; username: string; global_name?: string; avatar?: string };
      }) => ({
        id: m.id,
        content: m.content || "(embed/attachment)",
        timestamp: m.timestamp,
        author: {
          id: m.author.id,
          name: m.author.global_name || m.author.username,
          avatar: m.author.avatar
            ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png`
            : null,
        },
      })
    );

    return NextResponse.json({
      botConfigured: true,
      channelId,
      messages,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
