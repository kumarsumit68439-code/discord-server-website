import { NextResponse } from "next/server";
import { getSession, SERVER_ID } from "@/lib/discord-auth";

export const dynamic = "force-dynamic";

/** Permissions: View Channel + Read Message History + Send Messages + Manage Channels (optional view) */
const BOT_PERMISSIONS = "68608"; // View + Read History + Send

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const botToken = (process.env.DISCORD_BOT_TOKEN || "").trim();
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const serverId = SERVER_ID;

  const inviteUrl = clientId
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands&guild_id=${serverId}`
    : null;

  if (!botToken) {
    return NextResponse.json({
      configured: false,
      online: false,
      clientId: clientId || null,
      serverId,
      inviteUrl,
      steps: [
        "Discord Developer Portal → your Application → Bot → Add Bot",
        "Reset Token → copy token",
        "Vercel → Environment Variable DISCORD_BOT_TOKEN = token → Redeploy",
        "Open invite URL below → add bot to CR7 AI server",
        "Channel settings → allow bot Read Message History",
      ],
    });
  }

  try {
    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return NextResponse.json({
        configured: true,
        online: false,
        error: "Invalid bot token",
        clientId,
        serverId,
        inviteUrl,
      });
    }

    const me = await meRes.json();

    const guildRes = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}?with_counts=true`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    const inGuild = guildRes.ok;
    const guild = inGuild ? await guildRes.json() : null;

    return NextResponse.json({
      configured: true,
      online: true,
      bot: {
        id: me.id,
        username: me.username,
        avatar: me.avatar
          ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png`
          : null,
      },
      inGuild,
      guild: guild
        ? {
            id: guild.id,
            name: guild.name,
            memberCount: guild.approximate_member_count,
            onlineCount: guild.approximate_presence_count,
            icon: guild.icon
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
              : null,
          }
        : null,
      clientId,
      serverId,
      inviteUrl,
      guildError: inGuild ? null : "Bot is not in the server — use invite URL",
    });
  } catch (e) {
    return NextResponse.json({
      configured: true,
      online: false,
      error: String(e),
      inviteUrl,
      serverId,
    });
  }
}
