"use client";

import { useEffect, useRef, useState } from "react";
import { listenToGreeting } from "./actions";

function toAudioUrl(mp3Base64: string): string {
  const bytes = Uint8Array.from(atob(mp3Base64), (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
}

// Plays a voice reading a text; each (voice, text) is fetched once, then replayed from memory.
export function useGreetingPlayer() {
  const cache = useRef(new Map<string, string>());
  const audio = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const urls = cache.current;
    return () => {
      audio.current?.pause();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function stop() {
    audio.current?.pause();
    setPlaying(null);
  }

  async function play(voiceId: string, intro: string) {
    const key = `${voiceId}|${intro}`;
    if (playing === key) return stop();
    stop();
    setError(undefined);

    let url = cache.current.get(key);
    if (!url) {
      setLoading(key);
      const result = await listenToGreeting(voiceId, intro);
      setLoading(null);
      if ("error" in result) return setError(result.error);
      url = toAudioUrl(result.mp3Base64);
      cache.current.set(key, url);
    }

    const player = new Audio(url);
    audio.current = player;
    player.onended = () => setPlaying(null);
    setPlaying(key);
    await player.play().catch(() => setPlaying(null));
  }

  const stateOf = (voiceId: string, intro: string) => {
    const key = `${voiceId}|${intro}`;
    return loading === key ? "loading" : playing === key ? "playing" : "idle";
  };

  return { play, stateOf, error };
}
