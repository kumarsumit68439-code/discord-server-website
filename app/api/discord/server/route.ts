import { NextResponse } from "next/server";
import { getSession, SERVER_ID } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const botToken = (process.env.DISCORD_BOT_TOKEN || "").trim();

  // User guilds via OAuth token (if present)
  let userGuilds: unknown[] = [];
  if (session.accessToken) {
    try {
      const gRes = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (gRes.ok) {
        userGuilds = await gRes.json();
      }
    } catch {
      /* ignore */
    }
  }

  if (!botToken) {
    return NextResponse.json({
      botConfigured: false,
      serverId: SERVER_ID,
      userGuilds,
      warning:
        "Add DISCORD_BOT_TOKEN in Vercel to load live server channels & member count. Bot must be invited to your server.",
      guild: null,
      channels: [],
    });
  }

  try {
    const [guildRes, channelsRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${SERVER_ID}?with_counts=true`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
      fetch(`https://discord.com/api/v10/guilds/${SERVER_ID}/channels`, {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }),
    ]);

    const guild = guildRes.ok ? await guildRes.json() : null;
    const channelsRaw = channelsRes.ok ? await channelsRes.json() : [];
    const channels = (Array.isArray(channelsRaw) ? channelsRaw : [])
      .filter((c: { type: number }) => c.type === 0 || c.type === 5) // text / announcement
      .map((c: { id: string; name: string; type: number }) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));

    return NextResponse.json({
      botConfigured: true,
      serverId: SERVER_ID,
      userGuilds,
      guild: guild
        ? {
            id: guild.id,
            name: guild.name,
            icon: guild.icon
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
              : null,
            memberCount: guild.approximate_member_count,
            onlineCount: guild.approximate_presence_count,
          }
        : null,
      channels,
      guildError: guildRes.ok ? null : await guildRes.text(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch server", details: String(e) },
      { status: 502 }
    );
  }
}
