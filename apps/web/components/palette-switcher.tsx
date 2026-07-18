"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Palette as PaletteIcon, ChevronDown } from "lucide-react";
import { PALETTES, CUSTOM_ID, applyPalette, persistPalette, persistCustom, savedPaletteId, savedCustomHex } from "@/lib/palettes";

export function PaletteSwitcher() {
  const { resolvedTheme } = useTheme();
  const [id, setId] = useState<string>("teal");
  const [custom, setCustom] = useState<string>("#e0713a");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // ilk yükleme: kayıtlı paleti oku
  useEffect(() => {
    setMounted(true);
    setId(savedPaletteId());
    setCustom(savedCustomHex());
  }, []);

  // palet ya da tema değişince köke uygula
  useEffect(() => {
    if (!mounted) return;
    applyPalette(id, resolvedTheme !== "light");
  }, [id, resolvedTheme, mounted]);

  // dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  function pick(pid: string) {
    setId(pid);
    persistPalette(pid);
    applyPalette(pid, resolvedTheme !== "light");
    setOpen(false);
  }

  function pickCustom(hex: string) {
    setCustom(hex);
    setId(CUSTOM_ID);
    persistCustom(hex);
    persistPalette(CUSTOM_ID);
    applyPalette(CUSTOM_ID, resolvedTheme !== "light");
  }

  if (!mounted) return null;
  const curSw: [string, string] = id === CUSTOM_ID ? [custom, custom] : (PALETTES.find((p) => p.id === id) ?? PALETTES[0]).sw;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Renk paleti"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex -space-x-1">
          <span className="size-3.5 rounded-full ring-1 ring-background" style={{ background: curSw[0] }} />
          <span className="size-3.5 rounded-full ring-1 ring-background" style={{ background: curSw[1] }} />
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <PaletteIcon className="h-3.5 w-3.5" /> Renk paleti
          </div>
          <div className="p-1.5">
            {PALETTES.map((p) => {
              const on = p.id === id;
              return (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${on ? "bg-muted" : "hover:bg-muted/50"}`}
                >
                  <span className="flex -space-x-1.5">
                    <span className="size-4 rounded-full ring-2 ring-card" style={{ background: p.sw[0] }} />
                    <span className="size-4 rounded-full ring-2 ring-card" style={{ background: p.sw[1] }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-tight text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{p.desc}</span>
                  </span>
                  {on && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-border p-1.5">
            <label className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${id === CUSTOM_ID ? "bg-muted" : "hover:bg-muted/50"}`}>
              <span className="relative size-5 shrink-0 rounded-full ring-2 ring-card" style={{ background: custom }}>
                <input
                  type="color"
                  value={custom}
                  onChange={(e) => pickCustom(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Kendi rengini seç"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-tight text-foreground">Kendi rengim</span>
                <span className="block font-mono text-xs text-muted-foreground">{custom.toUpperCase()}</span>
              </span>
              {id === CUSTOM_ID && <Check className="h-4 w-4 text-primary" />}
            </label>
          </div>
          <div className="border-t border-border px-4 py-3">
            <div className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">🔒 Değişmez</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {[
                ["Canlı", "#22c9b8"],
                ["Açık/Kapalı", "#12936f"],
                ["Son kontenjan", "#e0713a"],
              ].map(([l, c]) => (
                <span key={l} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <span className="size-1.5 rounded-full" style={{ background: c }} /> {l}
                </span>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Durum ve kategori renkleri anlam taşır — hep aynı kalır. Sadece marka vurgusu değişir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
