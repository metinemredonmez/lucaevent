"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Percent, Tag, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/page-header";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
};

const FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "active", l: "Aktif" },
  { v: "passive", l: "Pasif" },
] as const;

type FilterKey = (typeof FILTERS)[number]["v"];

function discountLabel(c: Coupon): string {
  return c.type === "PERCENT" ? `%${c.value}` : `${(c.value / 100).toFixed(0)} TL`;
}

export default function CouponsAdmin() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [busy, setBusy] = useState<string>("");

  function load() {
    setLoading(true);
    api<Coupon[]>("/admin/coupons")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          ...(maxUses ? { maxUses: Number(maxUses) } : {}),
        }),
      });
      setCode("");
      setMaxUses("");
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function del(id: string) {
    setBusy(id);
    try {
      await api(`/admin/coupons/${id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const active = rows.filter((c) => c.isActive).length;
    return {
      total: rows.length,
      active,
      passive: rows.length - active,
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((c) => {
      if (filter === "active" && !c.isActive) return false;
      if (filter === "passive" && c.isActive) return false;
      if (!term) return true;
      return c.code.toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader title="Kuponlar" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Aktif", v: stats.active, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Pasif", v: stats.passive, c: "text-muted-foreground" },
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
        className="mb-6 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <label className="text-xs text-muted-foreground">Kod</label>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="YAZ25" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tip</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="block h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="PERCENT">% Yüzde</option>
            <option value="FIXED">Sabit (kuruş)</option>
          </select>
        </div>
        <div className="w-28">
          <label className="text-xs text-muted-foreground">Değer</label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" required />
        </div>
        <div className="w-28">
          <label className="text-xs text-muted-foreground">Max kullanım</label>
          <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" placeholder="∞" />
        </div>
        <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1 h-4 w-4" /> Ekle
        </Button>
      </form>

      {/* araç çubuğu */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kupon kodu ara…"
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

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz kupon yok." : "Bu filtreyle kupon yok."}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((c) => {
            const limited = c.maxUses != null;
            const exhausted = limited && c.usedCount >= (c.maxUses as number);
            return (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4">
                {/* tür ikonu */}
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {c.type === "PERCENT" ? <Percent className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                </div>

                {/* kod + rozetler */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium text-foreground">{c.code}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                        c.type === "PERCENT"
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {c.type === "PERCENT" ? "Yüzde" : "Sabit"}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                        c.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="text-foreground">İndirim: {discountLabel(c)}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      Kullanım: {c.usedCount}
                      {limited ? ` / ${c.maxUses}` : " / ∞"}
                      {exhausted && (
                        <span className="text-rose-600 dark:text-rose-400">(doldu)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* aksiyonlar */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    disabled={busy === c.id}
                    onClick={() => {
                      if (confirm(`"${c.code}" kuponu silinsin mi?`)) del(c.id);
                    }}
                    aria-label="Sil"
                    className="grid size-8 place-items-center rounded-md border border-border text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
