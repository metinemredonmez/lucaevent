"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Repeat,
  Sparkles,
  Trash2,
  Info,
  CalendarRange,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

type Series = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  [key: string]: any;
};

const KIND_LABEL: Record<string, string> = {
  PARTY: "Parti",
  CAMP: "Kamp",
  TRIP: "Gezi",
  CONCERT: "Konser",
  SHOWCASE: "Showcase",
};

export default function EventSeriesAdmin() {
  const [rows, setRows] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  function load() {
    setLoading(true);
    api<Series[]>("/admin/event-series")
      .then(setRows)
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function generate(s: Series) {
    if (!confirm(`"${s.title}" serisi için seanslar üretilsin mi?`)) return;
    setBusy(s.id);
    setErr("");
    setMsg("");
    try {
      const res: any = await api(`/admin/event-series/${s.id}/generate`, {
        method: "POST",
      });
      const count =
        res?.created ?? res?.count ?? (Array.isArray(res) ? res.length : null);
      setMsg(
        count != null
          ? `"${s.title}": ${count} seans üretildi.`
          : res?.message || `"${s.title}" için seanslar üretildi.`,
      );
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(s: Series) {
    if (!confirm(`"${s.title}" serisi silinsin mi?`)) return;
    setBusy(s.id);
    setErr("");
    setMsg("");
    try {
      await api(`/admin/event-series/${s.id}`, { method: "DELETE" });
      setMsg(`"${s.title}" silindi.`);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  // istemci tarafı istatistikler
  const stats = useMemo(() => {
    const kinds = new Set(rows.map((s) => s.kind).filter(Boolean));
    return {
      total: rows.length,
      kinds: kinds.size,
      party: rows.filter((s) => s.kind === "PARTY").length,
      other: rows.filter((s) => s.kind !== "PARTY").length,
    };
  }, [rows]);

  // dinamik tür filtreleri (yüklenen satırlardan)
  const kindFilters = useMemo(() => {
    const seen: string[] = [];
    for (const s of rows) {
      if (s.kind && !seen.includes(s.kind)) seen.push(s.kind);
    }
    return [
      { v: "all", l: "Tümü" },
      ...seen.map((k) => ({ v: k, l: KIND_LABEL[k] ?? k })),
    ];
  }, [rows]);

  // istemci tarafı arama + filtre
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((s) => {
      if (filter !== "all" && s.kind !== filter) return false;
      if (!term) return true;
      return (
        s.title?.toLowerCase().includes(term) ||
        s.slug?.toLowerCase().includes(term) ||
        (KIND_LABEL[s.kind] ?? s.kind ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader
        title="Tekrarlayan etkinlikler"
        subtitle={`${rows.length} kayıt`}
      />

      {/* bilgilendirme kartı */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-gradient-to-br from-[#6366F1]/10 via-card to-card p-4 dark:from-[#6366F1]/14">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Info className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            Seriler API üzerinden oluşturulur
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Yeni seri oluşturma karmaşık olduğundan şu an seriler API'den
            tanımlanır. Buradan tanımlı serilerin seanslarını üretip
            yönetebilirsin.
          </p>
        </div>
      </div>

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam seri", v: stats.total, c: "text-foreground" },
          { l: "Aktif tür", v: stats.kinds, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Parti", v: stats.party, c: "text-muted-foreground" },
          { l: "Diğer türler", v: stats.other, c: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className={`text-2xl font-semibold tabular-nums ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Seri, slug ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        {kindFilters.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {kindFilters.map((f) => (
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
        )}
      </div>

      {msg && <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div className="mt-3 text-sm font-medium text-foreground">
              {rows.length === 0 ? "Henüz seri yok" : "Eşleşen seri yok"}
            </div>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
              {rows.length === 0
                ? "Tekrarlayan etkinlik serileri API üzerinden tanımlanınca burada listelenir ve seanslarını üretebilirsin."
                : "Arama veya tür filtresiyle eşleşen seri bulunamadı. Filtreyi temizlemeyi dene."}
            </p>
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="divide-y divide-border">
            {list.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
              >
                {/* ikon */}
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white/90 sm:size-14">
                  <Repeat className="h-5 w-5" />
                </div>

                {/* başlık + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {s.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                      {KIND_LABEL[s.kind] ?? s.kind}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {s.slug}
                  </div>
                </div>

                {/* aksiyonlar */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    disabled={busy === s.id}
                    onClick={() => generate(s)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Seans üret
                  </button>
                  <button
                    disabled={busy === s.id}
                    onClick={() => remove(s)}
                    aria-label="Seriyi sil"
                    className="grid size-8 place-items-center rounded-md border border-border text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
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
