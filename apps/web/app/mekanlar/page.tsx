"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, Building2, Users, Radio, CalendarClock } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";
import { formatDateTR } from "@/lib/utils";
import { loadMapbox } from "@/lib/mapbox";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/api/v1";
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const ISTANBUL: [number, number] = [28.9784, 41.0082]; // Mapbox: [lng, lat]

type EventRef = { id: string; title: string; slug: string; startsAt: string; endsAt?: string | null };
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
};

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

function ensurePinStyle() {
  if (typeof document === "undefined" || document.getElementById("luca-pin-style")) return;
  const st = document.createElement("style");
  st.id = "luca-pin-style";
  st.textContent = `
    @keyframes lucaPulse { 0%{transform:scale(.7);opacity:.55} 70%{transform:scale(2.1);opacity:0} 100%{opacity:0} }
    .luca-pin{ position:relative; width:20px; height:20px; cursor:pointer; }
    .luca-pin .glow{ position:absolute; inset:-3px; border-radius:50%; opacity:.35; filter:blur(3px); }
    .luca-pin .dot{ position:absolute; inset:0; border-radius:50%; border:2.5px solid #0b0b10; box-shadow:0 2px 8px rgba(0,0,0,.55); transition:transform .15s ease; }
    .luca-pin:hover .dot{ transform:scale(1.3); }
    .luca-pin.live .glow{ opacity:.5; animation:lucaPulse 1.6s ease-out infinite; }
    .luca-popup .mapboxgl-popup-content{ background:transparent !important; padding:0 !important; box-shadow:none !important; border:none !important; }
    .luca-popup .mapboxgl-popup-tip{ display:none !important; }
    .luca-popup .mapboxgl-popup-close-button{ position:absolute; top:8px; right:8px; z-index:3; width:24px; height:24px; padding:0; border-radius:8px; background:rgba(0,0,0,.45); color:#fff; font-size:15px; line-height:23px; }
    .luca-pop{ position:relative; width:240px; background:#15151c; border:1px solid rgba(255,255,255,.08); border-radius:16px; box-shadow:0 18px 50px rgba(0,0,0,.6); overflow:hidden; font-family:system-ui,-apple-system,sans-serif; }
    .luca-pop .img{ height:96px; background:#23232c center/cover no-repeat; }
    .luca-pop .pad{ padding:12px 14px 14px; }
    .luca-pop .ttl{ font-weight:600; font-size:14.5px; color:#fff; line-height:1.25; }
    .luca-pop .chip{ display:inline-flex; align-items:center; gap:5px; margin-top:7px; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:500; white-space:nowrap; }
    .luca-pop .sub{ color:#9aa0ac; font-size:12px; margin-top:7px; line-height:1.45; }
    .luca-pop .ev{ margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.07); font-size:12px; }
    .luca-pop .watch{ display:inline-flex; align-items:center; gap:6px; margin-top:11px; padding:7px 13px; border-radius:10px; background:#ef4444; color:#fff; font-size:12px; font-weight:600; text-decoration:none; }
  `;
  document.head.appendChild(st);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
function popupHtml(v: Venue): string {
  const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
  const sub = [v.city, v.address].filter(Boolean).join(" · ");
  const ev = v.liveEvent
    ? `<div class="ev" style="color:#10b981">● Şu an: ${escapeHtml(v.liveEvent.title)}</div>`
    : v.nextEvent
      ? `<div class="ev" style="color:#c4b5fd">Sıradaki: ${escapeHtml(v.nextEvent.title)} · ${escapeHtml(formatDateTR(v.nextEvent.startsAt))}</div>`
      : `<div class="ev" style="color:#6b7280">Etkinlik yok</div>`;
  const watch = v.liveEvent
    ? `<a class="watch" href="/canli/${encodeURIComponent(v.liveEvent.slug)}">▶ Canlı İzle</a>`
    : v.nextEvent
      ? `<a class="watch" style="background:#8b5cf6" href="/etkinlik/${encodeURIComponent(v.nextEvent.slug)}">Detay</a>`
      : "";
  const img = v.coverUrl ? `<div class="img" style="background-image:url('${escapeHtml(v.coverUrl)}')"></div>` : "";
  const dot = v.status === "live" ? `<span style="width:6px;height:6px;border-radius:50%;background:${st.pin}"></span>` : "";
  return (
    `<div class="luca-pop">${img}<div class="pad">` +
    `<div class="ttl">${escapeHtml(v.name)}</div>` +
    `<span class="chip" style="background:${st.pin}1f;color:${st.pin}">${dot}${st.label}</span>` +
    `${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ""}${ev}${watch}</div></div>`
  );
}

export default function MekanlarPage() {
  const [rows, setRows] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
      if (!term) return true;
      return v.name.toLowerCase().includes(term) || v.city?.toLowerCase().includes(term) || v.address?.toLowerCase().includes(term);
    });
  }, [rows, q, cityFilter, statusFilter]);

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

  return (
    <>
      <Nav />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container">
          <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Mekanlar</div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">Luca haritada</h1>
          <p className="mt-2 text-muted-foreground">Etkinliğin geçtiği mekanlar — canlı olanları haritada gör.</p>

          {/* filtreler */}
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:max-w-xs lg:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Mekan, şehir, adres ara…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  className={`rounded-full px-3 py-1 text-xs transition ${statusFilter === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {f.l}
                </button>
              ))}
              {cityChips.length > 0 && <span className="mx-1 h-4 w-px bg-border" />}
              <button
                onClick={() => setCityFilter("all")}
                className={`rounded-full px-3 py-1 text-xs transition ${cityFilter === "all" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
              >
                Tümü
              </button>
              {cityChips.map((c) => (
                <button
                  key={c}
                  onClick={() => setCityFilter(c)}
                  className={`rounded-full px-3 py-1 text-xs transition ${cityFilter === c ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {c}
                </button>
              ))}
            </div>
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
              <div className="mb-2 text-sm text-muted-foreground">{loading ? "Yükleniyor…" : `${list.length} mekan`}</div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>}
                {!loading && list.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm text-muted-foreground">Mekan bulunamadı.</div>
                )}
                {!loading && list.length > 0 && (
                  <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
                    {list.map((v) => {
                      const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
                      return (
                        <button
                          key={v.id}
                          onClick={() => focus(v)}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors sm:px-4 ${active === v.id ? "bg-primary/5" : "hover:bg-muted/30"}`}
                        >
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
                            {v.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.coverUrl} alt={v.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/80">
                                <MapPin className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">{v.name}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${st.chip}`}>
                                {v.status === "live" && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  </span>
                                )}
                                {st.label}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                              {v.city && (<span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {v.city}</span>)}
                              {v.address && (<span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {v.address}</span>)}
                            </div>
                            {v.liveEvent ? (
                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <Radio className="h-3 w-3" /> Şu an: {v.liveEvent.title}
                              </div>
                            ) : v.nextEvent ? (
                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarClock className="h-3 w-3" /> Sıradaki: {v.nextEvent.title} · {formatDateTR(v.nextEvent.startsAt)}
                              </div>
                            ) : null}
                          </div>
                          {(v.capacity ?? 0) > 0 && (
                            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
                              <Users className="h-3 w-3" />
                              <span className="tabular-nums">{tl(v.capacity || 0)}</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
