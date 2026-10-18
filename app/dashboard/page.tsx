import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const DISCORD_CHANNEL_URL =
  "https://discord.com/channels/1561418826128560300/1561419818576519299";
const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";
const API_KEYS_SITE = "https://clever-chat-keys.lovable.app/";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="dash-root">
      {/* Top bar */}
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-logo">7</span>
          <span className="dash-brand-text">CR7 AI Dashboard</span>
        </div>
        <div className="dash-header-right">
          <div className="dash-user-chip">
            {user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="dash-chip-avatar" />
            )}
            <span>{user?.name}</span>
          </div>
          <Link href="/api/auth/signout" className="dash-signout">
            Sign out
          </Link>
        </div>
      </header>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <nav className="dash-nav">
            <a href="#overview" className="dash-nav-item active">
              Overview
            </a>
            <a
              href={DISCORD_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-nav-item"
            >
              Discord Channel
            </a>
            <a
              href={API_KEYS_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-nav-item"
            >
              API Keys Site
            </a>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="dash-nav-item"
            >
              Invite Link
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="dash-main">
          <section id="overview" className="dash-section">
            <h1 className="dash-title">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
            <p className="dash-subtitle">
              You are logged in with Discord. Manage your server links and API access from here.
            </p>

            {/* Profile card */}
            <div className="dash-grid">
              <div className="dash-card profile-card">
                <div className="profile-row">
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="avatar" className="profile-avatar" />
                  ) : (
                    <div className="profile-avatar placeholder">?</div>
                  )}
                  <div>
                    <div className="profile-name">{user?.name}</div>
                    <div className="profile-email">{user?.email || "Discord account"}</div>
                    <div className="profile-status">
                      <span className="status-dot" /> Online · Discord connected
                    </div>
                  </div>
                </div>
              </div>

              {/* Server card */}
              <div className="dash-card">
                <div className="card-label">Your Server</div>
                <div className="server-row">
                  <div className="server-icon">7</div>
                  <div>
                    <div className="server-name">CR7 AI API KEY PROVIDER SERVER</div>
                    <div className="server-channel">#ai-api-key-website-links</div>
                  </div>
                </div>
                <a
                  href={DISCORD_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dash-btn primary"
                >
                  Open Channel →
                </a>
              </div>

              {/* Quick actions */}
              <div className="dash-card">
                <div className="card-label">Quick Actions</div>
                <div className="action-list">
                  <a
                    href={DISCORD_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-item"
                  >
                    <span className="action-icon">💬</span>
                    <div>
                      <div className="action-title">Discord Channel</div>
                      <div className="action-desc">API key website links</div>
                    </div>
                  </a>
                  <a
                    href={API_KEYS_SITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-item"
                  >
                    <span className="action-icon">🔑</span>
                    <div>
                      <div className="action-title">API Keys Website</div>
                      <div className="action-desc">clever-chat-keys.lovable.app</div>
                    </div>
                  </a>
                  <a
                    href={DISCORD_INVITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-item"
                  >
                    <span className="action-icon">➕</span>
                    <div>
                      <div className="action-title">Invite Friends</div>
                      <div className="action-desc">discord.gg/rGxv4Bfs8</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Stats placeholders */}
              <div className="dash-card stats-card">
                <div className="card-label">Server Snapshot</div>
                <div className="stats-row">
                  <div className="stat">
                    <div className="stat-value">1</div>
                    <div className="stat-label">Online</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">1</div>
                    <div className="stat-label">Members</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">AI</div>
                    <div className="stat-label">Focus</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
