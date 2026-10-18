import { NextRequest, NextResponse } from "next/server";

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

async function searchYouTube(q: string) {
  const key = process.env.YOUTUBE_API_KEY?.trim();

  if (key) {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "12");
    url.searchParams.set("q", q);
    url.searchParams.set("key", key);
    url.searchParams.set("videoCategoryId", "10"); // Music

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || "YouTube API error",
          searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        },
        { status: 502 }
      );
    }

    const results = (data.items || []).map(
      (item: {
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
      }) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url ||
          "",
      })
    );

    return NextResponse.json({ results });
  }

  // Fallback without API key: use YouTube oEmbed-style discovery via Invidious-compatible public search
  // Try a public Invidious instance for search (no key needed)
  try {
    const inv = await fetch(
      `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
      { next: { revalidate: 60 } }
    );
    if (inv.ok) {
      const items = await inv.json();
      const results = (Array.isArray(items) ? items : [])
        .slice(0, 12)
        .map(
          (item: {
            videoId: string;
            title: string;
            author: string;
            videoThumbnails?: { url: string }[];
          }) => ({
            id: item.videoId,
            title: item.title,
            channel: item.author,
            thumbnail:
              item.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
          })
        )
        .filter((r: { id: string }) => r.id);

      if (results.length) {
        return NextResponse.json({ results });
      }
    }
  } catch {
    /* fall through */
  }

  // Last resort: return empty + external link hint
  return NextResponse.json({
    results: [],
    warning:
      "No YouTube API key set. Add YOUTUBE_API_KEY in Vercel for search, or open YouTube directly.",
    searchUrl: `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
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
