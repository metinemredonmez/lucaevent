"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, CalendarDays, Loader2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { discoverEvents, type DiscoverEvent } from "@/lib/events";
import { formatDateTR } from "@/lib/utils";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";

const RANGES = [
  { v: "upcoming", l: "Yaklaşan" },
  { v: "today", l: "Bugün" },
  { v: "tomorrow", l: "Yarın" },
  { v: "weekend", l: "Hafta sonu" },
  { v: "past", l: "Geçmiş" },
] as const;
type Range = (typeof RANGES)[number]["v"];

// API kategori slug'ı → web taksonomisi (chip'ler web slug kullanıyor).
const API_ALIAS: Record<string, string> = {
  "outdoor-spor": "outdoor",
  "gezi-seyahat": "gezi",
  "food-drink": "food",
};
const webCat = (slug?: string | null) => (slug ? API_ALIAS[slug] ?? slug : "");

const ISTANBUL: [number, number] = [41.0082, 28.9784];

function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (w.__leafletLoading) return w.__leafletLoading;
  w.__leafletLoading = new Promise((resolve, reject) => {
    if (!document.querySelector("link[data-leaflet]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      css.setAttribute("data-leaflet", "");
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.onload = () => resolve(w.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return w.__leafletLoading;
}

export default function KesfetPage() {
  const [all, setAll] = useState<DiscoverEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("upcoming");
  const [cat, setCat] = useState<string>("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  // Ana sayfadan gelen ?kategori=<webslug> → kategoriyi ön-seç (useSearchParams yerine
  // window ile: statik route'u dinamiğe zorlamaz, Suspense gerektirmez).
  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("kategori");
    if (k && CATEGORIES.some((c) => c.slug === k)) setCat(k);
  }, []);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const Lref = useRef<any>(null);

  // sunucudan range'e göre çek
  useEffect(() => {
    let alive = true;
    setLoading(true);
    discoverEvents({ range, take: 100 })
      .then((rows) => alive && setAll(rows))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  // kategori + arama client-side filtre
  const events = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((e) => {
      if (cat && webCat(e.category?.slug) !== cat) return false;
      if (!term) return true;
      return (
        e.title.toLowerCase().includes(term) ||
        e.venue?.name?.toLowerCase().includes(term) ||
        e.category?.name?.toLowerCase().includes(term)
      );
    });
  }, [all, cat, q]);

  const geoEvents = useMemo(
    () => events.filter((e) => e.venue?.lat != null && e.venue?.lng != null),
    [events],
  );

  // haritayı bir kez kur
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        Lref.current = L;
        const map = L.map(mapEl.current, { scrollWheelZoom: false, attributionControl: true }).setView(
          ISTANBUL,
          11,
        );
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap · © CARTO",
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setMapError(false);
      })
      .catch(() => setMapError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // veriler/filtre değişince işaretçileri yenile
  useEffect(() => {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current.clear();

    const icon = (on: boolean) =>
      L.divIcon({
        className: "",
        html: `<span style="display:block;width:${on ? 22 : 16}px;height:${on ? 22 : 16}px;border-radius:50%;background:#8B5CF6;border:2px solid #fff;box-shadow:0 0 0 3px rgba(139,92,246,${on ? 0.5 : 0.25})"></span>`,
        iconSize: [on ? 22 : 16, on ? 22 : 16],
        iconAnchor: [on ? 11 : 8, on ? 11 : 8],
      });

    const pts: [number, number][] = [];
    for (const e of geoEvents) {
      const lat = e.venue!.lat!;
      const lng = e.venue!.lng!;
      pts.push([lat, lng]);
      const m = L.marker([lat, lng], { icon: icon(false) })
        .addTo(map)
        .bindPopup(
          `<strong>${e.title}</strong><br/>${e.venue?.name ?? ""}${
            e.venue?.city ? " · " + e.venue.city : ""
          }<br/><span style="color:#8B5CF6">${formatDateTR(e.startsAt)}</span>`,
        );
      m.on("click", () => setActive(e.id));
      markersRef.current.set(e.id, m);
    }
    if (pts.length) {
      map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView(ISTANBUL, 11);
    }
  }, [geoEvents]);

  // aktif kart → haritada uç + popup
  function focus(e: DiscoverEvent) {
    setActive(e.id);
    const map = mapRef.current;
    const m = markersRef.current.get(e.id);
    if (map && m && e.venue?.lat != null && e.venue?.lng != null) {
      map.flyTo([e.venue.lat, e.venue.lng], 14, { duration: 0.6 });
      m.openPopup();
    }
  }

  return (
    <>
      <Nav />
      <main className="pt-24 md:pt-28 pb-16">
      <div className="container">
        <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Keşfet</div>
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">Şehirde ne var?</h1>
        <p className="mt-2 text-muted-foreground">Haritada gez, filtrele, sana yakın anı bul.</p>

        {/* filtreler */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r.v}
                onClick={() => setRange(r.v)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  range === r.v
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.l}
              </button>
            ))}
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Etkinlik, mekan ara…"
                className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-8 text-sm outline-none focus:border-primary/50"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Temizle">
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCat("")}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                cat === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              Tümü
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCat(cat === c.slug ? "" : c.slug)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  cat === c.slug ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* harita + liste */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.05fr]">
          {/* liste */}
          <div className="order-2 lg:order-1">
            <div className="mb-3 text-sm text-muted-foreground">
              {loading ? "Yükleniyor…" : `${events.length} etkinlik`}
            </div>
            <div className="space-y-3">
              {loading && (
                <div className="flex items-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Yükleniyor…
                </div>
              )}
              {!loading && events.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-10 text-center text-muted-foreground">
                  Bu filtreyle etkinlik yok. Filtreleri değiştir.
                </div>
              )}
              {events.map((e) => (
                <div
                  key={e.id}
                  onClick={() => focus(e)}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-card p-3 text-left transition ${
                    active === e.id ? "border-primary/60 ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {e.coverUrl ? (
                      <Image src={e.coverUrl} alt={e.title} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {e.category && (
                      <span className="text-[11px] uppercase tracking-wide text-primary">{e.category.name}</span>
                    )}
                    <div className="truncate font-serif text-base font-semibold">{e.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" /> {formatDateTR(e.startsAt)}
                      </span>
                      {e.venue?.name && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {e.venue.name}
                          {e.venue.city ? `, ${e.venue.city}` : ""}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/etkinlik/${e.slug}`}
                      onClick={(ev) => ev.stopPropagation()}
                      className="mt-1.5 inline-block text-xs text-primary hover:underline"
                    >
                      Detayı gör →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* harita */}
          <div className="order-1 lg:order-2">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-border">
              <div ref={mapEl} className="h-[320px] w-full bg-muted lg:h-[calc(100vh-9rem)]" />
              {mapError && (
                <div className="absolute inset-0 grid place-items-center bg-card/80 p-6 text-center text-sm text-muted-foreground">
                  Harita yüklenemedi. Listeden gezebilirsin.
                </div>
              )}
              {!mapError && geoEvents.length === 0 && !loading && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/90 to-transparent p-3 text-center text-xs text-muted-foreground">
                  Bu filtrede konumlu etkinlik yok.
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
