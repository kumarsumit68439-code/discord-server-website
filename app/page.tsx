import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="landing">
      <div className="card">
        <div className="logo">7</div>
        <h1>CR7 AI API KEY PROVIDER</h1>
        <p className="desc">
          Login with Discord to open your dashboard and access the server.
        </p>
        <Link href="/login" className="btn primary full">
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
