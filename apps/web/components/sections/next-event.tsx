"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ArrowRight, ArrowUpRight, CalendarPlus, Users, Radio } from "lucide-react";
import { discoverEvents, getEvent, eventIcsUrl, type DiscoverEvent, type EventDetail } from "@/lib/events";
import { formatDateTR } from "@/lib/utils";

function breakdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/** Sıradaki (en yakın yaklaşan) etkinliğe canlı geri sayım + kapak, kapasite, aksiyonlar. */
export function NextEvent() {
  const [ev, setEv] = useState<DiscoverEvent | null>(null);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [now, setNow] = useState(0); // 0 = henüz mount olmadı (SSR/hydration güvenli)

  useEffect(() => {
    discoverEvents({ range: "upcoming", take: 1 })
      .then((r) => {
        const first = r[0] ?? null;
        setEv(first);
        if (first) getEvent(first.slug).then(setDetail).catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!ev || now === 0) return null;

  const startMs = new Date(ev.startsAt).getTime();
  const endMs = detail?.endsAt ? new Date(detail.endsAt).getTime() : startMs + 4 * 3600_000;
  const isLive = startMs <= now && endMs >= now;
  const { d, h, m, s } = breakdown(startMs - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells: [string, number][] = [
    ["Gün", d],
    ["Saat", h],
    ["Dak", m],
    ["Sn", s],
  ];

  // kapasite (bilet toplamı) — varsa doluluk göster
  const cap = detail?.tickets?.reduce((a, t) => a + (t.capacity ?? 0), 0) ?? 0;
  const sold = detail?.tickets?.reduce((a, t) => a + (t.sold ?? 0), 0) ?? 0;
  const cover = ev.coverUrl || detail?.coverUrl;

  return (
    <section className="container pt-4">
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-[#0e9a8c]/10 via-card to-[#22c9b8]/10">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* sol: kapak + bilgi */}
          <div className="flex min-w-0 items-center gap-3.5">
            <Link href={`/etkinlik/${ev.slug}`} className="group relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-[72px]">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={ev.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-white">
                  <CalendarClock className="size-6" />
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                  </span>
                  {isLive ? "Şu an canlı" : "Sıradaki etkinlik"}
                </span>
                {ev.category?.name && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{ev.category.name}</span>
                )}
              </div>
              <Link href={`/etkinlik/${ev.slug}`} className="block truncate font-serif text-lg font-semibold leading-tight hover:text-primary">
                {ev.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                <span className="truncate">{formatDateTR(ev.startsAt)}{ev.venue?.name ? ` · ${ev.venue.name}` : ""}</span>
                {cap > 0 && (
                  <span className="inline-flex items-center gap-1"><Users className="size-3" /> {sold}/{cap} kişi</span>
                )}
              </div>
            </div>
          </div>

          {/* sağ: geri sayım */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {cells.map(([label, val]) => (
              <div key={label} className="flex flex-col items-center">
                <div className="grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-mono text-2xl font-semibold tabular-nums text-foreground sm:size-14 sm:text-[26px]">
                  {pad(val)}
                </div>
                <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* aksiyon çubuğu */}
        <div className="flex flex-wrap items-center gap-2 border-t border-primary/15 bg-background/30 px-4 py-2.5">
          {isLive ? (
            <Link href={`/canli/${ev.slug}`} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-red-600">
              <Radio className="size-4" /> Canlı İzle
            </Link>
          ) : (
            <Link href={`/etkinlik/${ev.slug}`} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90">
              Detay / Katıl <ArrowRight className="size-4" />
            </Link>
          )}
          <a href={eventIcsUrl(ev.slug)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            <CalendarPlus className="size-4" /> Takvime ekle
          </a>
          <Link href="/kesfet" className="ml-auto inline-flex items-center gap-1 text-sm text-primary transition hover:gap-1.5">
            Tüm program <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
