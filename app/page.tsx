import { getSession } from "@/lib/discord-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MusicToggle from "@/components/MusicToggle";

const DISCORD_INVITE = "https://discord.gg/rGxv4Bfs8";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap">
        <main className="landing">
          <div className="card">
            <div className="logo">7</div>
            <h1>CR7 AI API KEY PROVIDER</h1>
            <p className="desc">
              One clean login. Real AI API keys. Discord community.
            </p>
            <Link href="/login" className="btn primary full">
              Login with Discord
            </Link>
            <p className="or">
              <Link href="/music" style={{ color: "#818cf8" }}>
                Music Search
              </Link>
              {" · "}
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                join server
              </a>
            </p>
          </div>
        </main>
      </div>
      <MusicToggle />
    </>
  );
}
