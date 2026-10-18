"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type Source = "youtube" | "spotify" | "amazon";

type YTItem = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
};

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
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setYtResults([]);
    setSpResults([]);

    try {
      if (source === "amazon") {
        window.open(
          `https://music.amazon.com/search/${encodeURIComponent(q)}`,
          "_blank"
        );
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/music/search?q=${encodeURIComponent(q)}&source=${source}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed");
        if (data.searchUrl) {
          // fallback external
        }
        setLoading(false);
        return;
      }

      if (source === "youtube") {
        setYtResults(data.results || []);
        if (data.results?.[0]) setActiveYt(data.results[0].id);
      } else if (source === "spotify") {
        setSpResults(data.results || []);
        if (data.results?.[0]) setActiveSp(data.results[0].id);
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
          <Link href="/" className="music-back">
            ← Home
          </Link>
          <h1 className="music-title">Music</h1>
          <Link href="/dashboard" className="music-back">
            Dashboard
          </Link>
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
              }}
            >
              {s === "youtube" && "YouTube"}
              {s === "spotify" && "Spotify"}
              {s === "amazon" && "Amazon Music"}
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
            placeholder={
              source === "youtube"
                ? "Search songs, artists on YouTube..."
                : source === "spotify"
                  ? "Search on Spotify..."
                  : "Search on Amazon Music..."
            }
            className="music-input"
          />
          <button type="submit" className="music-search-btn" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>

        {error && <p className="music-error">{error}</p>}

        {/* YouTube player */}
        {source === "youtube" && activeYt && (
          <div className="music-player">
            <iframe
              title="YouTube player"
              src={`https://www.youtube.com/embed/${activeYt}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Spotify embed */}
        {source === "spotify" && activeSp && (
          <div className="music-player spotify">
            <iframe
              title="Spotify player"
              src={`https://open.spotify.com/embed/track/${activeSp}?utm_source=generator`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}

        {/* Results */}
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
              <div
                key={item.id}
                className={`music-result${activeSp === item.id ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="music-result-main"
                  onClick={() => setActiveSp(item.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" className="music-thumb" />
                  <div className="music-meta">
                    <div className="music-track">{item.name}</div>
                    <div className="music-artist">{item.artists}</div>
                  </div>
                </button>
                <div className="music-result-actions">
                  {item.preview_url && (
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => playPreview(item.preview_url)}
                    >
                      30s
                    </button>
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mini-btn"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}

          {source === "amazon" && (
            <p className="music-hint">
              Amazon Music search opens in a new tab. Type a song and press Search.
            </p>
          )}

          {!loading &&
            source === "youtube" &&
            ytResults.length === 0 &&
            !error && (
              <p className="music-hint">
                Search any track — results play here via YouTube embed.
                <br />
                <span style={{ opacity: 0.7 }}>
                  Optional: set YOUTUBE_API_KEY in Vercel for richer search.
                </span>
              </p>
            )}
        </div>

        <p className="music-footer">
          YouTube embeds · Spotify embeds · Amazon search links
        </p>
      </div>
    </>
  );
}
