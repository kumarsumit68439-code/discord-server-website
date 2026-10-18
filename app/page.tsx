import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const DISCORD_CHANNEL_URL =
  "https://discord.com/channels/1561418826128560300/1561419818576519299";
const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Logged in → seedha Discord channel pe bhejo
  if (session) {
    redirect(DISCORD_CHANNEL_URL);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          padding: "3rem 2.5rem",
          maxWidth: "520px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "#E11D48",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "2rem",
            fontWeight: 800,
          }}
        >
          7
        </div>

        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem", fontWeight: 700 }}>
          CR7 AI API KEY PROVIDER SERVER
        </h1>

        <p style={{ color: "#b9bbbe", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
          AI API keys · Real endpoints · One-click access
        </p>

        <p style={{ color: "#72767d", marginBottom: "2rem", lineHeight: 1.6, fontSize: "0.9rem" }}>
          Login with Discord to open the server channel and get API key website links.
        </p>

        <Link
          href="/api/auth/signin"
          style={{
            display: "inline-block",
            background: "#5865F2",
            color: "white",
            padding: "0.95rem 2rem",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "1.05rem",
            marginBottom: "1rem",
          }}
        >
          Login with Discord
        </Link>

        <p style={{ color: "#72767d", fontSize: "0.85rem", marginTop: "1rem" }}>
          or{" "}
          <a
            href={DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00AFF4" }}
          >
            join server directly
          </a>
        </p>
      </div>

      <p style={{ marginTop: "2.5rem", color: "#72767d", fontSize: "0.85rem" }}>
        Invite: {DISCORD_INVITE}
      </p>
    </main>
  );
}
