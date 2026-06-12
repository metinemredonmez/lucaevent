"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { FAMILY_SAMPLE, FAMILY_COUNT } from "@/lib/data";
import { ArrowRight, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <section id="aile" className="relative py-20 md:py-28">
      <div className="container">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
              topluluk
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Her gece{" "}
              <AnimatedGradientText className="tabular-nums">
                {FAMILY_COUNT.toLocaleString("tr-TR")}
              </AnimatedGradientText>{" "}
              kişilik bir hikâye.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Sahnenin önünde, bardağın etrafında, dansta tanışan yüzler.
              Luca'nın atmosferi onlarla yazılıyor. Senin için de bir masa
              ayırdık.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#rezervasyon">
                  Yer ayır <ArrowRight className="size-4" />
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
