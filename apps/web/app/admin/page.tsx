"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  ClipboardList,
  XCircle,
  ArrowRight,
  Ticket,
  TicketPercent,
  Plus,
  Bell,
  ScanLine,
  Inbox,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  Trophy,
  Users,
  UserPlus,
  AlertTriangle,
  Flame,
  Hourglass,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader, LiveClock, MetaPill } from "@/components/admin/page-header";
import {
  CountUp,
  Sparkline,
  MeterBar,
  CategoryDonut,
  OccupancyRing,
  AreaTrend,
} from "@/components/admin/dashboard/charts";

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
  topEvent: { id: string; title: string; soldUnits: number; revenueMinor: number } | null;
};
type DaySales = { date: string; revenueMinor: number; paidOrders: number };
type DayCount = { date: string; count: number };
type Extras = {
  revenueSeries: DaySales[];
  ordersSeries: DayCount[];
  reservationsSeries: DayCount[];
  categoryCounts: { name: string; slug: string | null; count: number }[];
  eventStatusCounts: Record<string, number>;
  newSubmissions: number;
  pendingOrders: number;
  pendingReservations: number;
  topEvents: { id: string; title: string; coverUrl: string | null; soldUnits: number; revenueMinor: number }[];
  activity: { type: "reservation" | "submission" | "event"; id: string; label: string; createdAt: string; status: string; href: string }[];
  upcomingEvents: { id: string; title: string; slug: string; startsAt: string; status: string; sold: number; capacity: number }[];
  today: { eventsToday: number; checkinsToday: number };
  members: { total: number; today: number; week: number; series: DayCount[] };
  waitlistSummary: { eventId: string; title: string; waiting: number }[];
};
type Ev = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  coverUrl?: string | null;
  category?: { name: string } | null;
};

const tl = (minor: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
    (minor || 0) / 100,
  );
const pct = (x: number) => `%${Math.round((x || 0) * 100)}`;

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "text-emerald-600 dark:text-emerald-400",
  DRAFT: "text-muted-foreground",
  SCHEDULED: "text-sky-600 dark:text-sky-400",
  CANCELED: "text-rose-600 dark:text-rose-400",
  ARCHIVED: "text-muted-foreground",
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const g = Math.floor(h / 24);
  if (g < 7) return `${g} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function deriveExtras(stats: Stats | null, events: Ev[]): Extras {
  const cat = new Map<string, number>();
  for (const e of events) {
    const n = e.category?.name ?? "Kategorisiz";
    cat.set(n, (cat.get(n) ?? 0) + 1);
  }
  const status: Record<string, number> = { PUBLISHED: 0, DRAFT: 0, SCHEDULED: 0, CANCELED: 0, ARCHIVED: 0 };
  for (const e of events) status[e.status] = (status[e.status] ?? 0) + 1;
  const zeroDays = (n: number): DayCount[] => Array.from({ length: n }, () => ({ date: "", count: 0 }));
  return {
    revenueSeries: Array.from({ length: 30 }, () => ({ date: "", revenueMinor: 0, paidOrders: 0 })),
    ordersSeries: zeroDays(14),
    reservationsSeries: zeroDays(14),
    categoryCounts: [...cat.entries()].map(([name, count]) => ({ name, slug: null, count })),
    eventStatusCounts: status,
    newSubmissions: 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    pendingReservations: stats?.pendingReservations ?? 0,
    topEvents: [],
    activity: [],
    upcomingEvents: events
      .filter((e) => new Date(e.startsAt).getTime() > Date.now())
      .slice(0, 12)
      .map((e) => ({ id: e.id, title: e.title, slug: "", startsAt: e.startsAt, status: e.status, sold: 0, capacity: 0 })),
    today: { eventsToday: 0, checkinsToday: 0 },
    members: { total: 0, today: 0, week: 0, series: zeroDays(14) },
    waitlistSummary: [],
  };
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>;
}
function CardHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
          Tümü <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function KpiTile({
  icon: Icon,
  accent,
  label,
  value,
  sub,
  spark,
  meter,
  href,
}: {
  icon: typeof TrendingUp;
  accent: string;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  spark?: number[];
  meter?: number;
  href?: string;
}) {
  const inner = (
    <div className="group h-full rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-start justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}22`, color: accent }}>
          <Icon className="h-4 w-4" />
        </span>
        {spark ? (
          <Sparkline data={spark} color={accent} />
        ) : href ? (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      {meter !== undefined && (
        <div className="mt-2.5">
          <MeterBar value={meter} color={accent} />
        </div>
      )}
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const WARN = "hsl(var(--warn))";
function QueueRow({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: typeof Inbox;
  label: string;
  count: number;
  href?: string;
}) {
  const zero = count === 0;
  const body = (
    <div
      className="flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 transition-colors hover:bg-muted/40"
      style={{
        borderLeftColor: zero ? "transparent" : WARN,
        background: zero ? undefined : "hsl(var(--warn) / 0.06)",
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={
          zero
            ? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
            : { background: "hsl(var(--warn) / 0.15)", color: WARN }
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-[13px] text-foreground">{label}</span>
      {zero ? (
        <span className="flex items-center gap-1 text-xs text-emerald-500">
          <Check className="h-3.5 w-3.5" /> Sıra temiz
        </span>
      ) : (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
          style={{ background: "hsl(var(--warn) / 0.15)", color: WARN }}
        >
          {count}
        </span>
      )}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const ACT_ICON = { reservation: CalendarCheck, submission: Inbox, event: CalendarPlus };
const ACT_COLOR = { reservation: "#22D3EE", submission: "#22c9b8", event: "#34D399" };
function ActivityRow({ a }: { a: Extras["activity"][number] }) {
  const Icon = ACT_ICON[a.type] ?? Inbox;
  return (
    <Link href={a.href} className="-mx-1 flex items-start gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/40">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ACT_COLOR[a.type]}22`, color: ACT_COLOR[a.type] }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{a.label}</div>
        <div className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</div>
      </div>
    </Link>
  );
}

type Coupon = { id: string; code: string; usedCount: number; maxUses: number | null; isActive: boolean };

const fmtShort = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "—";

/* ——— Bugün özeti şeridi ——— */
function TodayStrip({ ext, revToday, revYest }: { ext: Extras; revToday: number; revYest: number }) {
  const items = [
    { icon: CalendarClock, label: "Bugün etkinlik", value: String(ext.today.eventsToday) },
    { icon: ScanLine, label: "Bugün check-in", value: String(ext.today.checkinsToday) },
    { icon: UserPlus, label: "Yeni üye · hafta", value: `+${ext.members.week}`, sub: `${ext.members.total} toplam` },
    { icon: TrendingUp, label: "Bugün gelir", value: tl(revToday), sub: revYest > 0 ? `dün ${tl(revYest)}` : undefined },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <it.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tabular-nums text-foreground">{it.value}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {it.label}
              {it.sub ? ` · ${it.sub}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ——— Dikkat paneli (uyarılar) ——— */
const ALERT_STYLE = {
  danger: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.08)" },
  warn: { color: "hsl(var(--warn))", bg: "hsl(var(--warn) / 0.08)" },
  info: { color: "#38BDF8", bg: "rgba(56,189,248,0.08)" },
};
function AlertsPanel({ ext }: { ext: Extras }) {
  const soon = Date.now() + 14 * 864e5;
  type Al = { kind: keyof typeof ALERT_STYLE; icon: typeof Flame; text: string; href: string };
  const alerts: Al[] = [];
  for (const e of ext.upcomingEvents) {
    const t = new Date(e.startsAt).getTime();
    const occ = e.capacity > 0 ? e.sold / e.capacity : 0;
    if ((e.status === "DRAFT" || e.status === "SCHEDULED") && t < soon)
      alerts.push({ kind: "danger", icon: AlertTriangle, text: `Yaklaşıyor ama yayında değil — ${e.title}`, href: `/admin/events/${e.id}/edit` });
    else if (e.status === "PUBLISHED" && e.capacity > 0 && occ >= 0.9)
      alerts.push({ kind: "warn", icon: Flame, text: `Son kontenjan — ${e.title} (%${Math.round(occ * 100)})`, href: `/admin/events/${e.id}/attendees` });
    else if (e.status === "PUBLISHED" && e.capacity > 0 && occ < 0.2 && t < soon)
      alerts.push({ kind: "info", icon: TrendingDown, text: `Az satıyor — ${e.title} (%${Math.round(occ * 100)})`, href: `/admin/events/${e.id}/edit` });
  }
  const top = alerts.slice(0, 6);
  return (
    <Card>
      <CardHead title="Dikkat gerektirenler" />
      <div className="space-y-1.5 p-3">
        {top.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-emerald-500">
            <ShieldCheck className="h-4 w-4" /> Her şey yolunda
          </div>
        ) : (
          top.map((a, i) => {
            const st = ALERT_STYLE[a.kind];
            return (
              <Link
                key={i}
                href={a.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:brightness-110"
                style={{ background: st.bg }}
              >
                <a.icon className="h-4 w-4 shrink-0" style={{ color: st.color }} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{a.text}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}

/* ——— Etkinlik doluluğu listesi ——— */
function OccupancyList({ ext }: { ext: Extras }) {
  const rows = ext.upcomingEvents.filter((e) => e.status !== "CANCELED").slice(0, 7);
  return (
    <Card>
      <CardHead title="Etkinlik doluluğu" href="/admin/events" />
      <div className="divide-y divide-border">
        {rows.map((e) => {
          const occ = e.capacity > 0 ? e.sold / e.capacity : 0;
          return (
            <Link key={e.id} href={`/admin/events/${e.id}/attendees`} className="block px-4 py-2.5 transition-colors hover:bg-muted/40">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{e.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {e.capacity > 0 ? `${e.sold}/${e.capacity}` : fmtShort(e.startsAt)}
                </span>
              </div>
              {e.capacity > 0 && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, occ * 100)}%`, background: occ >= 0.9 ? "hsl(var(--warn))" : "hsl(var(--primary))" }}
                  />
                </div>
              )}
            </Link>
          );
        })}
        {rows.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Yaklaşan etkinlik yok.</div>}
      </div>
    </Card>
  );
}

/* ——— Top etkinlikler ——— */
function TopEventsPanel({ ext }: { ext: Extras }) {
  const hasRevenue = ext.topEvents.length > 0;
  const rows = hasRevenue
    ? ext.topEvents.map((t) => ({ id: t.id, title: t.title, right: tl(t.revenueMinor), sub: `${t.soldUnits} bilet` }))
    : [...ext.upcomingEvents]
        .filter((e) => e.capacity > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((e) => ({ id: e.id, title: e.title, right: `${e.sold}`, sub: `%${e.capacity > 0 ? Math.round((e.sold / e.capacity) * 100) : 0} dolu` }));
  return (
    <Card>
      <CardHead title={hasRevenue ? "En çok gelir" : "En çok ilgi gören"} href="/admin/events" />
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <Link key={r.id} href={`/admin/events/${r.id}/attendees`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{r.title}</span>
            <span className="shrink-0 text-right">
              <span className="block text-[13px] font-semibold tabular-nums text-foreground">{r.right}</span>
              <span className="block text-[11px] text-muted-foreground">{r.sub}</span>
            </span>
          </Link>
        ))}
        {rows.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Henüz veri yok.</div>}
      </div>
    </Card>
  );
}

/* ——— Bekleme listesi özeti ——— */
function WaitlistPanel({ ext }: { ext: Extras }) {
  return (
    <Card>
      <CardHead title="Bekleme listesi" />
      <div className="divide-y divide-border">
        {ext.waitlistSummary.map((w) => (
          <Link key={w.eventId} href={`/admin/events/${w.eventId}/waitlist`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
            <Hourglass className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{w.title}</span>
            <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-600 dark:text-amber-400">{w.waiting}</span>
          </Link>
        ))}
        {ext.waitlistSummary.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Bekleyen yok.</div>}
      </div>
    </Card>
  );
}

/* ——— Kupon kullanımı ——— */
function CouponsPanel({ coupons }: { coupons: Coupon[] | null }) {
  const active = (coupons ?? []).filter((c) => c.isActive).slice(0, 5);
  return (
    <Card>
      <CardHead title="Kuponlar" href="/admin/coupons" />
      <div className="divide-y divide-border">
        {active.map((c) => {
          const ratio = c.maxUses ? c.usedCount / c.maxUses : 0;
          return (
            <div key={c.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <TicketPercent className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate font-mono text-[13px] text-foreground">{c.code}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {c.usedCount}
                  {c.maxUses ? `/${c.maxUses}` : ""} kullanım
                </span>
              </div>
              {c.maxUses ? (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                </div>
              ) : null}
            </div>
          );
        })}
        {active.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aktif kupon yok.</div>}
      </div>
    </Card>
  );
}

/* ——— Zaman aralığı segmenti ——— */
function RangeToggle({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
      {[7, 14, 30].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`rounded-md px-2 py-1 text-xs transition-colors ${
            value === n ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {n}g
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [x, setX] = useState<Extras | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [range, setRange] = useState(30);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Ev[]>("/admin/events?take=100").then(setEvents).catch(() => {});
    api<Coupon[]>("/admin/coupons").then(setCoupons).catch(() => setCoupons(null));
    api<Stats>("/admin/stats")
      .then(setS)
      .catch((e) => setErr(e.message));
    // Rich extras — if the endpoint is missing (pre-deploy), the render falls
    // back to client-derived data via `x ?? deriveExtras(s, events)`.
    api<Extras>("/admin/stats/dashboard")
      .then(setX)
      .catch(() => setX(null));
  }, []);

  const ext = x ?? deriveExtras(s, events);
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.startsAt).getTime() > now && e.status !== "CANCELED")
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 6);

  const longDate = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  const totalOrders = (s?.paidOrders ?? 0) + (s?.pendingOrders ?? 0) + (s?.canceledOrders ?? 0);
  const conv = totalOrders > 0 ? (s?.paidOrders ?? 0) / totalOrders : 0;
  const publishRate = s && s.totalEvents > 0 ? s.publishedEvents / s.totalEvents : 0;
  const salesZero = (s?.totalSalesMinor ?? 0) === 0;

  const spotlight =
    ext.topEvents[0] ??
    (upcoming[0]
      ? { id: upcoming[0].id, title: upcoming[0].title, coverUrl: upcoming[0].coverUrl ?? null, soldUnits: 0, revenueMinor: 0 }
      : null);
  const spotlightIsTop = !!ext.topEvents[0];

  const revToday = ext.revenueSeries.at(-1)?.revenueMinor ?? 0;
  const revYest = ext.revenueSeries.at(-2)?.revenueMinor ?? 0;
  const trendSeries = ext.revenueSeries.slice(-range);

  return (
    <div>
      <AdminPageHeader
        hero
        greeting
        eyebrow="Komuta Merkezi"
        title="Dashboard"
        subtitle="Bugünün özeti, operasyon kuyrukları ve canlı hareketler."
        actions={
          <>
            <Link
              href="/admin/events/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Yeni etkinlik
            </Link>
            <Link href="/admin/notifications" aria-label="Bildirim gönder" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              <Bell className="h-4 w-4" />
            </Link>
            <Link href="/admin/check-in" aria-label="Check-in" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              <ScanLine className="h-4 w-4" />
            </Link>
          </>
        }
        meta={
          <>
            <MetaPill>{longDate}</MetaPill>
            <MetaPill>
              <Clock className="h-3 w-3" /> <LiveClock />
            </MetaPill>
            <MetaPill dot="live">Canlı</MetaPill>
            {s && (
              <MetaPill>
                {s.totalEvents} etkinlik · {s.publishedEvents} yayında
              </MetaPill>
            )}
          </>
        }
      />

      {err && !s && <p className="text-sm text-destructive">{err}</p>}
      {!s && !err && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}

      {s && (
        <div className="space-y-4">
          {/* bugün özeti şeridi */}
          <Reveal delay={0.01}>
            <TodayStrip ext={ext} revToday={revToday} revYest={revYest} />
          </Reveal>

          {/* KPI rayı */}
          <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4" delay={0.02}>
            <KpiTile
              icon={TrendingUp}
              accent={salesZero ? "#9CA3AF" : "#34D399"}
              label="Toplam satış"
              value={<CountUp value={s.totalSalesMinor} format={tl} />}
              sub={`${s.paidOrders} ödenmiş sipariş`}
              spark={ext.revenueSeries.map((d) => d.revenueMinor)}
            />
            <KpiTile
              icon={Gauge}
              accent="#38BDF8"
              label="Doluluk"
              value={<CountUp value={s.occupancyRate} format={pct} />}
              meter={s.occupancyRate}
            />
            <KpiTile
              icon={ClipboardList}
              accent="#22D3EE"
              label="Bekleyen rezervasyon"
              value={<CountUp value={s.pendingReservations} />}
              href="/admin/reservations"
              spark={ext.reservationsSeries.map((d) => d.count)}
            />
            <KpiTile
              icon={XCircle}
              accent="#FB7185"
              label="İptal oranı"
              value={<CountUp value={s.cancelRate} format={pct} />}
              sub={`${s.canceledOrders} iptal`}
            />
          </Reveal>

          {/* dikkat paneli */}
          <Reveal delay={0.05}>
            <AlertsPanel ext={ext} />
          </Reveal>

          {/* focal trend + ops kuyrukları */}
          <Reveal className="grid gap-3 lg:grid-cols-3" delay={0.08}>
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-[13px] font-semibold text-foreground">Gelir &amp; Sipariş</h2>
                  <p className="text-xs text-muted-foreground">Son {range} gün</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-semibold tabular-nums text-foreground">
                      {tl(trendSeries.reduce((a, d) => a + d.revenueMinor, 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trendSeries.reduce((a, d) => a + d.paidOrders, 0)} sipariş
                    </div>
                  </div>
                  <RangeToggle value={range} onChange={setRange} />
                </div>
              </div>
              <div className="p-4">
                <AreaTrend series={trendSeries} format={tl} />
              </div>
            </Card>

            <Card>
              <CardHead title="İş kuyrukları" />
              <div className="space-y-1.5 p-3">
                <QueueRow icon={ClipboardList} label="Bekleyen rezervasyon" count={ext.pendingReservations} href="/admin/reservations" />
                <QueueRow icon={Inbox} label="Yeni başvuru" count={ext.newSubmissions} href="/admin/submissions" />
                <QueueRow icon={Ticket} label="Bekleyen sipariş" count={ext.pendingOrders} />
              </div>
            </Card>
          </Reveal>

          {/* kategori dağılımı + doluluk & dönüşüm */}
          <Reveal className="grid gap-3 lg:grid-cols-2" delay={0.12}>
            <Card>
              <CardHead title="Kategori dağılımı" href="/admin/events" />
              <div className="p-5">
                <CategoryDonut data={ext.categoryCounts} />
              </div>
            </Card>
            <Card>
              <CardHead title="Doluluk &amp; dönüşüm" />
              <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center">
                <OccupancyRing value={s.occupancyRate} />
                <div className="w-full flex-1 space-y-4">
                  <MeterBar value={publishRate} label="Yayın oranı" right={pct(publishRate)} color="#22c9b8" />
                  {totalOrders > 0 ? (
                    <>
                      <MeterBar value={conv} label="Ödeme dönüşümü" right={pct(conv)} color="#34D399" />
                      <MeterBar value={1 - (s.cancelRate || 0)} label="Tamamlanan" right={pct(1 - (s.cancelRate || 0))} color="#38BDF8" />
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sipariş geldikçe ödeme dönüşümü ve tamamlanma oranı burada görünecek.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Reveal>

          {/* son hareketler + spotlight */}
          <Reveal className="grid gap-3 lg:grid-cols-3" delay={0.16}>
            <Card className="lg:col-span-2">
              <CardHead title="Son hareketler" />
              <div className="px-4 py-2">
                {ext.activity.length > 0 ? (
                  ext.activity.map((a) => <ActivityRow key={a.type + a.id} a={a} />)
                ) : (
                  <p className="px-1 py-8 text-center text-sm text-muted-foreground">Henüz hareket yok.</p>
                )}
              </div>
            </Card>

            {/* spotlight: en popüler ya da sıradaki etkinlik */}
            {spotlight ? (
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 p-5">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={spotlight.coverUrl ? { backgroundImage: `url(${spotlight.coverUrl})` } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0e9a8c]/30 to-[#22c9b8]/20" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-xs text-[#4C1D95] dark:text-[#7fe6da]">
                    <Trophy className="h-4 w-4" /> {spotlightIsTop ? "En popüler etkinlik" : "Sıradaki etkinlik"}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{spotlight.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {spotlightIsTop
                      ? `${spotlight.soldUnits} bilet · ${tl(spotlight.revenueMinor)}`
                      : upcoming[0]
                      ? formatDateTR(upcoming[0].startsAt)
                      : ""}
                  </div>
                  <Link href="/admin/events" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Etkinlikleri yönet <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/admin/events/new"
                className="grid place-items-center rounded-2xl border border-dashed border-border p-5 text-center transition hover:border-primary/40"
              >
                <div>
                  <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                  <div className="mt-2 text-sm font-medium text-foreground">Öne çıkan etkinlik yok</div>
                  <div className="text-xs text-muted-foreground">İlk etkinliğini ekle</div>
                </div>
              </Link>
            )}
          </Reveal>

          {/* etkinlik doluluğu + top etkinlikler */}
          <Reveal className="grid gap-3 lg:grid-cols-2" delay={0.18}>
            <OccupancyList ext={ext} />
            <TopEventsPanel ext={ext} />
          </Reveal>

          {/* bekleme listesi + kuponlar */}
          <Reveal className="grid gap-3 lg:grid-cols-2" delay={0.22}>
            <WaitlistPanel ext={ext} />
            <CouponsPanel coupons={coupons} />
          </Reveal>
        </div>
      )}
    </div>
  );
}
