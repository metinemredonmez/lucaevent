"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Trophy, Compass, ArrowRight } from "lucide-react";
import { getLiveEvents, getTopMembers, type LiveEvent, type TopMember } from "@/lib/events";

/** Ana sayfa mini vitrini: şu an canlı yayın + en aktifler + keşfet kancası.
 *  Veri yoksa hiç render etmez (boş bölüm bırakmaz). */
export function Showcase() {
  const [live, setLive] = useState<LiveEvent[]>([]);
  const [top, setTop] = useState<TopMember[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([getLiveEvents(), getTopMembers(5)])
      .then(([l, t]) => { setLive(l); setTop(t); })
      .finally(() => setReady(true));
  }, []);

  if (!ready || (live.length === 0 && top.length === 0)) return null;
  const liveEv = live[0];

  return (
    <section className="container py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Şu an</div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">Luca&apos;da neler oluyor?</h2>
        </div>
        <Link href="/kesfet" className="hidden shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
          <Compass className="size-4" /> Haritada keşfet
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {liveEv ? (
          <Link href={`/canli/${liveEv.slug}`} className="group relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative aspect-[16/8] w-full bg-muted">
              {liveEv.coverUrl && (
                <Image src={liveEv.coverUrl} alt={liveEv.title} fill sizes="(max-width:1024px) 100vw, 640px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                CANLI
              </span>
              <div className="absolute inset-x-4 bottom-4">
                <div className="font-serif text-lg font-semibold text-white sm:text-xl">{liveEv.title}</div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
                  <Radio className="size-4" /> Şu an canlı yayında — İzle
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/kesfet" className="group flex items-center justify-between rounded-2xl border border-border bg-gradient-to-br from-[#6366F1]/12 via-card to-card p-6">
            <div>
              <div className="font-serif text-lg font-semibold">Şehirde ne var?</div>
              <p className="mt-1 text-sm text-muted-foreground">Haritada gez, sana yakın anı bul.</p>
            </div>
            <Compass className="size-8 shrink-0 text-primary transition-transform group-hover:rotate-12" />
          </Link>
        )}

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Trophy className="size-4 text-primary" /> En aktifler
            </span>
            <Link href="/topluluk" className="text-xs text-primary hover:underline">Tümü →</Link>
          </div>
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              İlk aktif üye sen ol — <Link href="/kesfet" className="text-primary hover:underline">keşfet</Link>.
            </p>
          ) : (
            <div className="space-y-2.5">
              {top.slice(0, 5).map((u) => (
                <div key={u.rank} className="flex items-center gap-3">
                  <span className="w-4 text-center text-xs font-semibold tabular-nums text-muted-foreground">{u.rank}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-xs font-semibold text-white">
                    {u.name[0]?.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{u.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span aria-hidden>{u.icon}</span> {u.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
