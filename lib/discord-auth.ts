import { cookies } from "next/headers";
import crypto from "crypto";
import type { NextResponse } from "next/server";

export const COOKIE_NAME = "cr7_session";
const SESSION_DAYS = 30;

function getSecret() {
  const fromEnv = (process.env.NEXTAUTH_SECRET || "").trim();
  if (fromEnv.length >= 16) return fromEnv;
  return "cr7-ai-session-secret-v1-do-not-change";
}

export function getCallbackUrl(origin?: string) {
  const base = (
    origin ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/+$/, "");
  return `${base}/api/auth/callback/discord`;
}

export type SessionUser = {
  id: string;
  name: string;
  image: string | null;
  email?: string | null;
  /** Website-only display name (not Discord global) */
  siteName?: string | null;
  accessToken?: string | null;
};

function b64urlEncode(str: string) {
  return Buffer.from(str, "utf8").toString("base64url");
}

function b64urlDecode(str: string) {
  return Buffer.from(str, "base64url").toString("utf8");
}

export function createSessionToken(user: SessionUser): string {
  const body = JSON.stringify({
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email ?? null,
    siteName: user.siteName ?? null,
    // Keep token short — only store if fits; access tokens are long
    accessToken: user.accessToken ? user.accessToken.slice(0, 2000) : null,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  const payload = b64urlEncode(body);
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readSessionToken(token: string): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const i = token.lastIndexOf(".");
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!payload || !sig) return null;

  const secrets = [
    getSecret(),
    "cr7-ai-session-secret-v1-do-not-change",
    (process.env.DISCORD_CLIENT_SECRET || "").trim(),
  ].filter((s, idx, arr) => s && arr.indexOf(s) === idx);

  let valid = false;
  for (const s of secrets) {
    const expected = crypto.createHmac("sha256", s).update(payload).digest("base64url");
    try {
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        valid = true;
        break;
      }
    } catch {
      /* next */
    }
  }
  if (!valid) return null;

  try {
    const data = JSON.parse(b64urlDecode(payload));
    if (!data?.id || !data.exp) return null;
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return {
      id: String(data.id),
      name: String(data.name || "User"),
      image: data.image || null,
      email: data.email || null,
      siteName: data.siteName || null,
      accessToken: data.accessToken || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    let token = raw;
    try {
      token = decodeURIComponent(raw);
    } catch {
      token = raw;
    }
    return readSessionToken(token);
  } catch {
    return null;
  }
}

export function applySessionCookie(res: NextResponse, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  });
}

export function clearSessionCookieOn(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function getDiscordAuthUrl(state: string, origin: string) {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl(origin),
    response_type: "code",
    scope: "identify email guilds",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  origin: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string; details?: unknown }> {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
  const redirectUri = getCallbackUrl(origin);

  if (!clientId || !clientSecret) {
    return { ok: false, error: "Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET" };
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    return {
      ok: false,
      error: tokenJson.error || "token_exchange_failed",
      details: { discord_error: tokenJson, redirect_uri_used: redirectUri },
    };
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const userJson = await userRes.json();
  if (!userRes.ok) {
    return { ok: false, error: "failed_to_fetch_user", details: userJson };
  }

  const avatar = userJson.avatar
    ? `https://cdn.discordapp.com/avatars/${userJson.id}/${userJson.avatar}.png`
    : null;

  return {
    ok: true,
    user: {
      id: userJson.id,
      name: userJson.global_name || userJson.username,
      image: avatar,
      email: userJson.email || null,
      accessToken: tokenJson.access_token || null,
    },
  };
}

export const SERVER_ID =
  process.env.DISCORD_SERVER_ID ||
  process.env.NEXT_PUBLIC_DISCORD_SERVER_ID ||
  "1561418826128560300";

export const CHANNEL_ID = "1561419818576519299";
