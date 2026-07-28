"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import {
  getCollections,
  type Collection,
  type CollectionItem,
} from "@/lib/collections";

// Ana sayfa video koleksiyonları. Her koleksiyon `layout` alanına göre FARKLI bir şeritle
// render olur (cinema · numbered · poster · featured) — birbirine benzemesin. Tıklayınca
// hepsinde ortak genie geçişli oynatıcı açılır. İçerik admin panelinden yönetilir; veri
// yoksa hiç render etmez. Sıra LIFO (en yeni üstte) — API tarafında.

type Playing = { collection: Collection; index: number; origin: DOMRect };

export function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [playing, setPlaying] = useState<Playing | null>(null);

  useEffect(() => {
    getCollections().then(setRows);
  }, []);

  if (rows.length === 0) return null;

  const open = (collection: Collection) => (index: number, origin: DOMRect) =>
    setPlaying({ collection, index, origin });

  return (
    <>
      <section className="space-y-12 py-10 md:space-y-16 md:py-14">
        {rows.map((c) => {
          const onOpen = open(c);
          switch (c.layout) {
            case "numbered":
              return <NumberedRail key={c.id} collection={c} onOpen={onOpen} />;
            case "poster":
              return <PosterRail key={c.id} collection={c} onOpen={onOpen} />;
            case "featured":
              return <FeaturedGrid key={c.id} collection={c} onOpen={onOpen} />;
            default:
              return <CinemaRail key={c.id} collection={c} onOpen={onOpen} />;
          }
        })}
      </section>

      {playing && (
        <GeniePlayer
          collection={playing.collection}
          startIndex={playing.index}
          origin={playing.origin}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}

type OpenFn = (index: number, origin: DOMRect) => void;

/* ─────────────────────────  ortak parçalar  ───────────────────────── */

// Kapak + play düğmesi. Tıklanınca kendi rect'ini verir (genie origin'i).
const Thumb = forwardRef<
  HTMLDivElement,
  { item: CollectionItem; aspect: string; sizes: string; playSize?: "sm" | "lg" }
>(function Thumb({ item, aspect, sizes, playSize = "sm" }, ref) {
  const s = playSize === "lg" ? "size-14" : "size-11";
  const icon = playSize === "lg" ? "size-6" : "size-4";
  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden rounded-2xl border border-border bg-muted ${aspect}`}
    >
      {item.thumbUrl && (
        <Image
          src={item.thumbUrl}
          alt={item.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
      <span className="absolute inset-0 grid place-items-center">
        <span
          className={`grid ${s} place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm transition group-hover:bg-primary group-hover:text-white`}
        >
          <Play className={`${icon} translate-x-[1px] fill-current`} />
        </span>
      </span>
    </div>
  );
});

// Yatay şerit davranışı: sürükle-kaydır + kenar durumu + ok butonları.
function useRail(itemCount: number) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
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
  }, [syncEdges, itemCount]);

  const scrollBy = (dir: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
  };

  const handlers = {
    ref: railRef,
    onScroll: syncEdges,
    onPointerDown: (e: React.PointerEvent) => {
      const el = railRef.current;
      if (!el || e.pointerType === "touch") return;
      drag.current = { active: true, x: e.clientX, left: el.scrollLeft, moved: 0 };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const el = railRef.current;
      if (!el || !drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
      el.scrollLeft = drag.current.left - dx;
    },
    onPointerUp: () => (drag.current.active = false),
    onPointerLeave: () => (drag.current.active = false),
  };
  // sürükleme bitişini tıklamadan ayır
  const wasDrag = () => drag.current.moved > 6;
  return { edge, scrollBy, handlers, wasDrag };
}

// Başlık sağındaki müzik equalizer'ı — Luca'ya özel, primary rengiyle ritimle zıplar.
function Equalizer() {
  const delays = ["-0.9s", "-0.5s", "-0.2s", "-0.7s", "-0.4s"];
  return (
    <span aria-hidden className="hidden h-6 shrink-0 items-end gap-[3px] sm:flex">
      {delays.map((d, i) => (
        <span
          key={i}
          className="luca-eq-bar h-full w-[3px] rounded-full bg-primary/80"
          style={{ animationDelay: d }}
        />
      ))}
    </span>
  );
}

function Arrows({ edge, scrollBy }: { edge: { start: boolean; end: boolean }; scrollBy: (d: number) => void }) {
  return (
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
  );
}

const railClass =
  "flex snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/* ───────────────────────  1 · CINEMA  ─────────────────────── */
// Geniş 16:9 kartlar, başlık solda + oklar sağda.
function CinemaRail({ collection, onOpen }: { collection: Collection; onOpen: OpenFn }) {
  const { edge, scrollBy, handlers, wasDrag } = useRail(collection.items.length);
  return (
    <div className="container">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tracking-[0.22em] text-primary/70">COLLECTION</div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Equalizer />
          <Arrows edge={edge} scrollBy={scrollBy} />
        </div>
      </div>
      <div {...handlers} className={`${railClass} gap-4`}>
        {collection.items.map((item, i) => (
          <PlayCard
            key={item.id}
            item={item}
            index={i}
            onOpen={onOpen}
            wasDrag={wasDrag}
            className="w-[78vw] snap-start sm:w-[300px]"
            aspect="aspect-video"
            sizes="(max-width:640px) 78vw, 300px"
            showMeta
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────  2 · NUMBERED  ─────────────────────── */
// Büyük outline sıra rakamı + kart (top-list hissi).
function NumberedRail({ collection, onOpen }: { collection: Collection; onOpen: OpenFn }) {
  const { edge, scrollBy, handlers, wasDrag } = useRail(collection.items.length);
  return (
    <div className="container">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.22em] text-primary/70">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">TOP</span> COLLECTION
          </div>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Equalizer />
          <Arrows edge={edge} scrollBy={scrollBy} />
        </div>
      </div>
      <div {...handlers} className={`${railClass} items-center gap-5`}>
        {collection.items.map((item, i) => (
          <div key={item.id} className="flex shrink-0 snap-start items-center gap-3">
            <span
              aria-hidden
              className="select-none font-serif text-6xl font-bold leading-none text-transparent md:text-7xl"
              style={{ WebkitTextStroke: "1.5px hsl(var(--primary))" }}
            >
              {i + 1}
            </span>
            <PlayCard
              item={item}
              index={i}
              onOpen={onOpen}
              wasDrag={wasDrag}
              className="w-[190px] sm:w-[210px]"
              aspect="aspect-[16/10]"
              sizes="210px"
              showMeta
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────  3 · POSTER  ─────────────────────── */
// Dikey 3:4 poster kartlar, çok içerik yan yana; başlık ortalı.
function PosterRail({ collection, onOpen }: { collection: Collection; onOpen: OpenFn }) {
  const { handlers, wasDrag } = useRail(collection.items.length);
  return (
    <div className="container">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tracking-[0.22em] text-primary/70">COLLECTION</div>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.subtitle}</p>
          )}
        </div>
        <Equalizer />
      </div>
      <div {...handlers} className={`${railClass} gap-3`}>
        {collection.items.map((item, i) => (
          <PlayCard
            key={item.id}
            item={item}
            index={i}
            onOpen={onOpen}
            wasDrag={wasDrag}
            className="w-[42vw] snap-start sm:w-[150px]"
            aspect="aspect-[3/4]"
            sizes="(max-width:640px) 42vw, 150px"
            showMeta
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────  4 · FEATURED  ─────────────────────── */
// Solda büyük öne çıkan (ilk video), sağda küçük ızgara.
function FeaturedGrid({ collection, onOpen }: { collection: Collection; onOpen: OpenFn }) {
  const [hero, ...rest] = collection.items;
  if (!hero) return null;
  const noDrag = () => false;
  return (
    <div className="container">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.22em] text-primary/70">
            <span className="size-1.5 rounded-full bg-primary" /> BUGÜN · COLLECTION
          </div>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            {collection.title}
          </h2>
          {collection.subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.subtitle}</p>
          )}
        </div>
        <Equalizer />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <PlayCard
          item={hero}
          index={0}
          onOpen={onOpen}
          wasDrag={noDrag}
          className="w-full"
          aspect="aspect-video"
          sizes="(max-width:1024px) 100vw, 560px"
          playSize="lg"
          showMeta
        />
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {rest.slice(0, 4).map((item, i) => (
              <PlayCard
                key={item.id}
                item={item}
                index={i + 1}
                onOpen={onOpen}
                wasDrag={noDrag}
                className="w-full"
                aspect="aspect-[16/10]"
                sizes="(max-width:1024px) 45vw, 260px"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────  tıklanabilir kart  ─────────────────────── */
function PlayCard({
  item,
  index,
  onOpen,
  wasDrag,
  className,
  aspect,
  sizes,
  playSize = "sm",
  showMeta = false,
}: {
  item: CollectionItem;
  index: number;
  onOpen: OpenFn;
  wasDrag: () => boolean;
  className: string;
  aspect: string;
  sizes: string;
  playSize?: "sm" | "lg";
  showMeta?: boolean;
}) {
  const thumbRef = useRef<HTMLDivElement>(null);
  return (
    <button
      onClick={() => {
        if (wasDrag()) return;
        const r = thumbRef.current?.getBoundingClientRect();
        if (r) onOpen(index, r);
      }}
      className={`group shrink-0 text-left ${className}`}
    >
      <Thumb ref={thumbRef} item={item} aspect={aspect} sizes={sizes} playSize={playSize} />
      {showMeta && (
        <>
          <div className="mt-2.5 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
            {item.title}
          </div>
          {item.author && (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.author}</div>
          )}
        </>
      )}
    </button>
  );
}

/* ───────────────────────  genie oynatıcı (ortak)  ─────────────────────── */
// Kartın konumundan büyüyerek açılan, kapanınca aynı konuma inen (mac genie) oynatıcı.
function GeniePlayer({
  collection,
  startIndex,
  origin,
  onClose,
}: {
  collection: Collection;
  startIndex: number;
  origin: DOMRect;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("opening");
  const [scrim, setScrim] = useState(0);
  const item = collection.items[index];

  useEffect(() => {
    window.dispatchEvent(new Event("luca:radio-pause"));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.dispatchEvent(new Event("luca:radio-resume"));
    };
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const target = box.getBoundingClientRect();
    const sx = origin.width / target.width;
    const sy = origin.height / target.height;
    const tx = origin.left - target.left;
    const ty = origin.top - target.top;
    box.style.transformOrigin = "top left";
    box.style.transition = "none";
    box.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
    box.style.opacity = "1";
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        box.style.transition =
          "transform 0.42s cubic-bezier(0.34, 1.2, 0.5, 1), opacity 0.2s ease";
        box.style.transform = "translate(0, 0) scale(1, 1)";
        setScrim(0.82);
        const onEnd = (e: TransitionEvent) => {
          if (e.propertyName !== "transform") return;
          box.removeEventListener("transitionend", onEnd);
          setPhase("open");
        };
        box.addEventListener("transitionend", onEnd);
      }),
    );
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    const box = boxRef.current;
    if (!box || phase === "closing") {
      onClose();
      return;
    }
    setPhase("closing");
    const target = box.getBoundingClientRect();
    const sx = origin.width / target.width;
    const sy = origin.height / target.height;
    const tx = origin.left - target.left;
    const ty = origin.top - target.top;
    requestAnimationFrame(() => {
      box.style.transition =
        "transform 0.36s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.32s ease 0.05s";
      box.style.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
      box.style.opacity = "0";
      setScrim(0);
    });
    const t = setTimeout(onClose, 380);
    return () => clearTimeout(t);
  }, [origin, phase, onClose]);

  const step = useCallback(
    (d: number) => {
      const n = collection.items.length;
      setIndex((i) => (i + d + n) % n);
    },
    [collection.items.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, step]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <div
        onClick={close}
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: scrim }}
      />
      <div className="relative z-10 w-full max-w-4xl">
        <div
          ref={boxRef}
          style={{ opacity: 0, willChange: "transform" }}
          className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
        >
          {phase !== "open" && (
            <>
              {item.thumbUrl && (
                <Image
                  src={item.thumbUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 900px) 100vw, 896px"
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 grid place-items-center bg-black/25">
                <span className="grid size-14 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                  <Play className="size-6 translate-x-[1px] fill-current" />
                </span>
              </div>
            </>
          )}
          {phase === "open" && (
            <iframe
              key={item.videoId}
              src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={item.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          )}
        </div>

        <div
          className="mt-3 flex items-start gap-3 transition-opacity duration-300"
          style={{ opacity: phase === "open" ? 1 : 0 }}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-base font-semibold text-white sm:text-lg">
              {item.title}
            </div>
            <div className="mt-0.5 truncate text-xs text-white/60">
              {collection.title} · {index + 1} / {collection.items.length}
              {item.author ? ` · ${item.author}` : ""}
            </div>
          </div>
          {collection.items.length > 1 && (
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
  );
}
