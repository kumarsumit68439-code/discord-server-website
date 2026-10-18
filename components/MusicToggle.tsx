"use client";

import { useEffect, useRef, useState } from "react";

export default function MusicToggle() {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Soft ambient loop (royalty-free style placeholder via data URI silence avoided — use external optional)
    // Users can replace with their own track URL later
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
    );
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (on) {
      audio.pause();
      setOn(false);
    } else {
      try {
        await audio.play();
        setOn(true);
      } catch {
        setOn(false);
      }
    }
  };

  return (
    <button
      type="button"
      className={`music-btn${on ? " on" : ""}`}
      onClick={toggle}
      aria-label={on ? "Mute music" : "Play music"}
      title={on ? "Mute" : "Play ambient music"}
    >
      {on ? "🔊" : "🎵"}
    </button>
  );
}
