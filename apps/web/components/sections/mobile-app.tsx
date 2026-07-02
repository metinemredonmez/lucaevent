"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Home, MapPin, CalendarDays, User } from "lucide-react";

/** Resmî Apple logosu (tek renk beyaz — marka gereği monokrom). */
function AppleLogo() {
  return (
    <svg width="20" height="24" viewBox="0 0 384 512" fill="#fff" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/** Resmî Google Play logosu (4 renkli üçgen — marka renkleri). */
function GooglePlayLogo() {
  return (
    <svg width="20" height="22" viewBox="0 0 256 283" aria-hidden>
      <path
        fill="#EA4335"
        d="M119.553141,134.916362 L1.0599006,259.060547 C3.75619448,268.616998 10.7182836,276.3906 19.9208658,280.119977 C29.1234481,283.849353 39.5331235,283.115716 48.121672,278.132484 L181.448642,202.197919 L119.553141,134.916362 Z"
      />
      <path
        fill="#FBBC04"
        d="M239.370822,113.813616 L181.71353,80.7909097 L116.815965,137.741834 L181.978418,202.021326 L239.19423,169.351804 C249.525723,163.942452 256,153.24465 256,141.58271 C256,129.92077 249.525723,119.222968 239.19423,113.813616 L239.370822,113.813616 Z"
      />
      <path
        fill="#4285F4"
        d="M1.0599006,23.4868015 C0.343633396,26.134699 -0.0127538816,28.8670014 0,31.6100341 L0,250.937314 C0.00751268399,253.679042 0.363556675,256.408712 1.0599006,259.060547 L123.614758,138.095018 L1.0599006,23.4868015 Z"
      />
      <path
        fill="#34A853"
        d="M120.436101,141.273674 L181.71353,80.7909097 L48.5631521,4.50316009 C43.5539929,1.56944036 37.8568091,0.0156629668 32.0517989,0 C17.6444261,-0.0284873284 4.97836875,9.53420553 1.0599006,23.3985055 L120.436101,141.273674 Z"
      />
    </svg>
  );
}

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
              <StoreBadge icon={<AppleLogo />} top="İndir" name="App Store" />
              <StoreBadge icon={<GooglePlayLogo />} top="Yükle" name="Google Play" />
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

function StoreBadge({ icon, top, name }: { icon: ReactNode; top: string; name: string }) {
  return (
    <span
      title="Mobil uygulama çok yakında"
      className="inline-flex cursor-default select-none items-center gap-2.5 rounded-xl border border-white/15 bg-black px-4 py-2.5 opacity-90 transition-opacity hover:opacity-100"
    >
      {icon}
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
