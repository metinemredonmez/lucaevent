"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { getCollections, type Collection, type CollectionItem } from "@/lib/collections";

// Ana sayfa video koleksiyonları — yatay şerit (sürükle/kaydır), tıklayınca modal oynatıcı.
// İçerik tamamen admin panelinden yönetilir (/admin/collections); veri yoksa hiç render etmez.

type Playing = { collection: Collection; index: number };

export function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [playing, setPlaying] = useState<Playing | null>(null);

  useEffect(() => {
    getCollections().then(setRows);
  }, []);

  // Modal açıkken sayfa kaymasın; radyo çalıyorsa sussun (kapanınca kaldığı yerden devam eder).
  useEffect(() => {
    if (!playing) return;
    window.dispatchEvent(new Event("luca:radio-pause"));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.dispatchEvent(new Event("luca:radio-resume"));
    };
  }, [playing]);

  const close = useCallback(() => setPlaying(null), []);
  const step = useCallback((d: number) => {
    setPlaying((p) => {
      if (!p) return p;
      const n = p.collection.items.length;
      return { ...p, index: (p.index + d + n) % n };
    });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, close, step]);

  if (rows.length === 0) return null;

  const current = playing?.collection.items[playing.index];

  return (
    <>
      <section className="py-10 md:py-14">
        {rows.map((c) => (
          <CollectionRail
            key={c.id}
            collection={c}
            onPlay={(i) => setPlaying({ collection: c, index: i })}
          />
        ))}
      </section>

      {playing && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={close}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <iframe
                key={current.videoId}
                src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={current.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>

            <div className="mt-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-base font-semibold text-white sm:text-lg">
                  {current.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-white/60">
                  {playing.collection.title} · {playing.index + 1} / {playing.collection.items.length}
                  {current.author ? ` · ${current.author}` : ""}
                </div>
              </div>
              {playing.collection.items.length > 1 && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => step(-1)}
                    aria-label="Önceki video"
                    className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    onClick={() => step(1)}
                    aria-label="Sonraki video"
                    className="grid size-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
              <button
                onClick={close}
                aria-label="Kapat"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CollectionRail({
  collection,
  onPlay,
}: {
  collection: Collection;
  onPlay: (index: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  // Sürükleyerek kaydırma — sürükleme sırasında tıklama tetiklenmesin diye eşik kontrolü.
  const drag = useRef({ active: false, x: 0, left: 0, moved: 0 });

  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    syncEdges();
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges, collection.items.length]);

  function scrollBy(dir: number) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
  }

  function onPointerDown(e: React.PointerEvent) {
    const el = railRef.current;
    if (!el || e.pointerType === "touch") return; // dokunmatikte native kaydırma yeterli
    drag.current = { active: true, x: e.clientX, left: el.scrollLeft, moved: 0 };
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = railRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.x;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    el.scrollLeft = drag.current.left - dx;
  }
  function endDrag() {
    drag.current.active = false;
  }

  return (
    <div className="container mb-10 last:mb-0">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {/* Türkçe locale'de uppercase "i" → "İ" yaptığı için etiket doğrudan büyük yazılır */}
          <div className="text-[11px] font-mono tracking-[0.22em] text-primary/70">COLLECTION</div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.subtitle}</p>
          )}
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <button
            onClick={() => scrollBy(-1)}
            disabled={edge.start}
            aria-label="Geri kaydır"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            disabled={edge.end}
            aria-label="İleri kaydır"
            className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={syncEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {collection.items.map((item, i) => (
          <VideoCard
            key={item.id}
            item={item}
            onClick={() => {
              if (drag.current.moved > 6) return; // sürükleme bitişi tıklama sayılmasın
              onPlay(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VideoCard({ item, onClick }: { item: CollectionItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-[78vw] shrink-0 snap-start text-left sm:w-[300px]"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
        {item.thumbUrl && (
          <Image
            src={item.thumbUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 78vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition group-hover:bg-primary group-hover:text-white">
            <Play className="size-5 translate-x-[1px] fill-current" />
          </span>
        </span>
      </div>
      <div className="mt-2.5 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
        {item.title}
      </div>
      {item.author && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.author}</div>
      )}
    </button>
  );
}
