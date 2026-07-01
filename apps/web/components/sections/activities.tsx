"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Users, MapPin, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { CATEGORIES, UPCOMING_ACTIVITIES, type Activity, type CategorySlug } from "@/lib/data";
import { discoverEvents, type DiscoverEvent } from "@/lib/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { PosterFallback } from "@/components/poster-fallback";
import { cn } from "@/lib/utils";

interface Props {
  filter?: CategorySlug | "all";
}

// API kategori slug'ları ana sayfa taksonomisiyle birebir değil — eşle.
const CAT_ALIAS: Record<string, CategorySlug> = {
  "outdoor-spor": "outdoor",
  "gezi-seyahat": "gezi",
  "food-drink": "food",
};
function normCategory(slug?: string | null): CategorySlug {
  if (!slug) return "social";
  const alias = CAT_ALIAS[slug];
  if (alias) return alias;
  const known = CATEGORIES.find((c) => c.slug === slug);
  return (known?.slug as CategorySlug) ?? "social";
}
function toActivity(e: DiscoverEvent): Activity {
  return {
    id: e.slug,
    category: normCategory(e.category?.slug),
    title: e.title,
    date: e.startsAt,
    location: e.venue?.name ?? e.venue?.city ?? "İstanbul",
    attendees: 0,
    capacity: 0, // public /events kapasite/satış döndürmüyor → kapasite çubuğu gizlenir
    cover: e.coverUrl ?? "",
  };
}

export function Activities({ filter = "all" }: Props) {
  // Yayınlanan yaklaşan etkinlikleri API'den çek; boşsa/erişilemezse küratörlü listeye düş.
  const [remote, setRemote] = useState<Activity[] | null>(null);
  useEffect(() => {
    let alive = true;
    discoverEvents({ range: "upcoming", take: 12 })
      .then((evs) => {
        if (!alive) return;
        const mapped = evs.map(toActivity);
        if (mapped.length) setRemote(mapped);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const source = remote ?? UPCOMING_ACTIVITIES;
  const items =
    filter === "all" ? source : source.filter((a) => a.category === filter);

  return (
    <section id="aktiviteler" className="relative py-24 md:py-32 bg-secondary/30">
      <div className="container">
        <header className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground mb-3">
              program / upcoming
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
              Bu hafta <AnimatedGradientText>Luca’da</AnimatedGradientText>.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl">
              Yoga, tekne, atölye, koşu, brunch ve gece. Kontenjan kapanmadan
              yerini ayır.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="#aile">
              Tüm programı gör <ArrowRight className="size-4" />
            </a>
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {items.map((a, i) => (
            <ActivityCard key={a.id} activity={a} index={i} />
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Bu kategoride şu an yaklaşan aktivite yok.
          </div>
        )}
      </div>
    </section>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const cat = CATEGORIES.find((c) => c.slug === activity.category)!;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const date = new Date(activity.date);
  const day = date.toLocaleDateString("tr-TR", { day: "2-digit" });
  const month = date.toLocaleDateString("tr-TR", { month: "short" }).toUpperCase();
  const weekday = date.toLocaleDateString("tr-TR", { weekday: "long" });
  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hasCapacity = activity.capacity > 0;
  const pct = hasCapacity
    ? Math.round((activity.attendees / activity.capacity) * 100)
    : 0;
  const almostFull = hasCapacity && pct >= 80;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all"
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0">
          <PosterFallback category={cat} />
        </div>

        {!imgFailed && activity.cover && (
          <Image
            src={activity.cover}
            alt={activity.title}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            className={cn(
              "object-cover transition-all duration-700 group-hover:scale-[1.02]",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
          />
        )}

        {/* corner date — frosted glass, stronger blur */}
        <div className="absolute top-3 left-3 bg-background/40 backdrop-blur-2xl backdrop-saturate-150 rounded-md px-2.5 py-1.5 text-center border border-white/10 shadow-lg min-w-[52px]">
          <div className="text-[9px] uppercase tracking-[0.15em] font-mono text-white/70 leading-none">
            {month}
          </div>
          <div className="text-lg font-semibold leading-tight tabular-nums mt-0.5 text-white">
            {day}
          </div>
        </div>

        {/* category — frosted pill */}
        <Badge
          variant="category"
          className="absolute top-3 right-3 bg-black/30 backdrop-blur-2xl backdrop-saturate-150 text-white border-white/15 normal-case tracking-wider text-[10px] shadow-lg"
        >
          {cat.name}
        </Badge>

        {almostFull && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-primary/85 backdrop-blur-2xl text-primary-foreground text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded border border-white/10 shadow-lg">
            <span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
            Son kontenjan
          </div>
        )}

        {/* soft bottom haze for seamless transition to card body */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-lg font-semibold leading-snug tracking-tight mb-4">
          {activity.title}
        </h3>

        <dl className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
            <span className="capitalize">{weekday}</span>
            <span className="opacity-40">·</span>
            <span className="tabular-nums">{time}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
            <span className="truncate">{activity.location}</span>
          </div>
          {hasCapacity && (
            <div className="flex items-center gap-2.5">
              <Users className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
              <span>
                <span className="text-foreground font-medium tabular-nums">
                  {activity.attendees}
                </span>{" "}
                <span className="opacity-70">/ {activity.capacity}</span>
              </span>
            </div>
          )}
        </dl>

        {/* Capacity bar */}
        {hasCapacity && (
          <div className="mt-4 h-0.5 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                almostFull ? "bg-primary" : "bg-foreground/40"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <Button asChild size="sm" className="w-full mt-5 group/btn">
          <a href={`#rsvp-${activity.id}`}>
            Katıl
            <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </a>
        </Button>
      </div>
    </motion.article>
  );
}
