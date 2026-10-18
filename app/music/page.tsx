"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

type Source = "youtube" | "spotify" | "amazon";

type YTItem = { id: string; title: string; channel: string; thumbnail: string };
type SpotifyItem = {
  id: string;
  name: string;
  artists: string;
  image: string;
  url: string;
  preview_url: string | null;
};

export default function MusicPage() {
  const [source, setSource] = useState<Source>("youtube");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ytResults, setYtResults] = useState<YTItem[]>([]);
  const [spResults, setSpResults] = useState<SpotifyItem[]>([]);
  const [activeYt, setActiveYt] = useState<string | null>(null);
  const [activeSp, setActiveSp] = useState<string | null>(null);
  const [amazonQuery, setAmazonQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d.authenticated)))
      .catch(() => setLoggedIn(false));
  }, []);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setYtResults([]);
    setSpResults([]);

    try {
      if (source === "amazon") {
        setAmazonQuery(q);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(q)}&source=${source}`,
        { credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      if (source === "youtube") {
        setYtResults(data.results || []);
        setActiveYt(data.results?.[0]?.id || null);
      } else {
        setSpResults(data.results || []);
        setActiveSp(data.results?.[0]?.id || null);
      }
      if (data.warning) setError(data.warning);
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }, [query, source]);

  const playPreview = (url: string | null) => {
    if (audioPreview) {
      audioPreview.pause();
      setAudioPreview(null);
    }
    if (!url) return;
    const a = new Audio(url);
    a.play();
    setAudioPreview(a);
    a.onended = () => setAudioPreview(null);
  };

  return (
    <>
      <div className="bg-scene" />
      <div className="page-wrap music-page">
        <header className="music-header">
          <Link href="/" className="music-back" prefetch={false}>
            ← Home
          </Link>
          <h1 className="music-title">Music</h1>
          <span style={{ fontSize: "0.8rem", color: "#71717a" }}>
            {loggedIn ? "Signed in" : "Guest"}
          </span>
        </header>

        <div className="music-tabs">
          {(["youtube", "spotify", "amazon"] as Source[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`music-tab${source === s ? " active" : ""}`}
              onClick={() => {
                setSource(s);
                setError("");
                setYtResults([]);
                setSpResults([]);
                setActiveYt(null);
                setActiveSp(null);
                setAmazonQuery("");
              }}
            >
              {s === "youtube" ? "YouTube" : s === "spotify" ? "Spotify" : "Amazon Music"}
            </button>
          ))}
        </div>

        <form
          className="music-search"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs..."
            className="music-input"
          />
          <button type="submit" className="music-search-btn" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>

        {error && <p className="music-error">{error}</p>}

        {source === "youtube" && activeYt && (
          <div className="music-player">
            <iframe
              title="YouTube"
              src={`https://www.youtube.com/embed/${activeYt}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {source === "spotify" && activeSp && (
          <div className="music-player spotify">
            <iframe
              title="Spotify"
              src={`https://open.spotify.com/embed/track/${activeSp}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>
        )}

        {source === "amazon" && amazonQuery && (
          <div className="music-player amazon">
            <iframe
              title="Amazon Music"
              src={`https://music.amazon.com/search/${encodeURIComponent(amazonQuery)}`}
              allow="autoplay; encrypted-media; fullscreen"
            />
            <a
              className="btn primary full"
              style={{ marginTop: "0.75rem" }}
              href={`https://music.amazon.com/search/${encodeURIComponent(amazonQuery)}`}
              target="_self"
            >
              Open Amazon in this tab
            </a>
          </div>
        )}

        <div className="music-results">
          {source === "youtube" &&
            ytResults.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`music-result${activeYt === item.id ? " active" : ""}`}
                onClick={() => setActiveYt(item.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt="" className="music-thumb" />
                <div className="music-meta">
                  <div className="music-track">{item.title}</div>
                  <div className="music-artist">{item.channel}</div>
                </div>
                <span className="music-play-icon">▶</span>
              </button>
            ))}

          {source === "spotify" &&
            spResults.map((item) => (
              <div key={item.id} className={`music-result${activeSp === item.id ? " active" : ""}`}>
                <button type="button" className="music-result-main" onClick={() => setActiveSp(item.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" className="music-thumb" />
                  <div className="music-meta">
                    <div className="music-track">{item.name}</div>
                    <div className="music-artist">{item.artists}</div>
                  </div>
                </button>
                <div className="music-result-actions">
                  {item.preview_url && (
                    <button type="button" className="mini-btn" onClick={() => playPreview(item.preview_url)}>
                      30s
                    </button>
                  )}
                  <a href={item.url} target="_self" className="mini-btn">
                    Open
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
