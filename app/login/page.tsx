"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const detailsRaw = searchParams.get("details");
  let details: Record<string, unknown> | null = null;
  try {
    if (detailsRaw) details = JSON.parse(detailsRaw);
  } catch {
    details = null;
  }

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap">
        <main className="landing">
          <div className="card">
            <div className="logo">7</div>
            <h1>Login</h1>
            <p className="desc">Sign in with Discord to access your page</p>

            {error && (
              <div
                style={{
                  color: "#fca5a5",
                  fontSize: "0.8rem",
                  marginBottom: "1rem",
                  background: "rgba(248,113,113,0.12)",
                  padding: "0.85rem",
                  borderRadius: "10px",
                  textAlign: "left",
                  lineHeight: 1.55,
                  wordBreak: "break-word",
                }}
              >
                <strong>Error: {error}</strong>
                {details && (
                  <pre
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.7rem",
                      whiteSpace: "pre-wrap",
                      color: "#fecaca",
                    }}
                  >
                    {JSON.stringify(details, null, 2)}
                  </pre>
                )}
              </div>
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
              <Link href="/">← Back</Link>
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
