"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight } from "lucide-react";
import { discoverEvents } from "@/lib/events";

/** Hero arka planında crossfade ile geçen atmosferik kareler (gerçek etkinlik görselleri).
 *  Dosya yoksa (onError) gizlenir, alttaki canlı mor gradyan görünür. */
const SLIDES = [
  "/img/events/sile-kampi.jpg",
  "/img/events/yaza-merhaba-burgazada.jpg",
  "/img/events/parfum-workshopu.jpg",
];

// kategori → emoji (API slug'ları) — "Bu hafta:" tickerında etkinlik başına ikon
const CAT_EMOJI: Record<string, string> = {
  wellness: "🧘",
  "outdoor-spor": "🏃",
  "gezi-seyahat": "⛵",
  workshop: "🎨",
  social: "☕",
  "food-drink": "🍷",
  business: "💼",
  nightlife: "🎶",
};
const FALLBACK_MOMENTS = ["✨  Şehirde yeni anlar", "🎟️  Yaklaşan etkinlikler seni bekliyor"];

export function Hero() {
  const [slide, setSlide] = useState(0);
  const [moment, setMoment] = useState(0);
  const [moments, setMoments] = useState<string[]>(FALLBACK_MOMENTS);

  useEffect(() => {
    discoverEvents({ range: "upcoming", take: 8 })
      .then((evs) => {
        const list = evs.map((e) => `${CAT_EMOJI[e.category?.slug ?? ""] ?? "✨"}  ${e.title}`);
        if (list.length) setMoments(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const s = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 5500);
    const m = setInterval(() => setMoment((i) => i + 1), 2600);
    return () => {
      clearInterval(s);
      clearInterval(m);
    };
  }, []);

  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden text-white dark">
      {/* ── Arka plan: canlı mor/void taban + crossfade fotoğraflar ── */}
      <div className="absolute inset-0 -z-10">
        {/* taban gradyan — fotoğraf olmasa bile dolu durur */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0E3D] via-[#0E0922] to-[#070510]" />

        {/* sürüklenen ışık küreleri */}
        <motion.div
          className="absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/12 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-6rem] bottom-[-4rem] h-[32rem] w-[32rem] rounded-full bg-[#A855F7]/10 blur-[130px]"
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-72 w-72 rounded-full bg-[#3B82F6]/10 blur-[110px]"
          animate={{ x: [0, 40, -30, 0], y: [0, -25, 25, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* crossfade fotoğraf katmanları */}
        {SLIDES.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt=""
            aria-hidden
            initial={false}
            animate={{ opacity: i === slide ? 0.95 : 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover"
          />
        ))}

        {/* okunabilirlik scrim'leri — görsel belirgin, sol yazı korumalı */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070510]/30 via-[#070510]/35 to-[#050309]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070510] via-[#070510]/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.03),transparent_55%)]" />
        {/* alt kenarı bir sonraki bölüme yumuşat */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Aceternity tek efekt — yukarıdan düşen ışık huzmesi */}
      <Spotlight className="-top-40 left-0 md:-top-24 md:left-52" fill="#A855F7" />

      <div className="container relative z-10 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-3xl"
        >
          {/* badge — şemsiye dikeyleri */}
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-white/[0.04] py-1.5 pl-3 pr-4 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-white/90 sm:text-xs">
              Luca · İstanbul
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/55 sm:text-xs">
              Etkinlik · Gezi · Spor
            </span>
          </div>

          {/* headline — umbrella */}
          <h1 className="text-balance font-serif text-[clamp(2.25rem,5.5vw,4.25rem)] font-semibold leading-[1.02] tracking-tight">
            Gündüz keşfet,
            <br />
            <AnimatedGradientText className="italic">
              gece parla.
            </AnimatedGradientText>
          </h1>

          {/* tagline */}
          <p className="mt-6 max-w-xl text-lg text-white/70 md:text-xl">
            Wellness, gezi, spor, atölye, sosyal ve gece — keşfet, buluş, yaşa.
          </p>

          {/* dönen "an" ticker'ı */}
          <div className="mt-5 flex h-7 items-center font-mono text-[13px] tracking-wide text-white/55">
            <span className="mr-3 text-white/30">Bu hafta:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={moment}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-white/80"
              >
                {moments[moment % moments.length]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#aktiviteler">
                Etkinlikleri keşfet <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#kategoriler">Kategoriler</a>
            </Button>
          </div>

          {/* stats — umbrella */}
          <div className="mt-14 flex items-center gap-6 text-sm text-white/55">
            <Stat label="Kategori" value="8" />
            <Divider />
            <Stat label="Etkinlik / ay" value="120+" />
            <Divider />
            <Stat label="Topluluk" value="2.400+" />
          </div>
        </motion.div>
      </div>

      {/* slide göstergeleri */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Görsel ${i + 1}`}
            onClick={() => setSlide(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === slide ? 22 : 6,
              backgroundColor: i === slide ? "#A855F7" : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-white">
        {value}
      </div>
      <div className="font-mono text-xs uppercase tracking-widest">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-white/15" />;
}
