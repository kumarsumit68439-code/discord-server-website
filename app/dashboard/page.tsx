import { getSession } from "@/lib/discord-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MusicToggle from "@/components/MusicToggle";

const DISCORD_CHANNEL_URL =
  "https://discord.com/channels/1561418826128560300/1561419818576519299";
const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";
const API_KEYS_SITE = "https://clever-chat-keys.lovable.app/";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap profile-page">
        <div className="profile-card">
          <div className="profile-avatar-wrap">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} />
            ) : (
              <div className="placeholder">?</div>
            )}
            <span className="online-ring" />
          </div>

          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-bio">CR7 AI · API keys · Discord community</p>

          <div className="server-pill">
            <span className="icon">7</span>
            CR7 AI API KEY PROVIDER SERVER
          </div>

          <div className="link-stack">
            <a
              href={DISCORD_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn featured"
            >
              <span className="link-icon">💬</span>
              <span className="link-text">
                <span className="link-title">Open Discord Channel</span>
                <span className="link-sub">#ai-api-key-website-links</span>
              </span>
            </a>

            <Link href="/music" className="link-btn">
              <span className="link-icon">🎵</span>
              <span className="link-text">
                <span className="link-title">Music Search</span>
                <span className="link-sub">YouTube · Spotify · Amazon</span>
              </span>
            </Link>

            <a
              href={API_KEYS_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn"
            >
              <span className="link-icon">🔑</span>
              <span className="link-text">
                <span className="link-title">API Keys Website</span>
                <span className="link-sub">clever-chat-keys.lovable.app</span>
              </span>
            </a>

            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-btn"
            >
              <span className="link-icon">➕</span>
              <span className="link-text">
                <span className="link-title">Join Server Invite</span>
                <span className="link-sub">discord.gg/rGxv4Bfs8</span>
              </span>
            </a>
          </div>

          <Link href="/api/auth/signout" className="signout-link">
            Sign out
          </Link>
        </div>

        <p className="profile-footer">CR7 AI · One link for your server</p>
      </div>
      <MusicToggle />
    </>
  );
}
