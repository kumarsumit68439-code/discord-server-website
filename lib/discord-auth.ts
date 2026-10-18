import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "cr7_session";

function getSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.DISCORD_CLIENT_SECRET || "fallback-secret";
}

function getBaseUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export function getCallbackUrl() {
  return `${getBaseUrl()}/api/auth/callback/discord`;
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
  if (sig !== expected) return null;
  return payload;
}

export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString(
    "base64url"
  );
  return sign(payload);
}

export function readSessionToken(token: string): SessionUser | null {
  const payload = verify(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, image: data.image || null, email: data.email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function getDiscordAuthUrl(state: string) {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl(),
    response_type: "code",
    scope: "identify email",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; details?: unknown }
> {
  const clientId = (process.env.DISCORD_CLIENT_ID || "").trim();
  const clientSecret = (process.env.DISCORD_CLIENT_SECRET || "").trim();
  const redirectUri = getCallbackUrl();

  if (!clientId || !clientSecret) {
    return { ok: false, error: "Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET in Vercel env" };
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
      details: {
        discord_error: tokenJson,
        redirect_uri_used: redirectUri,
        client_id_preview: `${clientId.slice(0, 4)}...${clientId.slice(-4)}`,
        client_secret_length: clientSecret.length,
      },
    };
  }

  const accessToken = tokenJson.access_token as string;

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
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
