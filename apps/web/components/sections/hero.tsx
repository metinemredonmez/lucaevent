"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight } from "lucide-react";

const GENRES = ["Müzik", "DJ", "Kokteyl", "Özel Etkinlikler"];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden text-white dark">
      {/* ── Background: tek sinematik kare, derin mor/void washe çekilmiş ── */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/img/hero.jpg"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* void gradient — fotoğrafı atmosfere indirger */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D]/70 via-[#0B0B0D]/75 to-[#0B0B0D]" />
        {/* sol scrim — metin tarafı tam okunur, görsel sağda nefes alır */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D] via-[#0B0B0D]/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.10),transparent_55%)]" />
        {/* alt kenarı bir sonraki bölüme yumuşat */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* ── Aceternity: tek efekt — yukarıdan düşen ışık huzmesi ── */}
      <Spotlight className="-top-40 left-0 md:-top-24 md:left-52" fill="#A855F7" />

      <div className="container relative z-10 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-3xl"
        >
          {/* badge */}
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-white/[0.04] py-1.5 pl-3 pr-4 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-white/90 sm:text-xs">
              Luca · Club
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/55 sm:text-xs">
              İstanbul
            </span>
          </div>

          {/* headline — Magic UI akan gradient vurgu */}
          <h1 className="text-balance font-serif text-[clamp(2.75rem,8vw,5.75rem)] font-semibold leading-[1.02] tracking-tight">
            Gece kendi{" "}
            <AnimatedGradientText className="italic">
              ritmini
            </AnimatedGradientText>
            <br />
            bulur.
          </h1>

          {/* tagline + tür satırı — pill yığını yerine sade mono dizi */}
          <p className="mt-6 max-w-xl text-lg text-white/70 md:text-xl">
            Bir sahne, bir sofra, bir gece.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">
            {GENRES.map((g, i) => (
              <span key={g} className="flex items-center gap-3">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-white/25" />}
                {g}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#rezervasyon">
                Rezervasyon yap <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#aktiviteler">Bu haftanın programı</a>
            </Button>
          </div>

          {/* stats */}
          <div className="mt-14 flex items-center gap-6 text-sm text-white/55">
            <Stat label="Açılış" value="22:00" />
            <Divider />
            <Stat label="DJ Set" value="00:00" />
            <Divider />
            <Stat label="Mekân" value="Beyoğlu" />
          </div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-white/40">
        ↓ scroll
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
