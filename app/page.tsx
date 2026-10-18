import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

const DISCORD_CHANNEL_URL =
  "https://discord.com/channels/1561418826128560300/1561419818576519299";
const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";
const API_KEYS_SITE = "https://clever-chat-keys.lovable.app/";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // ========== LOGGED IN: Dashboard (iuno-style) ==========
  if (session) {
    const user = session.user;
    return (
      <main className="dashboard">
        <div className="card">
          <div className="avatar-wrap">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="avatar" className="avatar" />
            ) : (
              <div className="avatar placeholder">?</div>
            )}
            <div className="online-dot" />
          </div>

          <h1 className="username">{user?.name || "Discord User"}</h1>
          <p className="tagline">Welcome to CR7 AI API KEY PROVIDER</p>

          <div className="server-badge">
            <span className="badge-icon">7</span>
            <div>
              <div className="badge-title">CR7 AI API KEY PROVIDER SERVER</div>
              <div className="badge-sub">#ai-api-key-website-links</div>
            </div>
          </div>

          <div className="links">
            <a
              href={DISCORD_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn primary"
            >
              Open Server Channel →
            </a>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
            >
              Discord Invite
            </a>
            <a
              href={API_KEYS_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary"
            >
              API Keys Website
            </a>
          </div>

          <Link href="/api/auth/signout" className="signout">
            Sign out
          </Link>
        </div>

        <p className="footer">iuno-style · Discord OAuth · CR7 AI</p>
      </main>
    );
  }

  // ========== NOT LOGGED IN: Landing ==========
  return (
    <main className="landing">
      <div className="card">
        <div className="logo">7</div>
        <h1>CR7 AI API KEY PROVIDER</h1>
        <p className="desc">
          One clean login. Real AI API keys. Discord community.
        </p>
        <Link href="/api/auth/signin" className="btn primary full">
          Login with Discord
        </Link>
        <p className="or">
          or{" "}
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            join server directly
          </a>
        </p>
      </div>
    </main>
  );
}
