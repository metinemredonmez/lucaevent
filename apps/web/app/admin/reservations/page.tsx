"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check, X, MapPin, CalendarDays, Phone, Mail, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Resv = {
  id: string;
  code: string;
  area: string;
  date: string;
  partySize: number;
  fullName: string;
  phone: string;
  email: string;
  note?: string | null;
  status: string;
  createdAt: string;
};

const STATUS: Record<string, { l: string; c: string }> = {
  PENDING: { l: "Bekleyen", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  CONFIRMED: { l: "Onaylı", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  CANCELED: { l: "İptal", c: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
};

const FILTERS = [
  { v: "all", l: "Hepsi" },
  { v: "PENDING", l: "Bekleyen" },
  { v: "CONFIRMED", l: "Onaylı" },
  { v: "CANCELED", l: "İptal" },
];

export default function ReservationsAdmin() {
  const [rows, setRows] = useState<Resv[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setLoading(true);
    api<Resv[]>("/admin/reservations?take=200")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function action(id: string, path: string) {
    setBusy(id);
    try {
      await api(`/admin/reservations/${id}/${path}`, { method: "POST" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      pending: by("PENDING"),
      confirmed: by("CONFIRMED"),
      canceled: by("CANCELED"),
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return (
        r.fullName.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader title="Rezervasyonlar" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Bekleyen", v: stats.pending, c: "text-amber-600 dark:text-amber-400" },
          { l: "Onaylı", v: stats.confirmed, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "İptal", v: stats.canceled, c: "text-rose-600 dark:text-rose-400" },
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
            placeholder="Ad, kod, telefon, e-posta ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz rezervasyon yok." : "Bu filtreyle rezervasyon yok."}
          </div>
        )}
        {!loading && list.length > 0 && (
          <div className="divide-y divide-border">
            {list.map((r) => {
              const st = STATUS[r.status] ?? { l: r.status, c: "bg-muted text-muted-foreground" };
              return (
                <div key={r.id} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4">
                  {/* ad + kod + iletişim */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{r.fullName}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${st.c}`}>{st.l}</span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{r.code}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {r.phone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {r.email}
                      </span>
                    </div>
                  </div>

                  {/* alan + tarih + kişi */}
                  <div className="hidden shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground sm:flex">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {r.area}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {formatDateTR(r.date)}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="h-3 w-3" /> {r.partySize} kişi
                    </span>
                  </div>

                  {/* aksiyonlar */}
                  <div className="flex shrink-0 items-center gap-1">
                    {r.status === "PENDING" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => action(r.id, "confirm")}
                        aria-label="Onayla"
                        title="Onayla"
                        className="grid size-8 place-items-center rounded-md border border-border text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {r.status !== "CANCELED" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => {
                          if (confirm(`${r.fullName} — ${r.code} rezervasyonu iptal edilsin mi?`)) action(r.id, "cancel");
                        }}
                        aria-label="İptal"
                        title="İptal"
                        className="grid size-8 place-items-center rounded-md border border-border text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
