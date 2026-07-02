"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Home, MapPin, CalendarDays, User } from "lucide-react";

/** Resmî store logo path'leri (tek renk beyaz — minimalist rozet). */
const APPLE_PATH =
  "M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z";
const PLAY_PATH =
  "M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.155l11.04 10.949zm0 2.02l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z";

export function MobileApp() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* hafif mor ışık bandı — bölüme özel his */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[8%] top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_20%,rgba(124,58,237,0.10),transparent_55%)]" />
      </div>

      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* sol: metin + rozetler */}
          <div>
            <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Mobil uygulama
              <span className="rounded-full border border-primary/35 bg-primary/15 px-2.5 py-0.5 text-[11px] normal-case tracking-normal text-primary">
                çok yakında
              </span>
            </div>
            <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              Cebinde bütün şehir.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Etkinlikler, canlı yayın, harita ve topluluk — hepsi tek uygulamada.
              Lansmanda ilk sen haberdar ol.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <StoreBadge path={APPLE_PATH} vb="0 0 384 512" w={20} h={24} top="İndir" name="App Store" />
              <StoreBadge path={PLAY_PATH} vb="0 0 24 24" w={20} h={22} top="Yükle" name="Google Play" />
            </div>
          </div>

          {/* sağ: açılı telefon — ana sayfa 1. ekran */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function StoreBadge({
  path,
  vb,
  w,
  h,
  top,
  name,
}: {
  path: string;
  vb: string;
  w: number;
  h: number;
  top: string;
  name: string;
}) {
  return (
    <span
      title="Mobil uygulama çok yakında"
      className="inline-flex cursor-default select-none items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2.5 opacity-90 transition-opacity hover:opacity-100"
    >
      <svg width={w} height={h} viewBox={vb} fill="#fff" aria-hidden>
        <path d={path} />
      </svg>
      <span className="text-left leading-none">
        <span className="mb-1 block text-[11px] text-white/60">{top}</span>
        <span className="block text-[15px] font-semibold text-white">{name}</span>
      </span>
    </span>
  );
}

function PhoneMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -3 }}
      whileInView={{ opacity: 1, y: 0, rotate: -9 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative my-6"
    >
      {/* çerçeve */}
      <div className="relative h-[420px] w-[206px] rounded-[2.4rem] border-2 border-white/15 bg-[#050308] p-2 shadow-2xl shadow-primary/20">
        {/* ekran */}
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#2E1A63] via-[#140b30] to-[#070510]">
          {/* fotoğraf (gerçek hero görseli) */}
          <Image
            src="/img/events/sile-kampi.jpg"
            alt="Luca uygulaması"
            fill
            sizes="220px"
            className="scale-105 object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0620]/55 via-[#0b0620]/25 to-[#070510]" />

          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-10 h-4 w-14 -translate-x-1/2 rounded-full bg-black" />

          {/* içerik */}
          <div className="relative px-4 pt-9">
            <div className="font-mono text-[11px] tracking-widest text-white/60">LUCA · İSTANBUL</div>
            <div className="mt-2 font-serif text-xl font-semibold leading-tight text-white">Şehrini yaşa.</div>
            <div className="font-serif text-[13px] italic text-[#C4A6FF]">Gündüz keşfet, gece parla.</div>

            <div className="mt-4 space-y-2">
              <ScreenCard title="Şile Kampı" meta="Cts · 2 gün" from="#3B2A6E" to="#5b3aa0" />
              <ScreenCard title="Yaza Merhaba" meta="Burgazada" from="#243b5e" to="#2f6ea0" />
            </div>
          </div>

          {/* alt menü */}
          <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-around border-t border-white/10 bg-[#0a0614]/80 text-white/55 backdrop-blur">
            <Home className="size-[18px] text-[#C4A6FF]" />
            <MapPin className="size-[18px]" />
            <CalendarDays className="size-[18px]" />
            <User className="size-[18px]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ScreenCard({
  title,
  meta,
  from,
  to,
}: {
  title: string;
  meta: string;
  from: string;
  to: string;
}) {
  return (
    <div
      className="relative h-14 overflow-hidden rounded-lg"
      style={{ background: `linear-gradient(120deg, ${from}, ${to})` }}
    >
      <div className="absolute inset-x-2.5 bottom-1.5">
        <div className="text-[12px] font-medium leading-tight text-white">{title}</div>
        <div className="text-[10px] text-white/70">{meta}</div>
      </div>
    </div>
  );
}
