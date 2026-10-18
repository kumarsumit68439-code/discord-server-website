import { cookies } from "next/headers";
import crypto from "crypto";

export const COOKIE_NAME = "cr7_session";
const SESSION_DAYS = 30;

function getSecret() {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.DISCORD_CLIENT_SECRET ||
    "cr7-fallback-secret-change-me"
  ).trim();
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
};

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${h}`;
}

function verify(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return payload;
}

export function createSessionToken(user: SessionUser): string {
  const body = {
    id: user.id,
    name: user.name,
    image: user.image,
    email: user.email ?? null,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return sign(payload);
}

export function readSessionToken(token: string): SessionUser | null {
  if (!token || token.length < 10) return null;
  const payload = verify(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data?.id || !data.exp || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return {
      id: String(data.id),
      name: String(data.name || "User"),
      image: data.image || null,
      email: data.email || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return readSessionToken(token);
  } catch {
    return null;
  }
}

export function applySessionCookie(res: { cookies: { set: (args: Record<string, unknown>) => void } }, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
  });
}

export function clearSessionCookieOn(res: { cookies: { set: (args: Record<string, unknown>) => void } }) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
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
    scope: "identify email",
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
    },
  };
}
