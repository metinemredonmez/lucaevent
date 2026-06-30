"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Ticket, Heart, CalendarDays, Loader2 } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";
import { getSession, getMyBookings, getMyFavorites } from "@/lib/session";
import { formatDateTR } from "@/lib/utils";

type CalEvent = {
  id: string;
  date: Date;
  title: string;
  slug: string;
  coverUrl: string | null;
  type: "ticket" | "fav";
};

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const WD = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TakvimPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!getSession()) {
      router.replace("/giris");
      return;
    }
    let alive = true;
    Promise.all([getMyBookings().catch(() => []), getMyFavorites().catch(() => [])])
      .then(([orders, favs]) => {
        if (!alive) return;
        const list: CalEvent[] = [];
        for (const o of orders) {
          if (o.event?.startsAt) {
            list.push({ id: "t-" + o.id, date: new Date(o.event.startsAt), title: o.event.title, slug: o.event.slug, coverUrl: o.event.coverUrl, type: "ticket" });
          }
        }
        for (const f of favs) {
          if (f.event?.startsAt) {
            list.push({ id: "f-" + f.id, date: new Date(f.event.startsAt), title: f.event.title, slug: f.event.slug, coverUrl: f.event.coverUrl, type: "fav" });
          }
        }
        setEvents(list);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = ymd(e.date);
      (m.get(k) ?? m.set(k, []).get(k)!).push(e);
    }
    return m;
  }, [events]);

  // ay ızgarası (Pazartesi başlangıç)
  const grid = useMemo(() => {
    const y = cursor.getFullYear();
    const mo = cursor.getMonth();
    const first = new Date(y, mo, 1);
    const lead = (first.getDay() + 6) % 7; // Pzt=0
    const days = new Date(y, mo + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(y, mo, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events].filter((e) => e.date.getTime() >= now - 86400000).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);
  }, [events]);

  const todayKey = ymd(new Date());
  const selectedEvents = selected ? byDay.get(selected) ?? [] : [];

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-[6.5rem] pb-20">
        <div className="container max-w-5xl">
          <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Takvimim</div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">Planın bir bakışta.</h1>
          <p className="mt-2 text-muted-foreground">Biletlerin ve favori etkinliklerin tek takvimde.</p>

          {loading ? (
            <div className="mt-10 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Yükleniyor…
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* takvim */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-serif text-lg font-semibold">
                    {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Önceki ay">
                      <ChevronLeft className="size-4" />
                    </button>
                    <button onClick={() => setCursor(new Date())} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Bugün</button>
                    <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Sonraki ay">
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                  {WD.map((w) => <div key={w} className="py-1">{w}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {grid.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const k = ymd(d);
                    const evs = byDay.get(k);
                    const isToday = k === todayKey;
                    const isSel = k === selected;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelected(isSel ? null : k)}
                        className={`relative aspect-square rounded-lg border text-sm transition ${
                          isSel ? "border-primary bg-primary/10 text-foreground" : evs ? "border-border bg-muted/40 text-foreground hover:border-primary/50" : "border-transparent text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        <span className={`absolute left-1.5 top-1 ${isToday ? "font-semibold text-primary" : ""}`}>{d.getDate()}</span>
                        {evs && (
                          <span className="absolute inset-x-0 bottom-1.5 flex justify-center gap-0.5">
                            {evs.slice(0, 3).map((e, j) => (
                              <span key={j} className="size-1.5 rounded-full" style={{ background: e.type === "ticket" ? "hsl(var(--primary))" : "#f472b6" }} />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: "hsl(var(--primary))" }} /> Biletim</span>
                  <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-pink-400" /> Favorim</span>
                </div>

                {/* seçili gün */}
                {selected && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="mb-2 text-sm font-medium text-foreground">{formatDateTR(selected)}</div>
                    {selectedEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Bu günde etkinlik yok.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEvents.map((e) => <EventRow key={e.id} e={e} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* yaklaşanlar */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="size-4 text-primary" /> Yaklaşanlar
                </div>
                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
                    Henüz planın yok. <Link href="/kesfet" className="text-primary hover:underline">Etkinlik keşfet →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((e) => <EventRow key={e.id} e={e} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function EventRow({ e }: { e: CalEvent }) {
  return (
    <Link href={`/canli/${e.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition hover:border-primary/40">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        {e.coverUrl ? (
          <Image src={e.coverUrl} alt={e.title} fill sizes="48px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDateTR(e.date)}</span>
          <span className={`inline-flex items-center gap-1 ${e.type === "ticket" ? "text-primary" : "text-pink-500 dark:text-pink-400"}`}>
            {e.type === "ticket" ? <><Ticket className="size-3" /> Bilet</> : <><Heart className="size-3" /> Favori</>}
          </span>
        </div>
      </div>
    </Link>
  );
}
