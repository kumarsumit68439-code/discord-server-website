"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MusicToggle from "@/components/MusicToggle";

type User = {
  id: string;
  name: string;
  siteName: string;
  image: string | null;
  email: string | null;
};

type Tab = "overview" | "profile" | "server" | "messages" | "bot";

const DISCORD_CHANNEL_URL =
  "https://discord.com/channels/1561418826128560300/1561419818576519299";
const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";

export default function DashboardClient({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [siteName, setSiteName] = useState(user.siteName);
  const [saveMsg, setSaveMsg] = useState("");
  const [serverData, setServerData] = useState<{
    botConfigured?: boolean;
    warning?: string;
    inviteUrl?: string | null;
    guild?: {
      name: string;
      icon: string | null;
      memberCount?: number;
      onlineCount?: number;
    } | null;
    channels?: { id: string; name: string }[];
    userGuilds?: { id: string; name: string }[];
  } | null>(null);
  const [botStatus, setBotStatus] = useState<{
    configured?: boolean;
    online?: boolean;
    bot?: { username: string; avatar: string | null };
    inGuild?: boolean;
    guild?: { name: string; memberCount?: number };
    inviteUrl?: string | null;
    steps?: string[];
    error?: string;
    guildError?: string;
  } | null>(null);
  const [messages, setMessages] = useState<
    {
      id: string;
      content: string;
      timestamp: string;
      author: { name: string; avatar: string | null };
    }[]
  >([]);
  const [msgWarning, setMsgWarning] = useState("");
  const [loadingServer, setLoadingServer] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [loadingBot, setLoadingBot] = useState(false);

  const loadServer = () => {
    setLoadingServer(true);
    fetch("/api/discord/server", { credentials: "include" })
      .then((r) => r.json())
      .then(setServerData)
      .catch(() => setServerData({ warning: "Failed to load" }))
      .finally(() => setLoadingServer(false));
  };

  const loadMessages = () => {
    setLoadingMsg(true);
    fetch("/api/discord/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setMsgWarning(d.warning || d.error || "");
      })
      .catch(() => setMsgWarning("Failed to load messages"))
      .finally(() => setLoadingMsg(false));
  };

  const loadBot = () => {
    setLoadingBot(true);
    fetch("/api/discord/bot-status", { credentials: "include" })
      .then((r) => r.json())
      .then(setBotStatus)
      .catch(() => setBotStatus({ error: "Failed to load bot status" }))
      .finally(() => setLoadingBot(false));
  };

  useEffect(() => {
    if (tab === "server") loadServer();
    if (tab === "messages") loadMessages();
    if (tab === "bot") loadBot();
  }, [tab]);

  const saveProfile = async () => {
    setSaveMsg("Saving...");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ siteName }),
    });
    const data = await res.json();
    if (res.ok) setSaveMsg("Saved on this website ✓");
    else setSaveMsg(data.error || "Failed");
  };

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap dash-app">
        <header className="dash-top">
          <div className="dash-brand">
            <span className="dash-logo">7</span>
            <span>CR7 AI</span>
          </div>
          <div className="dash-top-right">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="dash-mini-av" />
            )}
            <span className="dash-mini-name">{siteName}</span>
            <Link href="/api/auth/signout" className="dash-signout">
              Sign out
            </Link>
          </div>
        </header>

        <nav className="dash-tabs">
          {(
            [
              ["overview", "Overview"],
              ["profile", "Profile"],
              ["bot", "Bot Setup"],
              ["server", "Server"],
              ["messages", "Messages"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`dash-tab${tab === id ? " active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="dash-panel">
          {tab === "overview" && (
            <div className="dash-section">
              <h2>Welcome, {siteName}</h2>
              <p className="muted">Discord linked · bot can power Server & Messages</p>
              <div className="dash-cards">
                <a href={DISCORD_CHANNEL_URL} target="_blank" rel="noreferrer" className="link-btn featured">
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
                <button type="button" className="link-btn" onClick={() => setTab("bot")} style={{ width: "100%", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
                  <span className="link-icon">🤖</span>
                  <span className="link-text">
                    <span className="link-title">Discord Bot Setup</span>
                    <span className="link-sub">Connect bot for live server data</span>
                  </span>
                </button>
              </div>
              <div className="info-box">
                <div><strong>Discord ID:</strong> {user.id}</div>
                <div><strong>Discord name:</strong> {user.name}</div>
                {user.email && <div><strong>Email:</strong> {user.email}</div>}
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="dash-section">
              <h2>Profile</h2>
              <p className="muted">Website display name (Discord global name Discord app se change hota hai)</p>
              <div className="profile-edit">
                {user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="profile-big" />
                )}
                <label className="field-label">Display name</label>
                <input
                  className="music-input"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  maxLength={32}
                />
                <button type="button" className="btn primary" onClick={saveProfile}>
                  Save
                </button>
                {saveMsg && <p className="save-msg">{saveMsg}</p>}
              </div>
            </div>
          )}

          {tab === "bot" && (
            <div className="dash-section">
              <h2>Discord Bot Integration</h2>
              {loadingBot && <p className="muted">Checking bot...</p>}
              {botStatus && (
                <>
                  <div className="info-box" style={{ marginBottom: "1rem" }}>
                    <div>
                      <strong>Token in Vercel:</strong>{" "}
                      {botStatus.configured ? "Yes ✓" : "No — add DISCORD_BOT_TOKEN"}
                    </div>
                    <div>
                      <strong>Bot online:</strong>{" "}
                      {botStatus.online ? "Yes ✓" : "No"}
                    </div>
                    {botStatus.bot && (
                      <div>
                        <strong>Bot user:</strong> {botStatus.bot.username}
                      </div>
                    )}
                    <div>
                      <strong>In your server:</strong>{" "}
                      {botStatus.inGuild ? "Yes ✓" : "No — invite bot"}
                    </div>
                    {botStatus.guild && (
                      <div>
                        <strong>Server:</strong> {botStatus.guild.name} (
                        {botStatus.guild.memberCount ?? "?"} members)
                      </div>
                    )}
                    {botStatus.error && (
                      <div style={{ color: "#fca5a5" }}>{botStatus.error}</div>
                    )}
                    {botStatus.guildError && (
                      <div style={{ color: "#fca5a5" }}>{botStatus.guildError}</div>
                    )}
                  </div>

                  {botStatus.steps && (
                    <ol className="ch-list" style={{ listStyle: "decimal", paddingLeft: "1.25rem" }}>
                      {botStatus.steps.map((s, i) => (
                        <li key={i} style={{ marginBottom: "0.4rem" }}>
                          {s}
                        </li>
                      ))}
                    </ol>
                  )}

                  {botStatus.inviteUrl && (
                    <a
                      href={botStatus.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn primary"
                      style={{ marginTop: "1rem", display: "inline-flex" }}
                    >
                      Invite Bot to Server →
                    </a>
                  )}

                  <p className="muted small" style={{ marginTop: "1rem" }}>
                    Vercel env: <code>DISCORD_BOT_TOKEN</code> = bot token from Developer Portal → Bot
                  </p>

                  <button type="button" className="btn primary" onClick={loadBot} style={{ marginTop: 12 }}>
                    Refresh status
                  </button>
                </>
              )}
            </div>
          )}

          {tab === "server" && (
            <div className="dash-section">
              <h2>Server manager</h2>
              {loadingServer && <p className="muted">Loading...</p>}
              {serverData?.warning && <p className="music-error">{serverData.warning}</p>}
              {serverData?.inviteUrl && !serverData.guild && (
                <a href={serverData.inviteUrl} target="_blank" rel="noreferrer" className="btn primary" style={{ marginBottom: 12, display: "inline-flex" }}>
                  Invite Bot →
                </a>
              )}
              {serverData?.guild && (
                <div className="server-card">
                  {serverData.guild.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={serverData.guild.icon} alt="" className="server-icon-img" />
                  )}
                  <div>
                    <div className="server-name">{serverData.guild.name}</div>
                    <div className="muted">
                      Members: {serverData.guild.memberCount ?? "—"} · Online:{" "}
                      {serverData.guild.onlineCount ?? "—"}
                    </div>
                  </div>
                </div>
              )}
              {serverData?.channels && serverData.channels.length > 0 && (
                <>
                  <h3 className="subh">Text channels</h3>
                  <ul className="ch-list">
                    {serverData.channels.map((c) => (
                      <li key={c.id}>
                        #{c.name} <span className="muted small">{c.id}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {serverData?.userGuilds && serverData.userGuilds.length > 0 && (
                <>
                  <h3 className="subh">Your Discord servers</h3>
                  <ul className="ch-list">
                    {serverData.userGuilds.slice(0, 15).map((g) => (
                      <li key={g.id}>{g.name}</li>
                    ))}
                  </ul>
                </>
              )}
              <button type="button" className="btn primary" onClick={loadServer} style={{ marginTop: 12 }}>
                Refresh
              </button>
            </div>
          )}

          {tab === "messages" && (
            <div className="dash-section">
              <h2>Channel messages</h2>
              <p className="muted">Live from bot · needs DISCORD_BOT_TOKEN + Read History</p>
              {loadingMsg && <p className="muted">Loading...</p>}
              {msgWarning && <p className="music-error">{msgWarning}</p>}
              <div className="msg-list">
                {messages.map((m) => (
                  <div key={m.id} className="msg-item">
                    {m.author.avatar && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.author.avatar} alt="" className="msg-av" />
                    )}
                    <div>
                      <div className="msg-head">
                        <strong>{m.author.name}</strong>{" "}
                        <span className="muted small">
                          {new Date(m.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="msg-body">{m.content}</div>
                    </div>
                  </div>
                ))}
                {!loadingMsg && messages.length === 0 && !msgWarning && (
                  <p className="muted">No messages yet</p>
                )}
              </div>
              <button type="button" className="btn primary" onClick={loadMessages} style={{ marginTop: 12 }}>
                Refresh messages
              </button>
              <p className="muted small" style={{ marginTop: 8 }}>
                <a href={DISCORD_CHANNEL_URL} target="_blank" rel="noreferrer">
                  Open channel in Discord
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
      <MusicToggle />
    </>
  );
}
