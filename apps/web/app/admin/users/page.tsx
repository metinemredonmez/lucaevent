"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLES = ["SUPERADMIN", "ADMIN", "EDITOR", "DOOR", "VIEWER"];

// Rol rozetleri — tema-güvenli renkler (light + dark WCAG).
const ROLE_META: Record<string, { l: string; c: string }> = {
  SUPERADMIN: { l: "Süper Admin", c: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  ADMIN: { l: "Admin", c: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  EDITOR: { l: "Editör", c: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  DOOR: { l: "Kapı", c: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  VIEWER: { l: "İzleyici", c: "bg-muted text-muted-foreground" },
};

const ROLE_LABEL = (r: string) => ROLE_META[r]?.l ?? r;

// "Yönetici" sayılan roller (admin istatistiği + filtresi için).
const ADMIN_ROLES = new Set(["SUPERADMIN", "ADMIN", "EDITOR", "DOOR"]);

const FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "admins", l: "Yönetici" },
  { v: "members", l: "Üye" },
  ...ROLES.map((r) => ({ v: r, l: ROLE_LABEL(r) })),
];

function initials(name: string, email: string): string {
  const base = (name || "").trim();
  if (base) {
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return base.slice(0, 2).toUpperCase();
  }
  return (email || "?").slice(0, 2).toUpperCase();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return now - d <= 7 * 24 * 60 * 60 * 1000 && d <= now;
}

export default function UsersAdmin() {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  function load() {
    setLoading(true);
    setErr("");
    api<User[]>("/admin/users")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function changeRole(id: string, role: string) {
    setBusy(id);
    setErr("");
    try {
      await api(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const admins = rows.filter((u) => ADMIN_ROLES.has(u.role)).length;
    return {
      total: rows.length,
      admins,
      members: rows.length - admins,
      week: rows.filter((u) => isThisWeek(u.createdAt)).length,
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (filter === "admins" && !ADMIN_ROLES.has(u.role)) return false;
      if (filter === "members" && ADMIN_ROLES.has(u.role)) return false;
      if (filter !== "all" && filter !== "admins" && filter !== "members" && u.role !== filter)
        return false;
      if (!term) return true;
      return (
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader title="Kullanıcılar" subtitle={`${rows.length} kayıt`} />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Yönetici", v: stats.admins, c: "text-rose-600 dark:text-rose-400" },
          { l: "Üye", v: stats.members, c: "text-foreground" },
          { l: "Bu hafta", v: stats.week, c: "text-emerald-600 dark:text-emerald-400" },
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
            placeholder="Ad, e-posta ara…"
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

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Henüz kullanıcı yok." : "Bu filtreyle kullanıcı yok."}
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="divide-y divide-border">
            {list.map((u) => {
              const rm = ROLE_META[u.role] ?? { l: u.role, c: "bg-muted text-muted-foreground" };
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
                >
                  {/* avatar / baş harf */}
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-[13px] font-semibold text-white">
                    {initials(u.name, u.email)}
                  </div>

                  {/* kimlik + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {u.name || "—"}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${rm.c}`}
                      >
                        {ADMIN_ROLES.has(u.role) ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <UserCog className="h-3 w-3" />
                        )}
                        {rm.l}
                      </span>
                      {!u.isActive && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          Pasif
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="truncate">{u.email}</span>
                      <span>·</span>
                      <span>{formatDateTR(u.createdAt)}</span>
                      {isToday(u.createdAt) && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[10px] text-emerald-600 dark:text-emerald-400">
                          Bugün
                        </span>
                      )}
                    </div>
                  </div>

                  {/* rol değiştir (PATCH) */}
                  <div className="shrink-0">
                    <select
                      value={u.role}
                      disabled={busy === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      aria-label="Rol değiştir"
                      className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none transition focus:border-primary/50 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL(r)}
                        </option>
                      ))}
                    </select>
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
