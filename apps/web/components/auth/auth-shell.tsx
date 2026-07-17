"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const DEFAULT_FEATURES = [
  "Yoga, pilates, kamp, workshop ve daha fazlası",
  "Tek tıkla bilet, QR ile giriş",
  "Şehrin en iyi deneyimleri, tek yerde",
];

const CHIPS = [
  { label: "Sunset Yoga", top: "14%", left: "8%", d: 7 },
  { label: "Rooftop DJ", top: "24%", left: "58%", d: 9 },
  { label: "Sapanca Kamp", top: "62%", left: "10%", d: 8 },
  { label: "Boğaz Tekne", top: "72%", left: "52%", d: 10 },
  { label: "Seramik Atölye", top: "44%", left: "70%", d: 7.5 },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function AuthShell({
  children,
  caption,
  headline = "Şehrin en güzel anları, tek yerde.",
  features = DEFAULT_FEATURES,
}: {
  children: React.ReactNode;
  caption?: string;
  headline?: string;
  features?: string[];
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0a0a0b]">
      {/* LEFT — nötr koyu (mor değil), fotoğraf + hafif accent */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white bg-gradient-to-br from-[#16161a] via-[#101012] to-[#0a0a0b]">
        {/* blurred event photo (opsiyonel — /img/auth-bg.jpg bırak; yoksa gradyan kalır) */}
        <img
          src="/img/auth-bg.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* okunabilirlik için koyulaştırıcı katman */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/70" />

        {/* drifting orbs */}
        <motion.div
          className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#0e9a8c]/12 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute right-6 bottom-20 h-80 w-80 rounded-full bg-[#22c9b8]/10 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -40, 0], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-[#3B82F6]/10 blur-3xl"
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* radar pulse rings */}
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-[34rem] w-[34rem]">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#22c9b8]/50"
              animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, delay: i * 1.4, ease: "easeOut" }}
            />
          ))}
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22c9b8]/60 blur-sm" />
        </div>

        {/* floating event chips */}
        {CHIPS.map((c) => (
          <motion.div
            key={c.label}
            className="pointer-events-none absolute rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] text-white/70 backdrop-blur-sm"
            style={{ top: c.top, left: c.left }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0.95, 0], y: [0, -14, 0] }}
            transition={{ duration: c.d, repeat: Infinity, ease: "easeInOut", delay: c.d / 3 }}
          >
            {c.label}
          </motion.div>
        ))}

        <motion.div initial="hidden" animate="show" variants={container} className="relative z-10 flex h-full flex-col justify-between">
          <motion.div variants={item}>
            <Link href="/">
              <span className="text-3xl" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
                Luca
              </span>
            </Link>
            <p className="mt-1.5 text-[13px] font-medium tracking-[0.2em] text-white/50 uppercase">
              Keşfet · Buluş · Yaşa
            </p>
          </motion.div>

          <div className="max-w-md">
            <motion.h2
              variants={item}
              className="text-[2.6rem] leading-[1.08]"
              style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
            >
              {headline}
            </motion.h2>
            <ul className="mt-8 space-y-3">
              {features.map((f) => (
                <motion.li key={f} variants={item} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-3 w-3 text-[#7fe6da]" />
                  </span>
                  {f}
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.p variants={item} className="text-xs tracking-wide text-white/40">
            {caption ?? "Etkinlikten fazlası. Bir yaşam topluluğu."}
          </motion.p>
        </motion.div>
      </div>

      {/* RIGHT — dark panel (no white) */}
      <div className="relative flex items-center justify-center overflow-hidden px-4 py-10 bg-[#0a0a0b]">
        <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-[#0e9a8c]/8 blur-3xl" />
        <div className="pointer-events-none absolute left-[-4rem] bottom-[-4rem] h-64 w-64 rounded-full bg-[#0e9a8c]/6 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* glass card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/40 backdrop-blur-md">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
