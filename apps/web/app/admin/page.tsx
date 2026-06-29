"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CalendarDays,
  Gauge,
  XCircle,
  Clock,
  ClipboardList,
  Trophy,
  ArrowRight,
  Ticket,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";

type Stats = {
  totalEvents: number;
  publishedEvents: number;
  totalSalesMinor: number;
  paidOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  cancelRate: number;
  pendingReservations: number;
  occupancyRate: number;
  topEvent: { title: string; soldUnits: number; revenueMinor: number } | null;
};
type Ev = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  category?: { name: string } | null;
};

const tl = (minor: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
    (minor || 0) / 100,
  );
const pct = (x: number) => `%${Math.round((x || 0) * 100)}`;

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "text-emerald-400",
  DRAFT: "text-muted-foreground",
  SCHEDULED: "text-sky-400",
  CANCELED: "text-rose-400",
  ARCHIVED: "text-muted-foreground",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  href,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="group relative h-full rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {href && (
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        )}
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/60">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Stats>("/admin/stats").then(setS).catch((e) => setErr(e.message));
    api<Ev[]>("/admin/events?take=50").then(setEvents).catch(() => {});
  }, []);

  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.startsAt).getTime() > now && e.status !== "CANCELED")
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 6);

  return (
    <div>
      <h1 className="text-3xl text-foreground mb-1" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
        Dashboard
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Genel bakış ve satış özeti.</p>

      {err && <p className="text-rose-400 text-sm">{err}</p>}
      {!s && !err && <p className="text-muted-foreground text-sm">Yükleniyor…</p>}

      {s && (
        <div className="space-y-5">
          {/* ana metrikler */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={TrendingUp} accent="#34D399" label="Toplam satış" value={tl(s.totalSalesMinor)} sub={`${s.paidOrders} ödenmiş sipariş`} />
            <StatCard icon={CalendarDays} accent="#8B5CF6" label="Etkinlik" value={String(s.totalEvents)} sub={`${s.publishedEvents} yayında`} href="/admin/events" />
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#38BDF822", color: "#38BDF8" }}>
                  <Gauge className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{pct(s.occupancyRate)}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">Doluluk</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.min(100, Math.round((s.occupancyRate || 0) * 100))}%` }} />
              </div>
            </div>
            <StatCard icon={XCircle} accent="#FB7185" label="İptal oranı" value={pct(s.cancelRate)} sub={`${s.canceledOrders} iptal`} />
          </div>

          {/* ikincil */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={Clock} accent="#FBBF24" label="Bekleyen sipariş" value={String(s.pendingOrders)} />
            <StatCard icon={ClipboardList} accent="#22D3EE" label="Bekleyen rezervasyon" value={String(s.pendingReservations)} href="/admin/reservations" />
            {/* en popüler — gradient öne çıkan */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/10 p-5">
              <div className="flex items-center gap-2 text-xs text-[#C4B5FD]">
                <Trophy className="h-4 w-4" /> En popüler etkinlik
              </div>
              {s.topEvent ? (
                <>
                  <div className="mt-2 line-clamp-2 text-base font-semibold text-foreground">{s.topEvent.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.topEvent.soldUnits} bilet · {tl(s.topEvent.revenueMinor)}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">Henüz satış yok.</div>
              )}
            </div>
          </div>

          {/* yaklaşan etkinlikler */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Yaklaşan etkinlikler</h2>
              <Link href="/admin/events" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                Tümü <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcoming.map((e) => (
                <Link key={e.id} href={`/admin/events/${e.id}/attendees`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Ticket className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.category?.name ?? "—"} · {formatDateTR(e.startsAt)}</div>
                  </div>
                  <span className={`text-xs ${STATUS_COLOR[e.status] ?? "text-muted-foreground"}`}>{e.status}</span>
                </Link>
              ))}
              {upcoming.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Yaklaşan etkinlik yok.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
