"use client";

import { useRef, useState } from "react";
import { Music, Pause } from "lucide-react";

// YouTube kanalının "uploads" playlist'i (UC… → UU…). İstersen sabit bir
// playlist id ile değiştir. Tarayıcı autoplay politikası gereği ilk tıklamada başlar.
const PLAYLIST = "UU212vA0OA6FuaEGJaAVpvJw";
const VOLUME = 14; // kısık

let apiPromise: Promise<any> | null = null;
function loadApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    w.onYouTubeIframeAPIReady = () => resolve(w.YT);
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function BackgroundMusic() {
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!playerRef.current) {
      setLoading(true);
      const YT = await loadApi();
      playerRef.current = new YT.Player("luca-bg-music", {
        height: "0",
        width: "0",
        playerVars: { listType: "playlist", list: PLAYLIST, autoplay: 1, loop: 1, controls: 0 },
        events: {
          onReady: (e: any) => {
            e.target.setShuffle(true);
            e.target.setVolume(VOLUME);
            e.target.playVideo();
            setLoading(false);
            setPlaying(true);
          },
          onStateChange: (e: any) => setPlaying(e.data === YT.PlayerState.PLAYING),
        },
      });
      return;
    }
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  return (
    <>
      <div id="luca-bg-music" aria-hidden className="pointer-events-none fixed -left-[9999px] h-0 w-0" />
      <button
        onClick={toggle}
        aria-label="Arka plan müziği"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs text-white/85 backdrop-blur-md transition-colors hover:bg-black/70"
      >
        {playing ? (
          <span className="flex h-4 items-end gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-[#22c9b8]"
                style={{ height: 6 + i * 3, animation: `lucaEq 0.9s ${i * 0.15}s ease-in-out infinite alternate` }}
              />
            ))}
          </span>
        ) : (
          <Music className="h-4 w-4" />
        )}
        {loading ? "Yükleniyor…" : playing ? "Müzik açık" : "Müzik"}
      </button>
      <style>{`@keyframes lucaEq{from{transform:scaleY(.4)}to{transform:scaleY(1)}}`}</style>
    </>
  );
}
