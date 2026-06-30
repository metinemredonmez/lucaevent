"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Plus, MapPin, Building2, Users, Trash2, Crosshair, Radio, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";
import { loadMapbox } from "@/lib/mapbox";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

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
  upcomingCount?: number;
  totalEvents?: number;
};

const ISTANBUL: [number, number] = [28.9784, 41.0082]; // Mapbox: [lng, lat]

const STATUS: Record<string, { label: string; chip: string; pin: string }> = {
  live: { label: "Canlı", chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", pin: "#10b981" },
  upcoming: { label: "Yaklaşan", chip: "bg-violet-500/15 text-violet-600 dark:text-violet-400", pin: "#8b5cf6" },
  idle: { label: "Boşta", chip: "bg-muted text-muted-foreground", pin: "#94a3b8" },
};
const STATUS_FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "live", l: "Canlı" },
  { v: "upcoming", l: "Yaklaşan" },
  { v: "idle", l: "Boşta" },
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
    /* premium koyu cam popup (!important: Mapbox kendi CSS'ini bunun üstüne yüklüyor) */
    .mapboxgl-popup-content{ background:#15151c !important; color:#fff !important; border:1px solid rgba(255,255,255,.10) !important; border-radius:14px !important; padding:0 !important; box-shadow:0 16px 48px rgba(0,0,0,.55) !important; overflow:hidden !important; }
    .mapboxgl-popup-anchor-top .mapboxgl-popup-tip{ border-bottom-color:#15151c !important; }
    .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip{ border-top-color:#15151c !important; }
    .mapboxgl-popup-anchor-left .mapboxgl-popup-tip{ border-right-color:#15151c !important; }
    .mapboxgl-popup-anchor-right .mapboxgl-popup-tip{ border-left-color:#15151c !important; }
    .mapboxgl-popup-close-button{ color:rgba(255,255,255,.55); font-size:17px; width:24px; height:24px; right:2px; top:1px; }
    .mapboxgl-popup-close-button:hover{ background:transparent; color:#fff; }
    .luca-pop{ width:236px; font:13px/1.4 system-ui,-apple-system,sans-serif; }
    .luca-pop .img{ height:104px; background:#23232c center/cover no-repeat; }
    .luca-pop .pad{ padding:11px 13px 13px; }
    .luca-pop .ttl{ font-weight:600; font-size:14px; color:#fff; }
    .luca-pop .chip{ display:inline-flex; align-items:center; padding:1px 8px; border-radius:999px; font-size:11px; font-weight:500; white-space:nowrap; }
    .luca-pop .sub{ color:#9aa0ac; font-size:12px; margin-top:3px; }
    .luca-pop .ev{ margin-top:7px; font-size:12px; }
    .luca-pop .watch{ display:inline-flex; align-items:center; gap:5px; margin-top:10px; padding:6px 11px; border-radius:9px; background:linear-gradient(90deg,#ef4444,#dc2626); color:#fff; font-size:12px; font-weight:600; text-decoration:none; }
  `;
  document.head.appendChild(st);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
function popupHtml(v: Venue): string {
  const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
  const sub = [v.city, v.address].filter(Boolean).join(" · ");
  const cap = v.capacity ? `<span style="color:#6b7280"> · ${v.capacity} kişi</span>` : "";
  const ev = v.liveEvent
    ? `<div class="ev" style="color:#10b981">● Şu an: ${escapeHtml(v.liveEvent.title)}</div>`
    : v.nextEvent
      ? `<div class="ev" style="color:#c4b5fd">Sıradaki: ${escapeHtml(v.nextEvent.title)} · ${escapeHtml(formatDateTR(v.nextEvent.startsAt))}</div>`
      : `<div class="ev" style="color:#6b7280">Etkinlik yok</div>`;
  const watch = v.liveEvent
    ? `<a class="watch" href="/canli/${encodeURIComponent(v.liveEvent.slug)}" target="_blank" rel="noopener">▶ Canlı İzle</a>`
    : "";
  const img = v.coverUrl
    ? `<div class="img" style="background-image:url('${escapeHtml(v.coverUrl)}')"></div>`
    : "";
  return (
    `<div class="luca-pop">${img}<div class="pad">` +
    `<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">` +
    `<span class="ttl">${escapeHtml(v.name)}</span>` +
    `<span class="chip" style="background:${st.pin}22;color:${st.pin}">${st.label}</span></div>` +
    `${sub || cap ? `<div class="sub">${escapeHtml(sub)}${cap}</div>` : ""}` +
    `${ev}${watch}</div></div>`
  );
}

const EMPTY = { name: "", slug: "", city: "", address: "", capacity: "", coverUrl: "", lat: "", lng: "" };

export default function VenuesAdmin() {
  const [rows, setRows] = useState<Venue[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [active, setActive] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [needsToken, setNeedsToken] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const glRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const tempMarkerRef = useRef<any>(null);
  const placingRef = useRef(false);

  function load() {
    setLoading(true);
    api<Venue[]>("/admin/venues")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  useEffect(() => {
    placingRef.current = placing;
    if (mapEl.current) mapEl.current.style.cursor = placing ? "crosshair" : "";
  }, [placing]);

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }
  function setSlug(slug: string) {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug }));
  }

  function dropTemp(gl: any, map: any, lng: number, lat: number) {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setLngLat([lng, lat]);
      return;
    }
    const el = document.createElement("div");
    el.style.cssText =
      "width:18px;height:18px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:grab";
    const m = new gl.Marker({ element: el, draggable: true, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
    m.on("dragend", () => {
      const ll = m.getLngLat();
      setForm((f) => ({ ...f, lat: ll.lat.toFixed(6), lng: ll.lng.toFixed(6) }));
    });
    tempMarkerRef.current = m;
  }
  function clearTemp() {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  }

  // ---- harita kurulumu (token Ayarlar'dan, bir kez) ----
  useEffect(() => {
    let cancelled = false;
    api<{ token: string; configured: boolean }>("/maps/config")
      .then((cfg) => {
        if (cancelled) return;
        if (!cfg.configured || !cfg.token) {
          setNeedsToken(true);
          return;
        }
        loadMapbox()
          .then((gl) => {
            if (cancelled || !mapEl.current || mapRef.current) return;
            ensurePinStyle(); // Mapbox CSS yüklendikten SONRA enjekte et (cascade sırası)
            glRef.current = gl;
            gl.accessToken = cfg.token;
            const map = new gl.Map({
              container: mapEl.current,
              style: MAP_STYLE,
              center: ISTANBUL,
              zoom: 10,
              attributionControl: true,
            });
            mapRef.current = map;
            map.addControl(new gl.NavigationControl({ showCompass: false }), "top-right");
            map.addControl(
              new gl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
              "top-right",
            );
            map.on("click", (e: any) => {
              if (!placingRef.current) return;
              const { lng, lat } = e.lngLat;
              dropTemp(gl, map, lng, lat);
              setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
            });
            map.on("load", () => {
              if (!cancelled) {
                setMapReady(true);
                setMapError(false);
              }
            });
          })
          .catch(() => !cancelled && setMapError(true));
      })
      .catch(() => !cancelled && setMapError(true));
    return () => {
      cancelled = true;
      // SPA'da sayfa değişince haritayı yık (WebGL context + listener sızıntısını önler)
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      tempMarkerRef.current = null;
    };
  }, []);

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((v) => (v.status ?? "idle") === s).length;
    return {
      total: rows.length,
      live: by("live"),
      upcoming: by("upcoming"),
      noGeo: rows.filter((v) => v.lat == null || v.lng == null).length,
    };
  }, [rows]);

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
      return (
        v.name.toLowerCase().includes(term) ||
        v.city?.toLowerCase().includes(term) ||
        v.address?.toLowerCase().includes(term)
      );
    });
  }, [rows, q, cityFilter, statusFilter]);

  // ---- işaretçileri (filtrelenmiş listeye göre) yenile ----
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
      const popup = new gl.Popup({ offset: 16, closeButton: true, maxWidth: "260px", focusAfterOpen: false }).setHTML(popupHtml(v));
      const m = new gl.Marker({ element: el, anchor: "center" }).setLngLat([v.lng as number, v.lat as number]).setPopup(popup).addTo(map);
      el.addEventListener("click", () => setActive(v.id));
      markersRef.current.set(v.id, m);
      bounds.extend([v.lng as number, v.lat as number]);
    }
    if (geo.length === 1) {
      map.flyTo({ center: [geo[0].lng as number, geo[0].lat as number], zoom: 13, duration: 0 });
    } else if (geo.length > 1) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 0 });
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

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy("add");
    try {
      await api("/admin/venues", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          city: form.city,
          address: form.address,
          capacity: Number(form.capacity) || 0,
          coverUrl: form.coverUrl,
          ...(form.lat !== "" && !Number.isNaN(Number(form.lat)) ? { lat: Number(form.lat) } : {}),
          ...(form.lng !== "" && !Number.isNaN(Number(form.lng)) ? { lng: Number(form.lng) } : {}),
        }),
      });
      setForm({ ...EMPTY });
      setSlugTouched(false);
      setPlacing(false);
      clearTemp();
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(v: Venue) {
    if (!confirm(`${v.name} mekanı silinsin mi?`)) return;
    setBusy(v.id);
    try {
      await api(`/admin/venues/${v.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const input =
    "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50";
  const tl = (n: number) => new Intl.NumberFormat("tr-TR").format(n || 0);

  return (
    <div>
      <AdminPageHeader title="Mekanlar" subtitle={`${rows.length} mekan`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam mekan", v: tl(stats.total), c: "text-foreground" },
          { l: "Şu an canlı", v: tl(stats.live), c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Yaklaşan etkinlikli", v: tl(stats.upcoming), c: "text-violet-600 dark:text-violet-400" },
          { l: "Konumsuz", v: tl(stats.noGeo), c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* create formu */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="h-4 w-4 text-primary" /> Yeni mekan ekle
        </div>
        <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={input} placeholder="Ad" value={form.name} onChange={(e) => setName(e.target.value)} required />
          <input className={input} placeholder="Slug" value={form.slug} onChange={(e) => setSlug(e.target.value)} required />
          <input className={input} placeholder="Şehir" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          <input className={input} placeholder="Adres" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <input className={input} type="number" placeholder="Kapasite" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
          <input className={input} placeholder="Kapak URL" value={form.coverUrl} onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))} />
          <input className={input} placeholder="Enlem (lat)" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
          <input className={input} placeholder="Boylam (lng)" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
          <div className="flex items-center sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => setPlacing((p) => !p)}
              disabled={!mapReady}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition disabled:opacity-50 ${
                placing
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/40"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
              title="Haritaya tıklayarak konum seç"
            >
              <Crosshair className="h-4 w-4" /> {placing ? "Haritaya tıkla…" : "Haritadan konum seç"}
            </button>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={busy === "add"}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {busy === "add" ? "Ekleniyor…" : "Ekle"}
            </button>
            {placing && (
              <span className="ml-3 text-xs text-muted-foreground">Haritaya tıkla; turuncu pini sürükleyerek ince ayar yapabilirsin.</span>
            )}
          </div>
        </form>
      </div>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
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
              className={`rounded-full px-3 py-1 text-xs transition ${
                statusFilter === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
          {cityChips.length > 0 && <span className="mx-1 h-4 w-px bg-border" />}
          {cityChips.length > 0 && (
            <button
              onClick={() => setCityFilter("all")}
              className={`rounded-full px-3 py-1 text-xs transition ${
                cityFilter === "all" ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Tüm şehirler
            </button>
          )}
          {cityChips.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                cityFilter === c ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* harita + liste */}
      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        {/* harita */}
        <div className="order-1">
          <div className="relative overflow-hidden rounded-xl border border-border">
            <div ref={mapEl} className="h-[340px] w-full bg-muted lg:h-[560px]" />
            {/* lejant */}
            <div className="pointer-events-none absolute left-3 top-3 z-[1] flex flex-wrap gap-1.5 rounded-lg bg-card/85 px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur">
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} /> Canlı</span>
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#8b5cf6" }} /> Yaklaşan</span>
              <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#94a3b8" }} /> Boşta</span>
            </div>
            {needsToken && (
              <div className="absolute inset-0 grid place-items-center bg-card/90 p-6 text-center text-sm">
                <div>
                  <MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-foreground">Harita için Mapbox token gerekli.</p>
                  <p className="mt-1 text-muted-foreground">
                    <Link href="/admin/settings" className="text-primary underline">Ayarlar</Link> → Genel → <code>maps.mapbox.token</code> alanına <code>pk.…</code> token gir.
                  </p>
                </div>
              </div>
            )}
            {mapError && !needsToken && (
              <div className="absolute inset-0 grid place-items-center bg-card/80 p-6 text-center text-sm text-muted-foreground">
                Harita yüklenemedi. Token/URL kısıtını kontrol et; listeden gezebilirsin.
              </div>
            )}
            {!mapError && !needsToken && mapReady && stats.total > 0 && stats.total === stats.noGeo && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-card/90 to-transparent p-3 text-center text-xs text-muted-foreground">
                Hiçbir mekanın konumu yok. Formdan lat/lng gir ya da "Haritadan konum seç".
              </div>
            )}
          </div>
        </div>

        {/* liste */}
        <div className="order-2">
          <div className="mb-2 text-sm text-muted-foreground">{loading ? "Yükleniyor…" : `${list.length} mekan`}</div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>}
            {!loading && list.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {rows.length === 0 ? "Henüz mekan yok." : "Bu filtreyle mekan yok."}
              </div>
            )}
            {!loading && list.length > 0 && (
              <div className="max-h-[560px] divide-y divide-border overflow-y-auto">
                {list.map((v) => {
                  const st = STATUS[v.status ?? "idle"] ?? STATUS.idle;
                  const hasGeo = v.lat != null && v.lng != null;
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center gap-3 px-3 py-3 transition-colors sm:px-4 ${
                        active === v.id ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <button
                        onClick={() => (hasGeo ? focus(v) : undefined)}
                        title={hasGeo ? "Haritada göster" : "Konum yok"}
                        className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14"
                      >
                        {v.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.coverUrl} alt={v.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/80">
                            <MapPin className="h-5 w-5" />
                          </div>
                        )}
                      </button>

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
                          {!hasGeo && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Konumsuz</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                          {v.city && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {v.city}
                            </span>
                          )}
                          {v.address && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {v.address}
                            </span>
                          )}
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

                      <div className="flex shrink-0 items-center gap-2">
                        {(v.capacity ?? 0) > 0 && (
                          <span className="hidden items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
                            <Users className="h-3 w-3" />
                            <span className="tabular-nums">{tl(v.capacity || 0)}</span>
                          </span>
                        )}
                        <button
                          disabled={busy === v.id}
                          onClick={() => remove(v)}
                          aria-label="Sil"
                          title="Sil"
                          className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
