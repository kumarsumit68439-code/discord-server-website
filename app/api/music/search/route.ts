import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const source = req.nextUrl.searchParams.get("source") || "youtube";

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  if (source === "youtube") {
    return searchYouTube(q);
  }
  if (source === "spotify") {
    return searchSpotify(q);
  }
  if (source === "amazon") {
    return NextResponse.json({
      results: [],
      searchUrl: `https://music.amazon.com/search/${encodeURIComponent(q)}`,
    });
  }

  return NextResponse.json({ error: "Unknown source" }, { status: 400 });
}

type YTResult = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
};

async function searchYouTubeOfficial(q: string, key: string): Promise<YTResult[] | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);
  // Don't force category 10 — some keys/regions block it; music still ranks high

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (!res.ok) {
    console.error("YouTube API error:", data.error?.message || data);
    return null;
  }

  return (data.items || [])
    .map(
      (item: {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { medium?: { url: string }; default?: { url: string } };
        };
      }) => {
        const id = item.id?.videoId;
        if (!id) return null;
        return {
          id,
          title: item.snippet?.title || "Untitled",
          channel: item.snippet?.channelTitle || "",
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        } as YTResult;
      }
    )
    .filter(Boolean) as YTResult[];
}

const INVIDIOUS_HOSTS = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
  "https://invidious.fdn.fr",
  "https://vid.puffyan.us",
];

async function searchYouTubeFallback(q: string): Promise<YTResult[]> {
  for (const host of INVIDIOUS_HOSTS) {
    try {
      const res = await fetch(
        `${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) continue;
      const items = await res.json();
      if (!Array.isArray(items) || !items.length) continue;

      const results = items
        .slice(0, 12)
        .map(
          (item: {
            videoId?: string;
            title?: string;
            author?: string;
            videoThumbnails?: { url: string }[];
          }) => {
            const id = item.videoId;
            if (!id) return null;
            return {
              id,
              title: item.title || "Untitled",
              channel: item.author || "",
              thumbnail:
                item.videoThumbnails?.[0]?.url ||
                `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            } as YTResult;
          }
        )
        .filter(Boolean) as YTResult[];

      if (results.length) return results;
    } catch {
      /* try next host */
    }
  }
  return [];
}

async function searchYouTube(q: string) {
  const key = process.env.YOUTUBE_API_KEY?.trim();

  // 1) Official API if key present
  if (key) {
    const official = await searchYouTubeOfficial(q, key);
    if (official && official.length) {
      return NextResponse.json({ results: official, engine: "youtube-api" });
    }
  }

  // 2) Fallback (works when API is blocked / no key)
  const fallback = await searchYouTubeFallback(q);
  if (fallback.length) {
    return NextResponse.json({
      results: fallback,
      engine: "fallback",
      warning: key
        ? "YouTube API blocked — using fallback search. Fix API key restrictions in Google Cloud."
        : undefined,
    });
  }

  return NextResponse.json({
    results: [],
    error:
      "Search unavailable. Enable YouTube Data API v3 + remove key restrictions, or try again later.",
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  });
}

async function searchSpotify(q: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      results: [],
      warning:
        "Add SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in Vercel for in-app Spotify search.",
      searchUrl: `https://open.spotify.com/search/${encodeURIComponent(q)}`,
    });
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: tokenData.error_description || "Spotify auth failed" },
      { status: 502 }
    );
  }

  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=12&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  );
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    return NextResponse.json(
      { error: searchData.error?.message || "Spotify search failed" },
      { status: 502 }
    );
  }

  const results = (searchData.tracks?.items || []).map(
    (t: {
      id: string;
      name: string;
      artists: { name: string }[];
      album: { images: { url: string }[] };
      external_urls: { spotify: string };
      preview_url: string | null;
    }) => ({
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(", "),
      image: t.album.images[1]?.url || t.album.images[0]?.url || "",
      url: t.external_urls.spotify,
      preview_url: t.preview_url,
    })
  );

  return NextResponse.json({ results });
}
