"use client";

import { useRef, useState } from "react";
import { Play, Pause, Radio, Loader2 } from "lucide-react";

/** Ücretsiz internet radyoları — hepsi HTTPS, tarayıcıda <audio> ile çalar. */
const STATIONS = [
  { name: "Dance Wave", tag: "house · electronic", color: "#22D3EE", url: "https://stream.dancewave.online/dance.mp3" },
  { name: "Metro FM", tag: "pop · hit", color: "#A855F7", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3" },
  { name: "Joy FM", tag: "lounge · yabancı", color: "#F472B6", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3" },
  { name: "Virgin Radio", tag: "pop", color: "#FB7185", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3" },
  { name: "Süper FM", tag: "türkçe pop", color: "#34D399", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM.mp3" },
];

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function audio() {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.volume = 0.6;
      a.onplaying = () => { setPlaying(true); setLoading(false); };
      a.onpause = () => setPlaying(false);
      a.onwaiting = () => setLoading(true);
      a.onerror = () => { setLoading(false); setPlaying(false); };
      audioRef.current = a;
    }
    return audioRef.current;
  }

  function play(i: number) {
    const a = audio();
    setIdx(i);
    setLoading(true);
    a.src = STATIONS[i].url;
    a.play().catch(() => { setLoading(false); setPlaying(false); });
  }

  function toggle() {
    const a = audio();
    if (playing) {
      a.pause();
    } else {
      if (!a.src) a.src = STATIONS[idx].url;
      setLoading(true);
      a.play().catch(() => { setLoading(false); setPlaying(false); });
    }
  }

  const st = STATIONS[idx];

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {open && (
        <div className="mb-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-black/80 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md">
          {STATIONS.map((s, i) => (
            <button
              key={s.name}
              onClick={() => play(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                i === idx ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white/90">{s.name}</span>
                <span className="block truncate text-[11px] text-white/40">{s.tag}</span>
              </span>
              {i === idx && playing && (
                <span className="flex h-3.5 items-end gap-[2px]">
                  {[0, 1, 2].map((b) => (
                    <span key={b} className="w-[2px] rounded-full" style={{ height: 5 + b * 3, background: s.color, animation: `lucaEq .9s ${b * 0.15}s ease-in-out infinite alternate` }} />
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 py-1.5 pl-1.5 pr-3 backdrop-blur-md">
        <button
          onClick={toggle}
          aria-label={playing ? "Durdur" : "Çal"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black transition-transform active:scale-95"
          style={{ background: st.color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          <span className="leading-tight">
            <span className="block text-xs text-white/90">{st.name}</span>
            <span className="block text-[10px] uppercase tracking-wider text-white/40">
              {playing ? "● canlı" : "radyo"}
            </span>
          </span>
          <Radio className="h-4 w-4 text-white/40" />
        </button>
      </div>

      <style>{`@keyframes lucaEq{from{transform:scaleY(.4)}to{transform:scaleY(1)}}`}</style>
    </div>
  );
}
