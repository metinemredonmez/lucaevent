"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { FAMILY_SAMPLE, FAMILY_COUNT } from "@/lib/data";
import { getCommunityCount } from "@/lib/events";
import { ArrowRight, Heart, Users, Apple, Play, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function StoreBadge({ Icon, bottom }: { Icon: LucideIcon; bottom: string }) {
  return (
    <span
      title="Mobil uygulama çok yakında"
      className="inline-flex cursor-default select-none items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2 opacity-90"
    >
      <Icon className="size-6 shrink-0 text-foreground" />
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Yakında</span>
        <span className="block text-sm font-semibold text-foreground">{bottom}</span>
      </span>
    </span>
  );
}

function FamilyAvatar({ src, index }: { src: string; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const palette = [
    "#3B3B44", "#2E2E36", "#44444E", "#333339",
    "#3F3A4A", "#2B2B31", "#46424F", "#37373F",
  ];
  const color = palette[index % palette.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative aspect-square rounded-lg overflow-hidden border border-border bg-card"
    >
      {/* Fallback gradient */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at 30% 30%, ${color}66 0%, transparent 55%), linear-gradient(135deg, ${color}33, #1E1E22)`,
        }}
        aria-hidden
      >
        <Users className="size-7 text-white/40" strokeWidth={1.4} />
      </div>
      {!failed && (
        <Image
          src={src}
          alt={`Luca topluluğu ${index + 1}`}
          fill
          sizes="(min-width:1024px) 10vw, 22vw"
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </motion.div>
  );
}

export function Family() {
  // Gerçek üye sayısı (DB'den); gelmezse tasarım bozulmasın diye placeholder'a düşer.
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    getCommunityCount().then((n) => {
      if (n != null && n > 0) setCount(n);
    });
  }, []);
  // Gerçek sayı taban değeri (2.418) geçince onu göster; altındayken "1 kişilik" gibi
  // saçma görünmesin diye taban kalır.
  const display = count && count > FAMILY_COUNT ? count : FAMILY_COUNT;

  return (
    <section id="aile" className="relative py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
              topluluk
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              Her hafta{" "}
              <AnimatedGradientText className="tabular-nums">
                {display.toLocaleString("tr-TR")}
              </AnimatedGradientText>{" "}
              kişilik bir topluluk.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Yogada, teknede, atölyede, koşu pistinde ve sahnede tanışan
              yüzler. Luca’nın atmosferi onlarla yazılıyor — sıradaki etkinlikte
              yerini ayırdık.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/kayit">
                  Aramıza katıl <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <a
                  href="https://instagram.com/luca.club.tr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Heart className="size-4" /> Instagram
                </a>
              </Button>
            </div>

            {/* mobil uygulama — çok yakında */}
            <div className="mt-8">
              <div className="mb-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Mobil uygulama
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] normal-case tracking-normal text-primary">
                  çok yakında
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <StoreBadge Icon={Apple} bottom="App Store" />
                <StoreBadge Icon={Play} bottom="Google Play" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {FAMILY_SAMPLE.map((src, i) => (
              <FamilyAvatar key={src} src={src} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
