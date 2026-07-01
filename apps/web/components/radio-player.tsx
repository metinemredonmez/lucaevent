"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, Radio, Loader2, Search, X, ChevronDown, ChevronUp } from "lucide-react";

type Station = { name: string; tag: string; color: string; url: string };

/** Sabit favoriler — hepsi HTTPS, test edildi. */
const FAVORITES: Station[] = [
  { name: "I Love Dance", tag: "house · electronic", color: "#22D3EE", url: "https://streams.ilovemusic.de/iloveradio2.mp3" },
  { name: "Metro FM", tag: "pop · hit", color: "#A855F7", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3" },
  { name: "Joy FM", tag: "lounge · yabancı", color: "#F472B6", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3" },
  { name: "Virgin Radio", tag: "pop", color: "#FB7185", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3" },
  { name: "Süper FM", tag: "türkçe pop", color: "#34D399", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM.mp3" },
];

// dünya kategorileri (ülke) — radio-browser countrycode
const COUNTRIES = [
  { l: "🇹🇷 Türkiye", c: "TR" },
  { l: "🇺🇸 ABD", c: "US" },
  { l: "🇬🇧 İngiltere", c: "GB" },
  { l: "🇩🇪 Almanya", c: "DE" },
  { l: "🇫🇷 Fransa", c: "FR" },
  { l: "🇮🇹 İtalya", c: "IT" },
  { l: "🇪🇸 İspanya", c: "ES" },
  { l: "🇳🇱 Hollanda", c: "NL" },
];

// birden çok radio-browser mirror'ı — biri düşerse diğerine geç (drive-tune yaklaşımı)
const MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
];
async function rbFetch(path: string): Promise<any[]> {
  for (const base of MIRRORS) {
    try {
      const r = await fetch(base + path);
      if (r.ok) return await r.json();
    } catch {
      /* sıradaki mirror */
    }
  }
  return [];
}

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isAdmin = !!pathname && pathname.startsWith("/admin");
  const [current, setCurrent] = useState<Station>(FAVORITES[0]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("luca_radio_collapsed") === "1");
  }, []);
  function setCollapsedPersist(v: boolean) {
    setCollapsed(v);
    setOpen(false);
    try {
      localStorage.setItem("luca_radio_collapsed", v ? "1" : "0");
    } catch {
      /* yoksay */
    }
  }

  const [q, setQ] = useState("");
  const [tag, setTag] = useState(""); // tür filtresi (radio-browser tag)
  const [country, setCountry] = useState(""); // ülke filtresi (countrycode)
  const [results, setResults] = useState<Station[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounced radio-browser arama/filtre (ücretsiz, anahtarsız; çoklu mirror fallback)
  useEffect(() => {
    const query = q.trim();
    const byName = query.length >= 2;
    if (!byName && !tag && !country) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const param = byName
        ? `name=${encodeURIComponent(query)}`
        : tag
          ? `tag=${encodeURIComponent(tag)}`
          : `countrycode=${encodeURIComponent(country)}`;
      const data = await rbFetch(
        `/json/stations/search?${param}&limit=50&hidebroken=true&order=clickcount&reverse=true`,
      );
      const seen = new Set<string>();
      setResults(
        data
          .filter((s) => typeof s.url_resolved === "string" && s.url_resolved.startsWith("https"))
          .filter((s) => { const k = s.url_resolved; if (seen.has(k)) return false; seen.add(k); return true; })
          .slice(0, 18)
          .map((s) => ({
            name: (s.name || "—").trim().slice(0, 32),
            tag: [s.countrycode, (s.tags || "").split(",")[0]].filter(Boolean).join(" · ").slice(0, 34),
            color: "#8B5CF6",
            url: s.url_resolved,
          })),
      );
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [q, tag, country]);

  // dışarı tıklayınca paneli kapat
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

  function play(s: Station) {
    const a = audio();
    setCurrent(s);
    setLoading(true);
    a.src = s.url;
    a.play().catch(() => { setLoading(false); setPlaying(false); });
  }

  function toggle() {
    const a = audio();
    if (playing) a.pause();
    else {
      if (!a.src) a.src = current.url;
      setLoading(true);
      a.play().catch(() => { setLoading(false); setPlaying(false); });
    }
  }

  const list = q.trim().length >= 2 || tag || country ? results : FAVORITES;
  const GENRES = [
    { l: "Türkçe", t: "turkish" },
    { l: "Pop", t: "pop" },
    { l: "Dance", t: "dance" },
    { l: "Jazz", t: "jazz" },
    { l: "Lofi", t: "lofi" },
    { l: "Rock", t: "rock" },
    { l: "Chill", t: "chillout" },
    { l: "Arabesk", t: "arabesk" },
    { l: "Slow", t: "slow" },
    { l: "Haber", t: "news" },
  ];

  const Eq = () => (
    <span className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2].map((b) => (
        <span
          key={b}
          className="w-[2px] rounded-full"
          style={{ height: 4 + b * 3, background: current.color, animation: `lucaEq .9s ${b * 0.15}s ease-in-out infinite alternate` }}
        />
      ))}
    </span>
  );

  // dropdown içeriği — admin/public ortak; yalnız konumu değişir
  const panelBody = (
    <div className="w-[min(25rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); if (e.target.value) { setTag(""); setCountry(""); } }}
          placeholder="İstasyon adı ara…"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        {q && (
          <button onClick={() => setQ("")} aria-label="Temizle">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2.5">
        {GENRES.map((g) => {
          const on = tag === g.t && !q.trim();
          return (
            <button key={g.t} onClick={() => { setQ(""); setCountry(""); setTag(on ? "" : g.t); }}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${on ? "bg-primary text-white" : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              {g.l}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2.5">
        <span className="mr-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">Dünya</span>
        {COUNTRIES.map((c) => {
          const on = country === c.c && !q.trim() && !tag;
          return (
            <button key={c.c} onClick={() => { setQ(""); setTag(""); setCountry(on ? "" : c.c); }}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${on ? "bg-primary text-white" : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              {c.l}
            </button>
          );
        })}
      </div>
      <div className="max-h-80 overflow-y-auto p-1.5">
        <div className="px-2 pb-1 pt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {q.trim().length >= 2 ? "Arama sonuçları" : tag ? GENRES.find((g) => g.t === tag)?.l : country ? COUNTRIES.find((c) => c.c === country)?.l : "Favoriler"}
        </div>
        {searching && (
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> aranıyor…
          </div>
        )}
        {!searching && list.length === 0 && (
          <div className="px-3 py-3 text-xs text-muted-foreground">Sonuç yok.</div>
        )}
        {list.map((s, i) => {
          const active = current.url === s.url;
          return (
            <button key={s.url + i} onClick={() => play(s)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${active ? "bg-muted" : "hover:bg-muted/60"}`}>
              <span className="size-2 shrink-0 rounded-full transition-transform group-hover:scale-125" style={{ background: s.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{s.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{s.tag || "radyo"}</span>
              </span>
              {active && playing ? <Eq /> : <Play className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const eqKeyframes = <style>{`@keyframes lucaEq{from{transform:scaleY(.4)}to{transform:scaleY(1)}}`}</style>;

  // ADMIN: sağ-altta kompakt çalar (üst şerit değil — içeriği örtmez)
  if (isAdmin) {
    return (
      <div ref={wrapRef} className="fixed bottom-5 right-5 z-40 select-none">
        {open && <div className="absolute bottom-full right-0 mb-2">{panelBody}</div>}
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 py-1.5 pl-1.5 pr-3 shadow-lg shadow-primary/10 backdrop-blur">
          <button onClick={toggle} aria-label={playing ? "Durdur" : "Çal"}
            className="grid size-8 shrink-0 place-items-center rounded-full text-black transition-transform active:scale-95" style={{ background: current.color }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
            <span className="leading-tight">
              <span className="block max-w-[120px] truncate text-xs font-medium text-foreground">{current.name}</span>
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{playing ? "● canlı" : "radyo"}</span>
            </span>
            <ChevronUp className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
        {eqKeyframes}
      </div>
    );
  }

  // gizli: köşede minik çalar-baloncuk (aç butonuyla geri gelir)
  if (collapsed) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1 rounded-full border border-primary/30 bg-background/90 p-1 shadow-lg shadow-primary/15 backdrop-blur">
        <button
          onClick={toggle}
          aria-label={playing ? "Durdur" : "Çal"}
          className="grid size-7 place-items-center rounded-full text-black transition-transform active:scale-95"
          style={{ background: current.color }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-[1px]" />}
        </button>
        <button
          onClick={() => setCollapsedPersist(false)}
          aria-label="Radyo şeridini aç"
          className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="fixed inset-x-0 top-16 z-40 border-b border-primary/25 bg-gradient-to-r from-[#6366F1]/20 via-background/88 to-[#8B5CF6]/20 backdrop-blur-lg select-none"
    >
      <div className="container relative flex h-9 items-center gap-2.5">
        {/* çal / durdur */}
        <button
          onClick={toggle}
          aria-label={playing ? "Durdur" : "Çal"}
          className="grid size-6 shrink-0 place-items-center rounded-full text-black transition-transform active:scale-95"
          style={{ background: current.color }}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-[1px]" />}
        </button>

        {/* şu an çalıyor */}
        <div className="flex min-w-0 items-center gap-2">
          <Radio className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
          <span className="truncate text-xs font-medium text-foreground">{current.name}</span>
          <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{current.tag}</span>
          {playing ? <Eq /> : null}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{playing ? "● canlı" : "radyo"}</span>
        </div>

        {/* radyo değiştir */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-3 w-3" /> Radyo
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* gizle */}
        <button
          onClick={() => setCollapsedPersist(true)}
          aria-label="Radyoyu gizle"
          className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* panel */}
        {open && <div className="absolute right-0 top-full mt-1.5">{panelBody}</div>}
      </div>

      {eqKeyframes}
    </div>
  );
}
