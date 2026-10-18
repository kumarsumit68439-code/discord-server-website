import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

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
            background: "#5865F2",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "2.5rem",
          }}
        >
          💬
        </div>

        <h1 style={{ fontSize: "2rem", marginBottom: "0.75rem", fontWeight: 700 }}>
          Welcome to Our Discord Server
        </h1>

        <p style={{ color: "#b9bbbe", marginBottom: "2rem", lineHeight: 1.6 }}>
          Join our community, make friends, chat, and have fun together.
          We are waiting for you!
        </p>

        {session ? (
          <div>
            <p style={{ marginBottom: "1rem", color: "#57F287" }}>
              Logged in as <strong>{session.user?.name}</strong>
            </p>
            <a
              href="https://discord.gg/rGxv4Bfs8"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#5865F2",
                color: "white",
                padding: "0.9rem 2rem",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "1.05rem",
                transition: "transform 0.15s, background 0.15s",
              }}
            >
              Join the Server →
            </a>
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/api/auth/signout"
                style={{ color: "#b9bbbe", fontSize: "0.9rem" }}
              >
                Sign out
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <Link
              href="/api/auth/signin"
              style={{
                display: "inline-block",
                background: "#5865F2",
                color: "white",
                padding: "0.9rem 2rem",
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
                href="https://discord.gg/rGxv4Bfs8"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#00AFF4" }}
              >
                join directly
              </a>
            </p>
          </div>
        )}
      </div>

      <p style={{ marginTop: "2.5rem", color: "#72767d", fontSize: "0.85rem" }}>
        Invite: https://discord.gg/rGxv4Bfs8
      </p>
    </main>
  );
}