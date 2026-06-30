"use client";

import { useEffect, useRef } from "react";

// hls.js'i CDN'den (npm bağımlılığı yok) bir kez yükler — .m3u8 yayınları için.
function loadHls(): Promise<any> {
  const w = window as any;
  if (w.Hls) return Promise.resolve(w.Hls);
  if (w.__hlsLoading) return w.__hlsLoading;
  w.__hlsLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    s.async = true;
    s.onload = () => resolve(w.Hls);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return w.__hlsLoading;
}

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// Yalnız http(s) şemasına izin ver — javascript:/data:/blob: gibi şemaların
// <video>.src'ye ulaşmasını engelle (savunma derinliği).
function safeMediaUrl(url: string): string | null {
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export function LivePlayer({ url, poster }: { url: string; poster?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const yt = youtubeId(url);
  const vimeo = !yt ? vimeoId(url) : null;
  const isHls = /\.m3u8(\?|$)/i.test(url);

  useEffect(() => {
    if (yt || vimeo) return;
    const video = videoRef.current;
    if (!video) return;
    const safe = safeMediaUrl(url);
    if (!safe) return; // güvensiz şema — oynatma deneme
    let hls: any;
    if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
      loadHls()
        .then((Hls) => {
          if (Hls.isSupported()) {
            hls = new Hls({ lowLatencyMode: true });
            hls.loadSource(safe);
            hls.attachMedia(video);
          } else {
            video.src = safe;
          }
        })
        .catch(() => {
          video.src = safe;
        });
    } else {
      video.src = safe; // Safari native HLS veya mp4
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [url, isHls, yt, vimeo]);

  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
          title="Canlı yayın"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  if (vimeo) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          className="h-full w-full"
          src={`https://player.vimeo.com/video/${vimeo}?autoplay=1`}
          title="Canlı yayın"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        poster={poster || undefined}
        controls
        autoPlay
        playsInline
        className="h-full w-full"
      />
    </div>
  );
}
