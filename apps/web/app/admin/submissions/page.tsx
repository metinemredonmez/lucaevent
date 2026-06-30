"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mail,
  Phone,
  CalendarDays,
  Check,
  Archive,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Sub = {
  id: string;
  type: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  payload?: { interests?: string[] } | null;
  status: string;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  CONTACT: "İletişim",
  EVENT_PROPOSAL: "Etkinlik Öner",
  MEMBERSHIP: "Üyelik",
};
const TYPE_COLOR: Record<string, string> = {
  CONTACT: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  EVENT_PROPOSAL: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  MEMBERSHIP: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
const STATUS: Record<string, { l: string; c: string }> = {
  NEW: { l: "Yeni", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  REVIEWED: { l: "İncelendi", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  ARCHIVED: { l: "Arşiv", c: "bg-muted text-muted-foreground" },
};

const TYPE_FILTERS = [
  { v: "all", l: "Hepsi" },
  { v: "CONTACT", l: "İletişim" },
  { v: "EVENT_PROPOSAL", l: "Etkinlik Öner" },
  { v: "MEMBERSHIP", l: "Üyelik" },
];

export default function SubmissionsAdmin() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setLoading(true);
    api<Sub[]>("/admin/submissions")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await api(`/admin/submissions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
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
      new: by("NEW"),
      reviewed: by("REVIEWED"),
      archived: by("ARCHIVED"),
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.subject?.toLowerCase().includes(term) ||
        r.message?.toLowerCase().includes(term)
      );
    });
  }, [rows, type, q]);

  return (
    <div>
      <AdminPageHeader title="Başvurular & Mesajlar" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Yeni", v: stats.new, c: "text-amber-600 dark:text-amber-400" },
          { l: "İncelendi", v: stats.reviewed, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Arşiv", v: stats.archived, c: "text-muted-foreground" },
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
            placeholder="Ad, e-posta, konu, mesaj ara…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.v}
              onClick={() => setType(f.v)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                type === f.v ? "bg-primary text-white" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* liste */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "Henüz başvuru yok." : "Bu filtreyle başvuru yok."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const st = STATUS[r.status] ?? { l: r.status, c: "bg-muted text-muted-foreground" };
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{r.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${TYPE_COLOR[r.type] ?? "bg-muted text-muted-foreground"}`}>
                        {TYPE_LABEL[r.type] ?? r.type}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${st.c}`}>{st.l}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      {r.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {r.email}
                        </span>
                      )}
                      {r.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {r.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatDateTR(r.createdAt)}
                      </span>
                    </div>
                    {r.subject && <div className="mt-2 text-sm font-medium text-foreground">{r.subject}</div>}
                    {r.message && (
                      <div className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{r.message}</div>
                    )}
                    {r.payload?.interests?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.payload.interests.map((i) => (
                          <span
                            key={i}
                            className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* aksiyonlar */}
                  <div className="flex shrink-0 items-center gap-1">
                    {r.status !== "REVIEWED" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, "REVIEWED")}
                        aria-label="İncelendi"
                        title="İncelendi"
                        className="grid size-8 place-items-center rounded-md border border-border text-emerald-600 transition hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {r.status !== "ARCHIVED" && (
                      <button
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, "ARCHIVED")}
                        aria-label="Arşivle"
                        title="Arşivle"
                        className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
