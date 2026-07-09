"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Building2, Users, Radio, CalendarClock, Clock, Star, Phone } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";
import { formatDateTR } from "@/lib/utils";
import { loadMapbox } from "@/lib/mapbox";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const ISTANBUL: [number, number] = [28.9784, 41.0082]; // Mapbox: [lng, lat]

type EventRef = { id: string; title: string; slug: string; startsAt: string; endsAt?: string | null };
type ClockPart = { day: number; hour: number; minute: number };
type GooglePlace = {
  placeId: string;
  lat: number;
  lng: number;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  website?: string;
  mapsUri?: string;
  photoName?: string;
  weekdayText?: string[];
  periods?: { open: ClockPart; close?: ClockPart }[];
};

// Google foto → API proxy URL (key gizli). Yüklenmiş kapak yoksa kullanılır.
function placePhotoUrl(name?: string): string | null {
  return name ? `${BASE}/venues/place-photo?ref=${encodeURIComponent(name)}` : null;
}
type Venue = {
  id: string;
  slug: string;
  name: string;
  address?: string | null;
  city?: string | null;
  capacity?: number | null;
  coverUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: "live" | "upcoming" | "idle";
  liveEvent?: EventRef | null;
  nextEvent?: EventRef | null;
  google?: GooglePlace | null;
};

// Google çalışma saatlerinden şu an açık mı — istemcide canlı hesaplanır (cache bayatlamaz).
// Google periods: day 0=Pazar…6=Cumartesi (JS getDay ile aynı).
function isOpenNow(periods?: { open: ClockPart; close?: ClockPart }[]): boolean | null {
  if (!periods || periods.length === 0) return null;
  const now = new Date();
  const d = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const p of periods) {
    if (!p.open) continue;
    const oMin = p.open.hour * 60 + p.open.minute;
    if (!p.close) {
      if (d === p.open.day) return true; // 24 saat açık
      continue;
    }
    const cMin = p.close.hour * 60 + p.close.minute;
    if (p.open.day === p.close.day) {
      if (d === p.open.day && mins >= oMin && mins < cMin) return true;
    } else {
      if (d === p.open.day && mins >= oMin) return true; // gece aşan
      if (d === p.close.day && mins < cMin) return true;
    }
  }
  return false;
}

const STATUS: Record<string, { label: string; chip: string; pin: string }> = {
  live: { label: "Canlı", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", pin: "#10b981" },
  upcoming: { label: "Yaklaşan", chip: "bg-violet-500/15 text-violet-600 dark:text-violet-400", pin: "#8b5cf6" },
  idle: { label: "Boşta", chip: "bg-muted text-muted-foreground", pin: "#94a3b8" },
};
const STATUS_FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "live", l: "Canlı" },
  { v: "upcoming", l: "Yaklaşan" },
];
const CAP_FILTERS = [
  { v: 0, l: "Kapasite" },
  { v: 50, l: "50+" },
  { v: 100, l: "100+" },
  { v: 200, l: "200+" },
];

function ensurePinStyle() {
  if (typeof document === "undefined" || document.getElementById("luca-pin-style")) return;
  const st = document.createElement("style");
  st.id = "luca-pin-style";
  st.textContent = `
    @keyframes lucaPulse { 0%{transform:scale(.6);opacity:.6} 70%{transform:scale(2.3);opacity:0} 100%{opacity:0} }
    .luca-pin{ position:relative; width:24px; height:24px; cursor:pointer; }
    .luca-pin .glow{ position:absolute; inset:-5px; border-radius:50%; opacity:.4; filter:blur(6px); }
    .luca-pin .dot{ position:absolute; inset:0; border-radius:50%; border:2.5px solid #fff; box-shadow:0 4px 13px rgba(0,0,0,.55); transition:transform .15s ease; }
    .luca-pin .dot::after{ content:''; position:absolute; inset:6.5px; border-radius:50%; background:#fff; opacity:.92; }
    .luca-pin:hover .dot{ transform:scale(1.28); }
    .luca-pin.live .glow{ opacity:.65; animation:lucaPulse 1.5s ease-out infinite; }
    .luca-popup .mapboxgl-popup-content{ background:transparent !important; padding:0 !important; box-shadow:none !important; border:none !important; }
    .luca-popup .mapboxgl-popup-tip{ display:none !important; }
    .luca-popup .mapboxgl-popup-close-button{ position:absolute; top:8px; right:8px; z-index:3; width:24px; height:24px; padding:0; border-radius:8px; background:rgba(0,0,0,.5); color:#fff; font-size:15px; line-height:23px; }
    .luca-pop{ position:relative; width:250px; background:#15151c; border:1px solid rgba(255,255,255,.09); border-radius:18px; box-shadow:0 22px 55px rgba(0,0,0,.62); overflow:hidden; font-family:system-ui,-apple-system,sans-serif; }
    .luca-pop .hero{ height:74px; position:relative; background-size:cover; background-position:center; }
    .luca-pop .heroScrim{ position:absolute; inset:0; background:linear-gradient(to top,rgba(21,21,28,.92),transparent 62%); }
    .luca-pop .pad{ padding:11px 14px 14px; }
    .luca-pop .ttl{ font-weight:650; font-size:15px; color:#fff; line-height:1.25; }
    .luca-pop .chip{ display:inline-flex; align-items:center; gap:5px; margin-top:8px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; }
    .luca-pop .sub{ color:#a3a9b5; font-size:12px; margin-top:8px; line-height:1.45; }
    .luca-pop .ev{ margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.08); font-size:12px; }
    .luca-pop .watch{ display:flex; justify-content:center; align-items:center; gap:6px; margin-top:12px; padding:9px 12px; border-radius:12px; color:#fff; font-size:12.5px; font-weight:600; text-decoration:none; }
  `;
  document.head.appendChild(st);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
const STATUS_GRAD: Record<string, string> = {
  live: "linear-gradient(135deg,#047857,#10b981)",
  upcoming: "linear-gradient(135deg,#6d28d9,#a855f7)",
  idle: "linear-gradient(135deg,#374151,#4b5563)",
};
function popupHtml(v: Venue): string {
  const status = v.status ?? "idle";
  const st = STATUS[status] ?? STATUS.idle;
  const cover = v.coverUrl || placePhotoUrl(v.google?.photoName);
  const hero = cover
    ? `<div class="hero" style="background-image:url('${escapeHtml(cover)}')"><div class="heroScrim"></div></div>`
    : `<div class="hero" style="background:${STATUS_GRAD[status]}"><div class="heroScrim"></div></div>`;
  const sub = [v.city, v.address].filter(Boolean).join(" · ");
  const ev = v.liveEvent
    ? `<div class="ev" style="color:#34d399">● Şu an: ${escapeHtml(v.liveEvent.title)}</div>`
    : v.nextEvent
      ? `<div class="ev" style="color:#c4b5fd">Sıradaki: ${escapeHtml(v.nextEvent.title)} · ${escapeHtml(formatDateTR(v.nextEvent.startsAt))}</div>`
      : `<div class="ev" style="color:#6b7280">Etkinlik yok</div>`;
  const watch = v.liveEvent
    ? `<a class="watch" style="background:#ef4444" href="/canli/${encodeURIComponent(v.liveEvent.slug)}">▶ Canlı İzle</a>`
    : v.nextEvent
      ? `<a class="watch" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)" href="/etkinlik/${encodeURIComponent(v.nextEvent.slug)}">Detayı gör →</a>`
      : "";
  const dot = v.status === "live" ? `<span style="width:6px;height:6px;border-radius:50%;background:#fff"></span>` : "";
  const g = v.google;
  const openState = isOpenNow(g?.periods);
  const openChip =
    openState === null
      ? ""
      : `<span class="chip" style="background:${openState ? "#10b98126;color:#34d399" : "#ef444426;color:#f87171"}">${openState ? "● Açık" : "● Kapalı"}</span>`;
  const gInfo =
    g && (g.rating || g.phone)
      ? `<div class="sub">${g.rating ? `★ ${g.rating.toFixed(1)}${g.ratingCount ? ` (${g.ratingCount})` : ""}` : ""}${g.rating && g.phone ? " · " : ""}${g.phone ? escapeHtml(g.phone) : ""}</div>`
      : "";
  const gLinks =
    g && (g.mapsUri || g.phone)
      ? `<div style="display:flex;gap:8px;margin-top:10px">${g.mapsUri ? `<a class="watch" style="background:#1a73e8;flex:1" href="${escapeHtml(g.mapsUri)}" target="_blank" rel="noopener">Google'da aç →</a>` : ""}${g.phone ? `<a class="watch" style="background:#334155;flex:1" href="tel:${escapeHtml(g.phone.replace(/\s/g, ""))}">Ara</a>` : ""}</div>`
      : "";
  return (
    `<div class="luca-pop">${hero}<div class="pad">` +
    `<div class="ttl">${escapeHtml(v.name)}</div>` +
    `<span class="chip" style="background:${st.pin}26;color:${st.pin}">${dot}${st.label}</span>${openChip}` +
    `${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ""}${gInfo}${ev}${watch}${gLinks}</div></div>`
  );
}

export default function MekanlarPage() {
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capMin, setCapMin] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const glRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    fetch(`${BASE}/venues/map`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/maps/config`)
      .then((r) => r.json())
      .then((cfg: { token?: string; configured?: boolean }) => {
        if (cancelled || !cfg.configured || !cfg.token) {
          if (!cancelled) setMapError(true);
          return;
        }
        loadMapbox()
          .then((gl) => {
            if (cancelled || !mapEl.current || mapRef.current) return;
            ensurePinStyle();
            glRef.current = gl;
            gl.accessToken = cfg.token;
            const map = new gl.Map({ container: mapEl.current, style: MAP_STYLE, center: ISTANBUL, zoom: 10.4, attributionControl: true });
            mapRef.current = map;
            map.addControl(new gl.NavigationControl({ showCompass: false }), "top-right");
            map.on("load", () => !cancelled && setMapReady(true));
          })
          .catch(() => !cancelled && setMapError(true));
      })
      .catch(() => !cancelled && setMapError(true));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  const cityChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of rows) {
      const c = v.city?.trim();
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((v) => {
      if (cityFilter !== "all" && v.city?.trim() !== cityFilter) return false;
      if (statusFilter !== "all" && (v.status ?? "idle") !== statusFilter) return false;
      if (capMin > 0 && (v.capacity ?? 0) < capMin) return false;
      if (openOnly && isOpenNow(v.google?.periods) !== true) return false;
      if (!term) return true;
      return v.name.toLowerCase().includes(term) || v.city?.toLowerCase().includes(term) || v.address?.toLowerCase().includes(term);
    });
  }, [rows, q, cityFilter, statusFilter, capMin, openOnly]);

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) + (cityFilter !== "all" ? 1 : 0) + (capMin > 0 ? 1 : 0) + (openOnly ? 1 : 0);

  useEffect(() => {
    const gl = glRef.current;
    const map = mapRef.current;
    if (!gl || !map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const geo = list.filter((v) => v.lat != null && v.lng != null);
    const bounds = new gl.LngLatBounds();
    for (const v of geo) {
      const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
      const el = document.createElement("div");
      el.className = `luca-pin${v.status === "live" ? " live" : ""}`;
      el.innerHTML = `<span class="glow" style="background:${st.pin}"></span><span class="dot" style="background:${st.pin}"></span>`;
      const popup = new gl.Popup({ offset: 14, closeButton: true, maxWidth: "260px", className: "luca-popup", focusAfterOpen: false }).setHTML(popupHtml(v));
      const m = new gl.Marker({ element: el, anchor: "center" }).setLngLat([v.lng as number, v.lat as number]).setPopup(popup).addTo(map);
      el.addEventListener("click", () => setActive(v.id));
      markersRef.current.set(v.id, m);
      bounds.extend([v.lng as number, v.lat as number]);
    }
    // Akıllı çerçeve: tek → uç; sıkı küme → sığdır; dağınık (Mardin gibi uzak) → İstanbul'da kal.
    if (geo.length === 1) {
      map.flyTo({ center: [geo[0].lng as number, geo[0].lat as number], zoom: 13, duration: 500 });
    } else if (geo.length > 1) {
      const spanLng = bounds.getEast() - bounds.getWest();
      const spanLat = bounds.getNorth() - bounds.getSouth();
      if (spanLng < 2.5 && spanLat < 2.5) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 13, duration: 500 });
      } else {
        map.easeTo({ center: ISTANBUL, zoom: 10.4, duration: 500 });
      }
    }
  }, [list, mapReady]);

  function focus(v: Venue) {
    setActive(v.id);
    const map = mapRef.current;
    const m = markersRef.current.get(v.id);
    if (map && m && v.lat != null && v.lng != null) {
      map.flyTo({ center: [v.lng, v.lat], zoom: 14, duration: 600 });
      const p = m.getPopup();
      if (p && !p.isOpen()) m.togglePopup();
    }
  }

  const tl = (n: number) => new Intl.NumberFormat("tr-TR").format(n || 0);
  const chipCls = (on: boolean) =>
    `rounded-full px-3 py-1 text-xs transition ${on ? "bg-primary text-white" : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`;
  const segCls = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${on ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`;
  function clearFilters() {
    setStatusFilter("all");
    setCityFilter("all");
    setCapMin(0);
    setOpenOnly(false);
    setQ("");
  }

  return (
    <>
      <Nav />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container">
          <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Mekanlar</div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">Luca haritada</h1>
          <p className="mt-2 text-muted-foreground">Etkinliğin geçtiği mekanlar — canlı olanları haritada gör.</p>

          {/* filtreler — modern */}
          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative lg:max-w-sm lg:flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Mekan, şehir, adres ara…"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary/50"
                />
              </div>
              {/* açık şimdi */}
              <button
                onClick={() => setOpenOnly((o) => !o)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${openOnly ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Clock className="h-3.5 w-3.5" /> Açık şimdi
              </button>
              {/* durum */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.v} onClick={() => setStatusFilter(f.v)} className={segCls(statusFilter === f.v)}>
                    {f.v === "live" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {f.l}
                  </button>
                ))}
              </div>
              {/* kapasite */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                {CAP_FILTERS.map((c) => (
                  <button key={c.v} onClick={() => setCapMin(c.v)} className={segCls(capMin === c.v)}>
                    {c.v === 0 && <Users className="h-3 w-3" />}
                    {c.l}
                  </button>
                ))}
              </div>
            </div>
            {/* şehir + temizle */}
            {cityChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
                <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Şehir</span>
                <button onClick={() => setCityFilter("all")} className={chipCls(cityFilter === "all")}>Tümü</button>
                {cityChips.map((c) => (
                  <button key={c} onClick={() => setCityFilter(c)} className={chipCls(cityFilter === c)}>{c}</button>
                ))}
                {(activeFilters > 0 || q) && (
                  <button onClick={clearFilters} className="ml-auto text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                    Temizle{activeFilters > 0 ? ` (${activeFilters})` : ""}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* harita + liste */}
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-xl border border-border">
                <div ref={mapEl} className="h-[340px] w-full bg-muted lg:h-[560px]" />
                <div className="pointer-events-none absolute left-3 top-3 z-[1] flex flex-wrap gap-1.5 rounded-lg bg-card/85 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur">
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} /> Canlı</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#8b5cf6" }} /> Yaklaşan</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#94a3b8" }} /> Boşta</span>
                </div>
                {mapError && (
                  <div className="absolute inset-0 grid place-items-center bg-card/85 p-6 text-center text-sm text-muted-foreground">
                    Harita şu an yüklenemedi. Listeden gezebilirsin.
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-3 text-sm text-muted-foreground">{loading ? "Yükleniyor…" : `${list.length} mekan`}</div>
              {loading ? (
                <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">Yükleniyor…</div>
              ) : list.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
                  Mekan bulunamadı. Filtreleri değiştirmeyi dene.
                </div>
              ) : (
                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {list.map((v) => {
                    const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
                    const on = active === v.id;
                    const cover = v.coverUrl || placePhotoUrl(v.google?.photoName);
                    return (
                      <button
                        key={v.id}
                        onClick={() => focus(v)}
                        className={`group block w-full overflow-hidden rounded-2xl border bg-card text-left transition ${on ? "border-primary/60 ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
                      >
                        {/* kapak */}
                        <div className="relative h-28 w-full overflow-hidden bg-muted">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt={v.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/70">
                              <MapPin className="h-6 w-6" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 to-transparent" />
                          {(() => {
                            const open = isOpenNow(v.google?.periods);
                            if (open === null) return null;
                            return (
                              <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${open ? "bg-emerald-600/90" : "bg-red-600/90"}`}>
                                ● {open ? "Açık" : "Kapalı"}
                              </span>
                            );
                          })()}
                          <span className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>
                            {v.status === "live" && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              </span>
                            )}
                            {st.label}
                          </span>
                          <div className="absolute bottom-2 left-3 right-3 truncate text-sm font-semibold text-white drop-shadow">{v.name}</div>
                        </div>
                        {/* gövde */}
                        <div className="p-3">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {v.city && (<span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {v.city}</span>)}
                            {(v.capacity ?? 0) > 0 && (<span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {tl(v.capacity || 0)}</span>)}
                          </div>
                          {v.address && (
                            <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                              <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> <span className="line-clamp-1">{v.address}</span>
                            </div>
                          )}
                          {v.google && (typeof v.google.rating === "number" || v.google.phone) && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {typeof v.google.rating === "number" && (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3 w-3 text-amber-500" /> {v.google.rating.toFixed(1)}
                                  {v.google.ratingCount ? ` (${tl(v.google.ratingCount)})` : ""}
                                </span>
                              )}
                              {v.google.phone && (
                                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {v.google.phone}</span>
                              )}
                            </div>
                          )}
                          {v.liveEvent ? (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                              <Radio className="h-3 w-3" /> Şu an: {v.liveEvent.title}
                            </div>
                          ) : v.nextEvent ? (
                            <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="h-3 w-3" /> Sıradaki: {v.nextEvent.title} · {formatDateTR(v.nextEvent.startsAt)}
                            </div>
                          ) : (
                            <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                              <Clock className="h-3 w-3" /> Şu an etkinlik yok
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
