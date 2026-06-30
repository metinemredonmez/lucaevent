"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Users,
  Pencil,
  MoreHorizontal,
  CalendarDays,
  MapPin,
  Eye,
  EyeOff,
  XCircle,
  Ticket,
  Radio,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Tier = { sold: number; capacity: number; priceMinor: number };
type Ev = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  status: string;
  startsAt: string;
  coverUrl?: string | null;
  liveStatus?: string;
  streamUrl?: string | null;
  category?: { name: string; slug: string } | null;
  venue?: { name: string; city: string | null } | null;
  _count?: { tickets: number; orders: number };
  tickets?: Tier[];
};

const STATUS: Record<string, { l: string; c: string }> = {
  PUBLISHED: { l: "Yayında", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  SCHEDULED: { l: "Zamanlı", c: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  DRAFT: { l: "Taslak", c: "bg-muted text-muted-foreground" },
  ARCHIVED: { l: "Arşiv", c: "bg-muted text-muted-foreground" },
  CANCELED: { l: "İptal", c: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
};
const KIND_LABEL: Record<string, string> = {
  PARTY: "Parti",
  CAMP: "Kamp",
  TRIP: "Gezi",
  CONCERT: "Konser",
  SHOWCASE: "Showcase",
};

const FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "PUBLISHED", l: "Yayında" },
  { v: "DRAFT", l: "Taslak" },
  { v: "SCHEDULED", l: "Zamanlı" },
  { v: "ARCHIVED", l: "Arşiv" },
  { v: "CANCELED", l: "İptal" },
];

const tl = (m: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format((m || 0) / 100);

function occupancy(e: Ev) {
  const t = e.tickets ?? [];
  const sold = t.reduce((s, x) => s + (x.sold || 0), 0);
  const cap = t.reduce((s, x) => s + (x.capacity || 0), 0);
  return { sold, cap, ratio: cap > 0 ? sold / cap : 0 };
}
function priceLabel(e: Ev): string {
  const t = e.tickets ?? [];
  if (t.length === 0) return "—";
  if (t.some((x) => x.priceMinor === 0)) return "Ücretsiz";
  const min = Math.min(...t.map((x) => x.priceMinor));
  return `${tl(min)}+`;
}

export default function EventsAdmin() {
  const [rows, setRows] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"date" | "occ">("date");
  const [menu, setMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function load() {
    setLoading(true);
    api<Ev[]>("/admin/events?take=200")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function action(id: string, path: string) {
    setBusy(id);
    setMenu(null);
    try {
      await api(`/admin/events/${id}/${path}`, { method: "POST" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function setLive(id: string, live: boolean) {
    setBusy(id);
    setMenu(null);
    try {
      await api(`/admin/events/${id}/live`, { method: "POST", body: JSON.stringify({ live }) });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((e) => e.status === s).length;
    return {
      total: rows.length,
      published: by("PUBLISHED"),
      draft: by("DRAFT") + by("SCHEDULED"),
      archived: by("ARCHIVED") + by("CANCELED"),
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = rows.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!term) return true;
      return (
        e.title.toLowerCase().includes(term) ||
        e.venue?.name?.toLowerCase().includes(term) ||
        e.category?.name?.toLowerCase().includes(term)
      );
    });
    if (sort === "occ") out = [...out].sort((a, b) => occupancy(b).ratio - occupancy(a).ratio);
    return out;
  }, [rows, q, filter, sort]);

  return (
    <div>
      <AdminPageHeader
        title="Etkinlikler"
        subtitle={`${rows.length} etkinlik`}
        actions={
          <Link
            href="/admin/events/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yeni etkinlik
          </Link>
        }
      />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Yayında", v: stats.published, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Taslak / Zamanlı", v: stats.draft, c: "text-muted-foreground" },
          { l: "Arşiv / İptal", v: stats.archived, c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Etkinlik, mekan ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
          <button
            onClick={() => setSort(sort === "date" ? "occ" : "date")}
            className="ml-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            title="Sıralama"
          >
            {sort === "date" ? "↓ Tarih" : "↓ Doluluk"}
          </button>
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz etkinlik yok." : "Bu filtreyle etkinlik yok."}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((e) => {
            const o = occupancy(e);
            const st = STATUS[e.status] ?? { l: e.status, c: "bg-muted text-muted-foreground" };
            return (
              <div key={e.id} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4">
                {/* kapak */}
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
                  {e.coverUrl ? (
                    <Image src={e.coverUrl} alt={e.title} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/80">
                      <Ticket className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* başlık + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{e.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${st.c}`}>{st.l}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{KIND_LABEL[e.kind] ?? e.kind}</span>
                    {e.category?.name && <span className="text-primary">{e.category.name}</span>}
                    {e.venue?.name && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.venue.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {formatDateTR(e.startsAt)}
                    </span>
                  </div>
                </div>

                {/* doluluk */}
                <div className="hidden w-32 shrink-0 md:block">
                  {o.cap > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="tabular-nums">
                          {o.sold}/{o.cap}
                        </span>
                        <span className="tabular-nums">%{Math.round(o.ratio * 100)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, o.ratio * 100)}%`,
                            background: o.ratio >= 0.9 ? "hsl(var(--warn))" : "hsl(var(--primary))",
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/60">{priceLabel(e)}</div>
                  )}
                </div>

                {/* aksiyonlar */}
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/events/${e.id}/attendees`}
                    aria-label="Katılımcılar"
                    className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:text-foreground"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/events/${e.id}/edit`}
                    aria-label="Düzenle"
                    className="grid size-8 place-items-center rounded-md border border-border text-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <div className="relative" ref={menu === e.id ? menuRef : undefined}>
                    <button
                      disabled={busy === e.id}
                      onClick={() => setMenu(menu === e.id ? null : e.id)}
                      aria-label="Diğer işlemler"
                      className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menu === e.id && (
                      <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl">
                        {e.status !== "PUBLISHED" && e.status !== "CANCELED" && (
                          <button
                            onClick={() => action(e.id, "publish")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-muted dark:text-emerald-400"
                          >
                            <Eye className="h-4 w-4" /> Yayınla
                          </button>
                        )}
                        {e.status === "PUBLISHED" && (
                          <button
                            onClick={() => action(e.id, "unpublish")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                          >
                            <EyeOff className="h-4 w-4" /> Geri çek
                          </button>
                        )}
                        {e.status === "PUBLISHED" && e.liveStatus === "LIVE" && (
                          <>
                            <button
                              onClick={() => setLive(e.id, false)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Radio className="h-4 w-4" /> Yayını bitir
                            </button>
                            <a
                              href={`/canli/${e.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMenu(null)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" /> Canlı sayfası
                            </a>
                          </>
                        )}
                        {e.status === "PUBLISHED" && e.liveStatus !== "LIVE" && (
                          <button
                            onClick={() => setLive(e.id, true)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-muted dark:text-emerald-400"
                          >
                            <Radio className="h-4 w-4" /> Yayına başla
                          </button>
                        )}
                        {e.status !== "CANCELED" && (
                          <button
                            onClick={() => {
                              if (confirm(`"${e.title}" iptal edilsin mi? Ödenmiş biletler iade edilir.`)) action(e.id, "cancel");
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" /> İptal et
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
