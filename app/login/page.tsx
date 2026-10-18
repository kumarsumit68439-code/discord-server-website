"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap">
        <main className="landing">
          <div className="card">
            <div className="logo">7</div>
            <h1>Login with Discord</h1>
            <p className="desc">Authorize to open your CR7 AI dashboard</p>

            {error && (
              <p className="music-error" style={{ marginBottom: "1rem" }}>
                Error: {error}
              </p>
            )}

            <a
              href="/api/auth/discord"
              className="btn primary full"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
              }}
            >
              Continue with Discord
            </a>

            <p className="or" style={{ marginTop: "1.25rem" }}>
              <Link href="/">← Home</Link>
              {" · "}
              <Link href="/music">Music</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="landing">
          <div className="card">
            <p className="desc">Loading...</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
