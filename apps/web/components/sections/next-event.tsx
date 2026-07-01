"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import { discoverEvents, type DiscoverEvent } from "@/lib/events";
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

/** Sıradaki (en yakın yaklaşan) etkinliğe canlı geri sayım — güzel reklam. Yaklaşan yoksa gizlenir. */
export function NextEvent() {
  const [ev, setEv] = useState<DiscoverEvent | null>(null);
  const [now, setNow] = useState(0); // 0 = henüz mount olmadı (SSR/hydration güvenli)

  useEffect(() => {
    discoverEvents({ range: "upcoming", take: 1 })
      .then((r) => setEv(r[0] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!ev || now === 0) return null;

  const { d, h, m, s } = breakdown(new Date(ev.startsAt).getTime() - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells: [string, number][] = [
    ["Gün", d],
    ["Saat", h],
    ["Dak", m],
    ["Sn", s],
  ];

  return (
    <section className="container pt-4">
      <Link
        href={`/etkinlik/${ev.slug}`}
        className="group flex flex-col gap-4 rounded-2xl border border-primary/25 bg-gradient-to-r from-[#6366F1]/12 via-card to-[#8B5CF6]/12 p-4 transition-colors hover:border-primary/45 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-sm">
            <CalendarClock className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="mb-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Sıradaki etkinlik
            </div>
            <div className="truncate font-serif text-lg font-semibold leading-tight">{ev.title}</div>
            <div className="truncate text-xs text-muted-foreground">
              {formatDateTR(ev.startsAt)}
              {ev.venue?.name ? ` · ${ev.venue.name}` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {cells.map(([label, val]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-mono text-2xl font-semibold tabular-nums text-foreground sm:size-14 sm:text-[26px]">
                {pad(val)}
              </div>
              <div className="mt-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
          <ArrowRight className="hidden size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1 sm:block" />
        </div>
      </Link>
    </section>
  );
}
