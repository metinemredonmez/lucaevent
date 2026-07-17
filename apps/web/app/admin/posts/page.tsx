"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Plus, Pencil, Trash2, FileText, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  content?: string | null;
  status: string;
  publishedAt?: string | null;
  updatedAt: string;
};

const STATUS: Record<string, { l: string; c: string }> = {
  PUBLISHED: { l: "Yayında", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  DRAFT: { l: "Taslak", c: "bg-muted text-muted-foreground" },
  ARCHIVED: { l: "Arşiv", c: "bg-muted text-muted-foreground" },
};

const FILTERS = [
  { v: "all", l: "Tümü" },
  { v: "PUBLISHED", l: "Yayında" },
  { v: "DRAFT", l: "Taslak" },
  { v: "ARCHIVED", l: "Arşiv" },
];

export default function PostsAdmin() {
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api<Post[]>("/admin/posts")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function remove(p: Post) {
    if (!window.confirm(`"${p.title}" silinsin mi?`)) return;
    setBusy(p.id);
    try {
      await api(`/admin/posts/${p.id}`, { method: "DELETE" });
      setRows((rs) => rs.filter((r) => r.id !== p.id));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const stats = useMemo(() => {
    const by = (s: string) => rows.filter((p) => p.status === s).length;
    return {
      total: rows.length,
      published: by("PUBLISHED"),
      draft: by("DRAFT"),
      archived: by("ARCHIVED"),
    };
  }, [rows]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!term) return true;
      return p.title.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        subtitle={`${rows.length} kayıt`}
        actions={
          <Link
            href="/admin/posts/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yeni yazı
          </Link>
        }
      />

      {/* istatistik şeridi */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Toplam", v: stats.total, c: "text-foreground" },
          { l: "Yayında", v: stats.published, c: "text-emerald-600 dark:text-emerald-400" },
          { l: "Taslak", v: stats.draft, c: "text-muted-foreground" },
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
            placeholder="Başlık ara…"
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
            {rows.length === 0 ? "Henüz yazı yok." : "Bu filtreyle yazı yok."}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((p) => {
            const st = STATUS[p.status] ?? { l: p.status, c: "bg-muted text-muted-foreground" };
            return (
              <div key={p.id} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4">
                {/* kapak */}
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-14">
                  {p.coverUrl ? (
                    <Image src={p.coverUrl} alt={p.title} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-white/80">
                      <FileText className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* başlık + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{p.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${st.c}`}>{st.l}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="truncate">/{p.slug}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {formatDateTR(p.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* aksiyonlar */}
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    aria-label="Düzenle"
                    className="grid size-8 place-items-center rounded-md border border-border text-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    disabled={busy === p.id}
                    onClick={() => remove(p)}
                    aria-label="Sil"
                    className="grid size-8 place-items-center rounded-md border border-destructive/40 text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
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
