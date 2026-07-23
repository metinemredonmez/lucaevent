"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Play, Pause, Radio, Loader2, Search, X, ChevronDown, ChevronUp, Globe2, Music2, Sparkles, Moon, Guitar, Disc3, type LucideIcon } from "lucide-react";
import { getEvent, discoverEvents } from "@/lib/events";

type Station = { name: string; tag: string; color: string; url: string };

/** Sabit favoriler — hepsi HTTPS, test edildi. */
const FAVORITES: Station[] = [
  { name: "I Love Dance", tag: "house · electronic", color: "#22D3EE", url: "https://streams.ilovemusic.de/iloveradio2.mp3" },
  { name: "Metro FM", tag: "pop · hit", color: "#22c9b8", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM.mp3" },
  { name: "Joy FM", tag: "lounge · yabancı", color: "#F472B6", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_FM.mp3" },
  { name: "Virgin Radio", tag: "pop", color: "#FB7185", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3" },
  { name: "Süper FM", tag: "türkçe pop", color: "#34D399", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM.mp3" },
];

// dünya kategorileri (ülke) — radio-browser countrycode (ISO 3166-1 alpha-2)
const COUNTRIES = [
  { l: "🇹🇷 Türkiye", c: "TR" },
  { l: "🇺🇸 ABD", c: "US" },
  { l: "🇬🇧 İngiltere", c: "GB" },
  { l: "🇩🇪 Almanya", c: "DE" },
  { l: "🇫🇷 Fransa", c: "FR" },
  { l: "🇮🇹 İtalya", c: "IT" },
  { l: "🇪🇸 İspanya", c: "ES" },
  { l: "🇳🇱 Hollanda", c: "NL" },
  { l: "🇷🇺 Rusya", c: "RU" },
  { l: "🇺🇦 Ukrayna", c: "UA" },
  { l: "🇬🇷 Yunanistan", c: "GR" },
  { l: "🇵🇹 Portekiz", c: "PT" },
  { l: "🇸🇪 İsveç", c: "SE" },
  { l: "🇳🇴 Norveç", c: "NO" },
  { l: "🇩🇰 Danimarka", c: "DK" },
  { l: "🇫🇮 Finlandiya", c: "FI" },
  { l: "🇵🇱 Polonya", c: "PL" },
  { l: "🇧🇪 Belçika", c: "BE" },
  { l: "🇨🇭 İsviçre", c: "CH" },
  { l: "🇦🇹 Avusturya", c: "AT" },
  { l: "🇮🇪 İrlanda", c: "IE" },
  { l: "🇨🇿 Çekya", c: "CZ" },
  { l: "🇷🇴 Romanya", c: "RO" },
  { l: "🇭🇺 Macaristan", c: "HU" },
  { l: "🇨🇦 Kanada", c: "CA" },
  { l: "🇲🇽 Meksika", c: "MX" },
  { l: "🇧🇷 Brezilya", c: "BR" },
  { l: "🇦🇷 Arjantin", c: "AR" },
  { l: "🇯🇵 Japonya", c: "JP" },
  { l: "🇰🇷 G. Kore", c: "KR" },
  { l: "🇨🇳 Çin", c: "CN" },
  { l: "🇮🇳 Hindistan", c: "IN" },
  { l: "🇦🇺 Avustralya", c: "AU" },
  { l: "🇸🇦 S. Arabistan", c: "SA" },
  { l: "🇦🇪 BAE", c: "AE" },
  { l: "🇪🇬 Mısır", c: "EG" },
  { l: "🇲🇦 Fas", c: "MA" },
  { l: "🇿🇦 G. Afrika", c: "ZA" },
  { l: "🇦🇿 Azerbaycan", c: "AZ" },
  { l: "🇮🇷 İran", c: "IR" },
  { l: "🇮🇱 İsrail", c: "IL" },
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

// Kampta dinlemelik hazır mix'ler — tek tık, en iyi eşleşen canlı istasyonu çalar.
// (Canlı radyo widget'ı sabit şarkı listesi çalamaz; her mix o vibe'ı çalan istasyona bağlanır.)
type Mix = { l: string; s: string; q: string; by: "name" | "tag"; hero?: boolean; Icon: LucideIcon; color: string };
const MIXES: Mix[] = [
  { l: "BUGÜNE ÖZEL", s: "günün seçkisi · Türkçe rock", q: "eksen", by: "name", hero: true, Icon: Sparkles, color: "#22c9b8" },
  { l: "AI IRIE FM", s: "reggae · chill vibe", q: "reggae", by: "tag", Icon: Music2, color: "#22C55E" },
  { l: "GREEK", s: "laiko · pop · en iyiler", q: "greek music", by: "tag", Icon: Music2, color: "#2F6FED" },
  { l: "Türkçe Pop", s: "hit & yeni", q: "power türk", by: "name", Icon: Music2, color: "#EC4899" },
  { l: "Rock", s: "yabancı rock klasikleri", q: "rock", by: "tag", Icon: Guitar, color: "#F97316" },
  { l: "Slow · Akşam", s: "sakin, ateş başı", q: "slow türk", by: "name", Icon: Moon, color: "#60A5FA" },
  { l: "Nostalji", s: "90'lar / 2000'ler", q: "nostalji", by: "name", Icon: Disc3, color: "#F59E0B" },
];

// Kategori → varsayılan müzik (API slug'ları). Etkinliğin kendi musicQuery'si varsa o ezer.
const CATEGORY_MUSIC: Record<string, { label: string; q: string; by: "name" | "tag" }> = {
  wellness: { label: "Sakin · Wellness", q: "ambient", by: "tag" },
  "outdoor-spor": { label: "Doğa · Chill", q: "chillout", by: "tag" },
  "gezi-seyahat": { label: "Yolculuk", q: "world music", by: "tag" },
  workshop: { label: "Odak", q: "jazz", by: "tag" },
  social: { label: "Lounge", q: "lounge", by: "tag" },
  "food-drink": { label: "Akşam · Lounge", q: "lounge", by: "tag" },
  business: { label: "Odak · Jazz", q: "jazz", by: "tag" },
  nightlife: { label: "Dans", q: "dance", by: "tag" },
};

// Etkinlikten hero mix üret: override (musicQuery/Label) > kategori varsayılanı.
// keepLabel true ise çip etiketi "BUGÜNE ÖZEL" kalır (ana sayfa), yoksa etkinliğe göre.
function eventMix(
  ev: { musicQuery?: string | null; musicLabel?: string | null; category?: { slug?: string } | null },
  keepLabel: boolean,
): Mix | null {
  const q = ev.musicQuery?.trim();
  const cat = ev.category?.slug ? CATEGORY_MUSIC[ev.category.slug] : null;
  const label = ev.musicLabel?.trim() || (keepLabel ? "BUGÜNE ÖZEL" : cat?.label || "BU ETKİNLİĞE ÖZEL");
  if (q) return { l: label.toUpperCase(), s: "etkinlik müziği", q, by: "tag", hero: true, Icon: Sparkles, color: "#22c9b8" };
  if (cat) return { l: label.toUpperCase(), s: "etkinliğe göre", q: cat.q, by: cat.by, hero: true, Icon: Sparkles, color: "#22c9b8" };
  return null;
}

export function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const wantRef = useRef(false); // kullanıcı çalmasını istiyor mu (reconnect kararı)
  const curRef = useRef<Station>(FAVORITES[0]); // aktif istasyon (event closure'ları için)
  const retryRef = useRef(0); // ardışık yeniden bağlanma denemesi
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallRef = useRef<ReturnType<typeof setTimeout> | null>(null); // geçici duraksama nöbetçisi
  const pathname = usePathname();
  const isAdmin = !!pathname && pathname.startsWith("/admin");
  // Radyo yalnız public sitede: giriş/kayıt ve admin sayfalarında görünmez.
  const isAuth = !!pathname && /^\/(giris|kayit|sifremi-unuttum|sifre-sifirla|dogrula)(\/|$)/.test(pathname);
  const hidden = isAdmin || isAuth;
  const [current, setCurrent] = useState<Station>(FAVORITES[0]);
  const [track, setTrack] = useState<string | null>(null); // "şu an çalan" (ICY metadata)
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

  // Üst şerit (iki satır: radyo + mix) görünürken sayfa içeriğini şerit boyu kadar aşağı it.
  // Yüksekliği ölçerek uygularız (mix şeridi eklendi, sabit değer yetmez). Admin/gizli → sıfır.
  useEffect(() => {
    const stripVisible = !isAdmin && !collapsed;
    if (!stripVisible) {
      document.body.style.paddingTop = "";
      return;
    }
    const apply = () => {
      const h = wrapRef.current?.offsetHeight;
      document.body.style.paddingTop = h ? `${h}px` : "5rem";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.paddingTop = "";
    };
  }, [isAdmin, collapsed]);

  const [q, setQ] = useState("");
  const [tag, setTag] = useState(""); // tür filtresi (radio-browser tag)
  const [country, setCountry] = useState(""); // ülke filtresi (countrycode)
  const [results, setResults] = useState<Station[]>([]);
  const [searching, setSearching] = useState(false);
  const [openCat, setOpenCat] = useState<"genre" | "world" | null>("genre"); // açılır kategori
  const [mixBusy, setMixBusy] = useState(""); // yükleniyor olan mix etiketi
  const [heroMix, setHeroMix] = useState<Mix | null>(null); // etkinliğe/güre göre dinamik hero mix

  // "Şu an çalan" — çalarken ICY metadata proxy'sinden periyodik çek (yoksa null)
  useEffect(() => {
    setTrack(null);
    if (!playing || !current.url) return;
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE}/radio/now-playing?url=${encodeURIComponent(current.url)}`);
        if (!r.ok) return;
        const d = await r.json();
        if (alive) setTrack(typeof d?.title === "string" && d.title.trim() ? d.title.trim() : null);
      } catch { /* yoksay */ }
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [playing, current.url]);

  // Etkinlik sayfasında o etkinliğin müziği; ana sayfada bugünün öne çıkan etkinliği.
  useEffect(() => {
    let alive = true;
    const p = pathname || "";
    if (hidden) { setHeroMix(null); return; }
    const m = p.match(/^\/etkinlik\/([^/?#]+)/);
    if (m) {
      getEvent(decodeURIComponent(m[1]))
        .then((ev) => alive && setHeroMix(ev ? eventMix(ev, false) : null))
        .catch(() => alive && setHeroMix(null));
    } else if (p === "/") {
      discoverEvents({ range: "upcoming", take: 1 })
        .then((r) => {
          const first = r[0];
          if (!first) return alive && setHeroMix(null);
          return getEvent(first.slug).then((ev) => alive && setHeroMix(ev ? eventMix(ev, true) : null));
        })
        .catch(() => alive && setHeroMix(null));
    } else {
      setHeroMix(null);
    }
    return () => { alive = false; };
  }, [pathname, hidden]);

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
            color: "#22c9b8",
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

  // reconnect + stall timer'larını unmount'ta temizle
  useEffect(
    () => () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (stallRef.current) clearTimeout(stallRef.current);
    },
    [],
  );

  // sekme/uygulama arka plandan dönünce, çalması isteniyorsa ama duraksadıysa devam ettir
  useEffect(() => {
    const onVis = () => {
      const a = audioRef.current;
      if (document.visibilityState === "visible" && wantRef.current && a && a.paused) {
        retryRef.current = 0;
        try { a.src = curRef.current.url; a.play().catch(() => {}); } catch { /* yoksay */ }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  function clearStall() {
    if (stallRef.current) { clearTimeout(stallRef.current); stallRef.current = null; }
  }
  // Geçici duraksama (waiting/stalled): hemen kesme — 6 sn kendi düzelmezse yeniden bağlan.
  // (Anlık internet dalgalanmasında boşuna gap yaratmaz; sadece gerçek kopmada müdahale eder.)
  function armStall() {
    if (stallRef.current || !wantRef.current) return;
    setLoading(true);
    stallRef.current = setTimeout(() => {
      stallRef.current = null;
      scheduleReconnect();
    }, 6000);
  }

  // Yayın koparsa (ücretsiz radyolar sık koparır) istek varsa üssel backoff'la yeniden bağlan.
  function scheduleReconnect() {
    if (!wantRef.current) { setLoading(false); setPlaying(false); return; }
    if (reconnectRef.current) return; // zaten planlı
    if (retryRef.current >= 6) { // uzun süre gelmiyorsa vazgeç
      wantRef.current = false;
      setLoading(false);
      setPlaying(false);
      return;
    }
    setPlaying(false);
    setLoading(true);
    const delay = Math.min(600 * 2 ** retryRef.current, 10000); // 0.6s → 10s (ilk deneme hızlı → kısa gap)
    reconnectRef.current = setTimeout(() => {
      reconnectRef.current = null;
      const a = audioRef.current;
      if (!a || !wantRef.current) return;
      retryRef.current += 1;
      try {
        a.src = curRef.current.url; // aynı yayına yeniden bağlan
        a.play().catch(() => scheduleReconnect());
      } catch {
        scheduleReconnect();
      }
    }, delay);
  }

  function audio() {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.volume = 0.6;
      a.onplaying = () => { setPlaying(true); setLoading(false); retryRef.current = 0; clearStall(); };
      a.ontimeupdate = () => clearStall(); // ses akıyor → duraksama nöbetçisini iptal
      a.onpause = () => { if (!wantRef.current) setPlaying(false); };
      a.onwaiting = () => armStall(); // geçici → 6 sn bekle
      a.onstalled = () => armStall();
      a.onended = () => { clearStall(); scheduleReconnect(); }; // yayın bitti → gerçek kopma
      a.onerror = () => { clearStall(); scheduleReconnect(); };
      audioRef.current = a;
    }
    return audioRef.current;
  }

  function startPlaying(s: Station) {
    const a = audio();
    setCurrent(s);
    curRef.current = s;
    wantRef.current = true;
    retryRef.current = 0;
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    clearStall();
    setLoading(true);
    a.src = s.url;
    a.play().catch(() => scheduleReconnect());
  }

  function play(s: Station) {
    startPlaying(s);
  }

  function toggle() {
    if (wantRef.current) {
      // kullanıcı durdurdu → reconnect'i iptal et
      wantRef.current = false;
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
      clearStall();
      audioRef.current?.pause();
      setPlaying(false);
      setLoading(false);
    } else {
      startPlaying(current);
    }
  }

  // Mix'e tıkla → en iyi eşleşen canlı istasyonu bul ve çal.
  async function playMix(m: (typeof MIXES)[number]) {
    setMixBusy(m.l);
    try {
      const param = m.by === "name" ? `name=${encodeURIComponent(m.q)}` : `tag=${encodeURIComponent(m.q)}`;
      const data = await rbFetch(
        `/json/stations/search?${param}&limit=20&hidebroken=true&order=clickcount&reverse=true`,
      );
      const st = data.find((s) => typeof s.url_resolved === "string" && s.url_resolved.startsWith("https"));
      if (st) {
        play({ name: (st.name || m.l).trim().slice(0, 32), tag: `mix · ${m.l.toLowerCase()}`, color: "#22c9b8", url: st.url_resolved });
      }
    } finally {
      setMixBusy("");
    }
  }

  const list = q.trim().length >= 2 || tag || country ? results : FAVORITES;
  const GENRES = [
    { l: "Türkçe", t: "turkish" },
    { l: "Türkü", t: "türkü" },
    { l: "Arabesk", t: "arabesk" },
    { l: "Damar", t: "damar" },
    { l: "Slow", t: "slow" },
    { l: "Nostalji", t: "nostalji" },
    { l: "Pop", t: "pop" },
    { l: "Rock", t: "rock" },
    { l: "Dance", t: "dance" },
    { l: "Elektronik", t: "electronic" },
    { l: "House", t: "house" },
    { l: "Techno", t: "techno" },
    { l: "Trance", t: "trance" },
    { l: "EDM", t: "edm" },
    { l: "Deep House", t: "deep house" },
    { l: "Hip-Hop", t: "hip hop" },
    { l: "Rap", t: "rap" },
    { l: "R&B", t: "rnb" },
    { l: "Jazz", t: "jazz" },
    { l: "Blues", t: "blues" },
    { l: "Soul", t: "soul" },
    { l: "Funk", t: "funk" },
    { l: "Disco", t: "disco" },
    { l: "Reggae", t: "reggae" },
    { l: "Latin", t: "latin" },
    { l: "Klasik", t: "classical" },
    { l: "Opera", t: "opera" },
    { l: "Metal", t: "metal" },
    { l: "Punk", t: "punk" },
    { l: "Indie", t: "indie" },
    { l: "Alternatif", t: "alternative" },
    { l: "Folk", t: "folk" },
    { l: "Country", t: "country" },
    { l: "Akustik", t: "acoustic" },
    { l: "Lofi", t: "lofi" },
    { l: "Chill", t: "chillout" },
    { l: "Lounge", t: "lounge" },
    { l: "Ambient", t: "ambient" },
    { l: "80'ler", t: "80s" },
    { l: "90'lar", t: "90s" },
    { l: "Oldies", t: "oldies" },
    { l: "K-Pop", t: "k-pop" },
    { l: "Meditasyon", t: "meditation" },
    { l: "Haber", t: "news" },
    { l: "Spor", t: "sport" },
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

  // seçili filtrelerin etiketleri (kapalı kategori başlığında rozet olarak gösterilir)
  const genreLabel = tag ? GENRES.find((g) => g.t === tag)?.l : null;
  const countryLabel = country ? COUNTRIES.find((c) => c.c === country)?.l : null;
  const chip = (on: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] transition ${on ? "bg-primary text-white" : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`;

  // dropdown içeriği — admin/public ortak; yalnız konumu değişir.
  // Açılır kategoriler (accordion): Türler + Dünya. Aynı anda tek kategori açık.
  const renderPanel = (widthCls: string, wide = false) => (
    <div className={`${widthCls} overflow-hidden rounded-xl border border-border bg-card shadow-2xl`}>
      {/* arama */}
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

      {/* kategori: Türler (açılır) */}
      <div className="border-b border-border">
        <button
          onClick={() => setOpenCat((c) => (c === "genre" ? null : "genre"))}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Music2 className="h-3.5 w-3.5 text-primary" /> Türler
            <span className="text-[10px] text-muted-foreground/60">{GENRES.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            {genreLabel && openCat !== "genre" && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">{genreLabel}</span>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openCat === "genre" ? "rotate-180" : ""}`} />
          </span>
        </button>
        {openCat === "genre" && (
          <div className="max-h-44 overflow-y-auto px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map((g) => {
                const on = tag === g.t && !q.trim();
                return (
                  <button key={g.t} onClick={() => { setQ(""); setCountry(""); setTag(on ? "" : g.t); }} className={chip(on)}>
                    {g.l}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* kategori: Dünya · Ülkeler (açılır, çok ülke → kendi içinde kayar) */}
      <div className="border-b border-border">
        <button
          onClick={() => setOpenCat((c) => (c === "world" ? null : "world"))}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Globe2 className="h-3.5 w-3.5 text-primary" /> Dünya · Ülkeler
            <span className="text-[10px] text-muted-foreground/60">{COUNTRIES.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            {countryLabel && openCat !== "world" && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">{countryLabel}</span>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openCat === "world" ? "rotate-180" : ""}`} />
          </span>
        </button>
        {openCat === "world" && (
          <div className="max-h-44 overflow-y-auto px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {COUNTRIES.map((c) => {
                const on = country === c.c && !q.trim() && !tag;
                return (
                  <button key={c.c} onClick={() => { setQ(""); setTag(""); setCountry(on ? "" : c.c); }} className={chip(on)}>
                    {c.l}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* istasyon listesi */}
      <div className="max-h-72 overflow-y-auto p-1.5">
        <div className="px-2 pb-1 pt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {q.trim().length >= 2 ? "Arama sonuçları" : genreLabel ? genreLabel : countryLabel ? countryLabel : "Favoriler"}
        </div>
        {searching && (
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> aranıyor…
          </div>
        )}
        {!searching && list.length === 0 && (
          <div className="px-3 py-3 text-xs text-muted-foreground">Sonuç yok.</div>
        )}
        <div className={wide ? "grid grid-cols-2 gap-1 lg:grid-cols-3" : ""}>
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
    </div>
  );

  const eqKeyframes = <style>{`@keyframes lucaEq{from{transform:scaleY(.4)}to{transform:scaleY(1)}}@keyframes lucaChipIn{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}@keyframes lucaWave{from{transform:scaleY(.15)}to{transform:scaleY(1)}}`}</style>;

  // Çalarken çubuğun altına yapışan ince tam-genişlik ses dalgası (ekolayzer şeridi).
  const WaveStrip = () => (
    <div className="flex h-2.5 items-end gap-px overflow-hidden pb-0.5" aria-hidden>
      {Array.from({ length: 64 }).map((_, i) => (
        <span
          key={i}
          className="flex-1 rounded-full"
          style={{
            background: current.color,
            transformOrigin: "bottom",
            animation: `lucaWave ${0.55 + (i % 5) * 0.09}s ${(i % 7) * 0.08}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );

  // Giriş/kayıt ve admin sayfalarında radyo hiç görünmez (sadece public site).
  if (hidden) return null;

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
      className="fixed inset-x-0 top-16 z-40 border-b border-primary/25 backdrop-blur-lg select-none"
      style={{ background: "linear-gradient(to right, hsl(var(--primary) / 0.16), hsl(var(--background) / 0.9) 50%, hsl(var(--primary) / 0.16))" }}
    >
      <div className="container relative">
        <div className="flex h-9 items-center gap-2.5">
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
          <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
            {track ? <span className="text-foreground/90">♪ {track}</span> : current.tag}
          </span>
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
        </div>

        {/* çalarken: ince ses dalgası şeridi (çubuğun altına yapışık) */}
        {playing && <WaveStrip />}

        {/* mix şeridi — yatay kayar, tek tık çalar (üstte ayraç çizgi).
            hero mix etkinliğe/güne göre dinamik (heroMix), yoksa varsayılan BUGÜNE ÖZEL. */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-primary/15 pb-1.5 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(heroMix ? [heroMix, ...MIXES.slice(1)] : MIXES).map((m, i) => {
            const busy = mixBusy === m.l;
            const Icon = m.Icon;
            return (
              <button
                key={m.l}
                onClick={() => playMix(m)}
                disabled={!!mixBusy}
                style={{ animation: `lucaChipIn .32s ease-out both`, animationDelay: `${i * 45}ms` }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-60 ${
                  m.hero
                    ? "border-primary/50 bg-primary/15 font-medium text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" style={m.hero ? undefined : { color: m.color }} />}
                {m.l}
              </button>
            );
          })}
          <button
            onClick={() => { setOpen(true); setOpenCat("genre"); }}
            style={{ animation: `lucaChipIn .32s ease-out both`, animationDelay: `${MIXES.length * 45}ms` }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <Music2 className="h-3.5 w-3.5" /> Türler
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* panel */}
        {open && <div className="absolute right-0 top-full mt-1.5">{renderPanel("w-[min(25rem,calc(100vw-1rem))]")}</div>}
      </div>

      {eqKeyframes}
    </div>
  );
}
