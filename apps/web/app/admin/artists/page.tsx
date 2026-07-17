"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Music2, Trash2, Instagram, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

type Artist = {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  country?: string | null;
  instagram?: string | null;
  soundcloud?: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const EMPTY = {
  name: "",
  slug: "",
  country: "",
  instagram: "",
  soundcloud: "",
  bio: "",
};

export default function ArtistsAdmin() {
  const [rows, setRows] = useState<Artist[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delBusy, setDelBusy] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "country" | "links">("all");

  function load() {
    setLoading(true);
    api<Artist[]>("/artists")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api("/admin/artists", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          country: form.country.trim() || null,
          instagram: form.instagram.trim() || null,
          soundcloud: form.soundcloud.trim() || null,
          bio: form.bio.trim() || null,
        }),
      });
      setForm({ ...EMPTY });
      setSlugTouched(false);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function del(a: Artist) {
    if (!confirm(`${a.name} sanatçısı silinsin mi?`)) return;
    setDelBusy(a.id);
    setErr("");
    try {
      await api(`/admin/artists/${a.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDelBusy("");
    }
  }

  const stats = useMemo(() => {
    const withCountry = rows.filter((a) => !!a.country?.trim()).length;
    const withSocial = rows.filter(
      (a) => !!a.instagram?.trim() || !!a.soundcloud?.trim(),
    ).length;
    const countries = new Set(
      rows.map((a) => a.country?.trim()).filter(Boolean) as string[],
    ).size;
    return {
      total: rows.length,
      withCountry,
      withSocial,
      countries,
    };
  }, [rows]);

  const FILTERS = [
    { v: "all", l: "Tümü" },
    { v: "country", l: "Ülkeli" },
    { v: "links", l: "Sosyal medyalı" },
  ] as const;

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((a) => {
      if (filter === "country" && !a.country?.trim()) return false;
      if (filter === "links" && !a.instagram?.trim() && !a.soundcloud?.trim())
        return false;
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        a.slug.toLowerCase().includes(term) ||
        a.country?.toLowerCase().includes(term) ||
        a.instagram?.toLowerCase().includes(term)
      );
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader title="Sanatçılar" subtitle={`${rows.length} sanatçı`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam sanatçı", v: stats.total, c: "text-foreground" },
          { l: "Ülke bilgili", v: stats.withCountry, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Sosyal medyalı", v: stats.withSocial, c: "text-sky-600 dark:text-sky-400" },
          { l: "Farklı ülke", v: stats.countries, c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* create/edit formu — korunan alanlar/state/submit */}
      <form
        onSubmit={add}
        className="mb-6 rounded-xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Ad</span>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="Sanatçı adı"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="sanatci-adi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Ülke</span>
            <input
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="Türkiye"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Instagram</span>
            <input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="@kullaniciadi"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">SoundCloud</span>
            <input
              value={form.soundcloud}
              onChange={(e) => set("soundcloud", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="soundcloud.com/..."
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs text-muted-foreground">Bio</span>
            <textarea
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
              placeholder="Kısa biyografi"
            />
          </label>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </form>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sanatçı, ülke ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === f.v
                  ? "bg-primary text-white"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        )}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz sanatçı yok." : "Bu filtreyle sanatçı yok."}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
            >
              {/* avatar / baş harf */}
              <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-sm font-semibold text-white sm:size-14">
                {initials(a.name) || <Music2 className="h-5 w-5" />}
              </div>

              {/* ad + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {a.name}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{a.slug}</span>
                  {a.country && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {a.country}
                    </span>
                  )}
                  {a.instagram && (
                    <span className="inline-flex items-center gap-1">
                      <Instagram className="h-3 w-3" /> {a.instagram}
                    </span>
                  )}
                </div>
              </div>

              {/* aksiyon */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  disabled={delBusy === a.id}
                  onClick={() => del(a)}
                  aria-label="Sil"
                  title="Sil"
                  className="grid size-8 place-items-center rounded-md border border-border text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
