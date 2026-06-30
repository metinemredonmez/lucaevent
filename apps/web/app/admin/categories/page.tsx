"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Trash2,
  Tag,
  Hash,
  Music,
  Tent,
  Plane,
  PartyPopper,
  Sparkles,
  Mic2,
  Heart,
  Palette,
  Star,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

type Cat = {
  id: string;
  slug: string;
  name: string;
  position: number;
  icon?: string | null;
  color?: string | null;
};

// Kategori icon string'ini bir lucide ikonuna eşle (eşleşme yoksa Tag).
const ICONS: Record<string, LucideIcon> = {
  music: Music,
  concert: Mic2,
  mic: Mic2,
  party: PartyPopper,
  camp: Tent,
  tent: Tent,
  trip: Plane,
  travel: Plane,
  plane: Plane,
  wellness: Heart,
  heart: Heart,
  art: Palette,
  palette: Palette,
  showcase: Sparkles,
  sparkles: Sparkles,
  star: Star,
  tag: Tag,
};
function iconFor(name?: string | null): LucideIcon {
  if (!name) return Tag;
  return ICONS[name.trim().toLowerCase()] ?? Tag;
}

// Geçerli bir renk değeri mi (hex / rgb / hsl / isimli)? — boşsa tema rengine düş.
function safeColor(c?: string | null): string | undefined {
  const v = c?.trim();
  if (!v) return undefined;
  return v;
}

export default function CategoriesAdmin() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");

  function load() {
    setLoading(true);
    api<Cat[]>("/categories")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug, position: rows.length }),
      });
      setName("");
      setSlug("");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function del(id: string) {
    setErr("");
    setBusy(id);
    try {
      await api(`/admin/categories/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const withIcon = rows.filter((c) => !!c.icon?.trim()).length;
    const withColor = rows.filter((c) => !!c.color?.trim()).length;
    return {
      total: rows.length,
      withIcon,
      withColor,
      plain: rows.filter((c) => !c.icon?.trim() && !c.color?.trim()).length,
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term),
    );
  }, [rows, q]);

  return (
    <div>
      <AdminPageHeader title="Kategoriler" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam kategori", v: stats.total, c: "text-foreground" },
          { l: "İkonlu", v: stats.withIcon, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Renkli", v: stats.withColor, c: "text-violet-600 dark:text-violet-400" },
          { l: "Sade", v: stats.plain, c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* oluşturma formu */}
      <form
        onSubmit={add}
        className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Ad</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="wellness" required />
        </div>
        <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
          Ekle
        </Button>
      </form>

      {/* arama */}
      <div className="mb-4">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kategori adı veya slug ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz kategori yok." : "Aramayla eşleşen kategori yok."}
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className="divide-y divide-border">
            {list.map((c) => {
              const Icon = iconFor(c.icon);
              const color = safeColor(c.color);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
                >
                  {/* ikon + renk noktası */}
                  <div
                    className="relative grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground"
                    style={color ? { color } : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {color && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card"
                        style={{ background: color }}
                        aria-hidden
                      />
                    )}
                  </div>

                  {/* ad + slug */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {c.slug}
                      </span>
                      {c.color && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="size-2.5 rounded-full border border-border"
                            style={{ background: color }}
                            aria-hidden
                          />
                          {c.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* aksiyon */}
                  <button
                    onClick={() => {
                      if (confirm(`"${c.name}" kategorisi silinsin mi?`)) del(c.id);
                    }}
                    disabled={busy === c.id}
                    aria-label="Sil"
                    title="Sil"
                    className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
