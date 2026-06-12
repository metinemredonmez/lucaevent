"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES, type CategorySlug, type Category } from "@/lib/data";
import { PosterFallback } from "@/components/poster-fallback";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

interface Props {
  active?: CategorySlug | "all";
  onSelect?: (slug: CategorySlug | "all") => void;
}

export function Categories({ active = "all", onSelect }: Props) {
  return (
    <section id="kategoriler" className="relative py-20 md:py-28">
      <div className="container">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">
              deneyim
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">
              Bir mekân, <AnimatedGradientText>yedi atmosfer</AnimatedGradientText>.
            </h2>
          </div>
          <p className="hidden md:block max-w-sm text-muted-foreground">
            Lounge'dan dance floor'a, rooftop'tan after party'ye. Her bölge
            kendi ritmiyle akar — sen geceyi nereden başlatırsan.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <AllCard isActive={active === "all"} onClick={() => onSelect?.("all")} />

          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              index={i}
              isActive={active === cat.slug}
              onClick={() => onSelect?.(cat.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type Tile =
  | { id: string; kind: "photo"; catIndex: number }
  | { id: string; kind: "logo" }
  | { id: string; kind: "mark" };

function buildInitialTiles(): Tile[] {
  // 7 photos + logo + mark = 9 tiles filling 3x3 grid
  const tiles: Tile[] = CATEGORIES.map((_, i) => ({
    id: `photo-${i}`,
    kind: "photo",
    catIndex: i,
  }));
  // insert logo at center (index 4), mark at bottom-right (index 8)
  const arr: Tile[] = [
    tiles[0],
    tiles[1],
    tiles[2],
    tiles[3],
    { id: "logo", kind: "logo" },
    tiles[4],
    tiles[5],
    tiles[6],
    { id: "mark", kind: "mark" },
  ];
  return arr;
}

function AllCard({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  const [tiles, setTiles] = useState<Tile[]>(() => buildInitialTiles());
  const [swapping, setSwapping] = useState<[number, number] | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setTiles((prev) => {
        const next = [...prev];
        // find two random non-brand photo tiles and swap them
        const photoIdx = next
          .map((t, i) => (t.kind === "photo" ? i : -1))
          .filter((i) => i >= 0);
        if (photoIdx.length < 2) return next;
        const a = photoIdx[Math.floor(Math.random() * photoIdx.length)];
        let b = photoIdx[Math.floor(Math.random() * photoIdx.length)];
        let guard = 0;
        while (b === a && guard < 10) {
          b = photoIdx[Math.floor(Math.random() * photoIdx.length)];
          guard++;
        }
        [next[a], next[b]] = [next[b], next[a]];
        setSwapping([a, b]);
        setTimeout(() => setSwapping(null), 700);
        return next;
      });
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative aspect-[5/4] rounded-xl overflow-hidden border transition-all text-left",
        isActive
          ? "border-primary ring-2 ring-primary/50 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]"
          : "border-border hover:border-border/80"
      )}
    >
      {/* 3x3 mosaic — tiles shuffle around with drag-drop motion */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[2px] bg-border">
        {tiles.map((tile, i) => {
          const isMoving = swapping && (swapping[0] === i || swapping[1] === i);
          return (
            <motion.div
              key={tile.id}
              layout
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 280,
                  damping: 24,
                  mass: 0.9,
                },
              }}
              animate={{
                scale: isMoving ? [1, 1.15, 1] : 1,
                zIndex: isMoving ? 2 : 1,
                boxShadow: isMoving
                  ? "0 12px 28px -6px rgba(0,0,0,0.9), 0 0 0 1px rgba(168,85,247,0.6)"
                  : "0 0 0 0 transparent",
              }}
              className={cn(
                "relative overflow-hidden rounded-[2px]",
                tile.kind === "photo" ? "bg-secondary" : "bg-primary"
              )}
            >
              {tile.kind === "logo" ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3.5" />
                    <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
                  </svg>
                </motion.div>
              ) : tile.kind === "mark" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[9px] font-bold text-primary-foreground tracking-[0.1em] rotate-[-8deg]">
                    LUCA
                  </span>
                </div>
              ) : (
                <Image
                  src={CATEGORIES[tile.catIndex].cover}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* dark overlay for legibility */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500 pointer-events-none",
          isActive ? "bg-black/25" : "bg-black/55 group-hover:bg-black/35"
        )}
      />

      {/* accent violet glow — stronger when active, pulsing always */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isActive ? [0.5, 0.85, 0.5] : [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(70% 55% at 50% 50%, rgba(168,85,247,0.45) 0%, transparent 70%)",
        }}
      />

      {/* Text */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end pointer-events-none">
        <div className="font-serif text-white text-2xl leading-none font-semibold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
          Hepsi
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-mono mt-2">
          Her odadan
        </div>
      </div>
    </motion.button>
  );
}

function CategoryCard({
  cat,
  index,
  isActive,
  onClick,
}: {
  cat: Category;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative aspect-[5/4] rounded-xl overflow-hidden border transition-all text-left",
        isActive
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-border/80"
      )}
    >
      {/* fallback gradient — no icons, just color atmosphere */}
      <div className="absolute inset-0">
        <PosterFallback category={cat} />
      </div>

      {!imgFailed && (
        <Image
          src={cat.cover}
          alt={cat.name}
          fill
          sizes="(min-width:768px) 25vw, 50vw"
          className={cn(
            "object-cover transition-all duration-500 group-hover:scale-[1.04]",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgFailed(true)}
        />
      )}

      {/* legibility overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Text anchored bottom-left */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <div className="font-serif text-white text-2xl leading-none font-semibold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {cat.name}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono mt-2">
          {cat.tagline}
        </div>
      </div>
    </motion.button>
  );
}
