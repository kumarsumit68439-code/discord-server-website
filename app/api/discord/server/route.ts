import { NextResponse } from "next/server";
import { getSession, SERVER_ID } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const botToken = (process.env.DISCORD_BOT_TOKEN || "").trim();
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const inviteUrl = clientId
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=68608&scope=bot&guild_id=${SERVER_ID}`
    : null;

  let userGuilds: { id: string; name: string }[] = [];
  if (session.accessToken) {
    try {
      const gRes = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (gRes.ok) {
        const list = await gRes.json();
        userGuilds = (Array.isArray(list) ? list : []).map(
          (g: { id: string; name: string }) => ({ id: g.id, name: g.name })
        );
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
      inviteUrl,
      warning: "DISCORD_BOT_TOKEN missing in Vercel. Add bot token and redeploy.",
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

    if (!guildRes.ok) {
      return NextResponse.json({
        botConfigured: true,
        serverId: SERVER_ID,
        userGuilds,
        inviteUrl,
        warning: "Bot token OK but bot not in server (or no access). Use invite link.",
        guild: null,
        channels: [],
      });
    }

    const guild = await guildRes.json();
    const channelsRaw = channelsRes.ok ? await channelsRes.json() : [];
    const channels = (Array.isArray(channelsRaw) ? channelsRaw : [])
      .filter((c: { type: number }) => c.type === 0 || c.type === 5)
      .map((c: { id: string; name: string; type: number }) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }));

    return NextResponse.json({
      botConfigured: true,
      serverId: SERVER_ID,
      userGuilds,
      inviteUrl,
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
        memberCount: guild.approximate_member_count,
        onlineCount: guild.approximate_presence_count,
      },
      channels,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch server", details: String(e) },
      { status: 502 }
    );
  }
}
