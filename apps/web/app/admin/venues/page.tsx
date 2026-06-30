"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, MapPin, Building2, Users, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

type Venue = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
  coverUrl: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY = { name: "", slug: "", city: "", address: "", capacity: "", coverUrl: "" };

export default function VenuesAdmin() {
  const [rows, setRows] = useState<Venue[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  function load() {
    setLoading(true);
    api<Venue[]>("/venues")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }
  function setSlug(slug: string) {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug }));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy("add");
    try {
      await api("/admin/venues", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          city: form.city,
          address: form.address,
          capacity: Number(form.capacity) || 0,
          coverUrl: form.coverUrl,
        }),
      });
      setForm({ ...EMPTY });
      setSlugTouched(false);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(v: Venue) {
    if (!confirm(`${v.name} mekanı silinsin mi?`)) return;
    setBusy(v.id);
    try {
      await api(`/admin/venues/${v.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const input =
    "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50";

  const stats = useMemo(() => {
    const cities = new Set(rows.map((v) => v.city?.trim()).filter(Boolean));
    const totalCapacity = rows.reduce((s, v) => s + (v.capacity || 0), 0);
    const withCapacity = rows.filter((v) => (v.capacity || 0) > 0);
    const avgCapacity = withCapacity.length
      ? Math.round(totalCapacity / withCapacity.length)
      : 0;
    return {
      total: rows.length,
      cities: cities.size,
      totalCapacity,
      avgCapacity,
    };
  }, [rows]);

  const cityChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of rows) {
      const c = v.city?.trim();
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((v) => {
      if (cityFilter !== "all" && v.city?.trim() !== cityFilter) return false;
      if (!term) return true;
      return (
        v.name.toLowerCase().includes(term) ||
        v.city?.toLowerCase().includes(term) ||
        v.address?.toLowerCase().includes(term)
      );
    });
  }, [rows, q, cityFilter]);

  const tl = (n: number) => new Intl.NumberFormat("tr-TR").format(n || 0);

  return (
    <div>
      <AdminPageHeader title="Mekanlar" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam mekan", v: tl(stats.total), c: "text-foreground" },
          { l: "Şehir sayısı", v: tl(stats.cities), c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Toplam kapasite", v: tl(stats.totalCapacity), c: "text-foreground" },
          { l: "Ort. kapasite", v: tl(stats.avgCapacity), c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* create formu */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="h-4 w-4 text-primary" /> Yeni mekan ekle
        </div>
        <form onSubmit={add} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={input}
            placeholder="Ad"
            value={form.name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Şehir"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Adres"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <input
            className={input}
            type="number"
            placeholder="Kapasite"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
          <input
            className={input}
            placeholder="Kapak URL"
            value={form.coverUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={busy === "add"}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {busy === "add" ? "Ekleniyor…" : "Ekle"}
            </button>
          </div>
        </form>
      </div>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mekan, şehir, adres ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        {cityChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCityFilter("all")}
              className={`rounded-full px-3 py-1 text-xs transition ${
                cityFilter === "all"
                  ? "bg-primary text-white"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            {cityChips.map((c) => (
              <button
                key={c}
                onClick={() => setCityFilter(c)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  cityFilter === c
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz mekan yok." : "Bu filtreyle mekan yok."}
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className="divide-y divide-border">
            {list.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
              >
                {/* görsel / pin */}
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
                  {v.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.coverUrl} alt={v.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/80">
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* başlık + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{v.name}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                    {v.city && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {v.city}
                      </span>
                    )}
                    {v.address && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {v.address}
                      </span>
                    )}
                    <span className="font-mono text-muted-foreground/70">{v.slug}</span>
                  </div>
                </div>

                {/* kapasite */}
                <div className="hidden shrink-0 sm:block">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="tabular-nums">{tl(v.capacity)}</span>
                  </span>
                </div>

                {/* aksiyon */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    disabled={busy === v.id}
                    onClick={() => remove(v)}
                    aria-label="Sil"
                    title="Sil"
                    className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
