"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, ListVideo, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Item = { id: string; videoId: string; title: string; thumbUrl: string | null };
type Collection = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED";
  sort: number;
  items: Item[];
  updatedAt: string;
};

const STATUS: Record<string, { l: string; c: string }> = {
  PUBLISHED: { l: "Yayında", c: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  DRAFT: { l: "Taslak", c: "bg-muted text-muted-foreground" },
};

export default function CollectionsAdmin() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    api<Collection[]>("/admin/collections")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy("new");
    setErr("");
    try {
      const created = await api<Collection>("/admin/collections", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          sort: rows.length,
        }),
      });
      setRows((rs) => [...rs, { ...created, items: created.items ?? [] }]);
      setTitle("");
      setSubtitle("");
      setCreating(false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function toggleStatus(c: Collection) {
    const status = c.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBusy(c.id);
    try {
      await api(`/admin/collections/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRows((rs) => rs.map((r) => (r.id === c.id ? { ...r, status } : r)));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(c: Collection) {
    if (!window.confirm(`"${c.title}" koleksiyonu ve içindeki ${c.items.length} video silinsin mi?`))
      return;
    setBusy(c.id);
    try {
      await api(`/admin/collections/${c.id}`, { method: "DELETE" });
      setRows((rs) => rs.filter((r) => r.id !== c.id));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (c) => c.title.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term),
    );
  }, [rows, q]);

  return (
    <div>
      <AdminPageHeader
        title="Collection'lar"
        subtitle={`${rows.length} koleksiyon · ana sayfada panonun altında görünür`}
        actions={
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8] px-3.5 text-[13px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yeni koleksiyon
          </button>
        }
      />

      {creating && (
        <form
          onSubmit={create}
          className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pazar collection'ları"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Alt başlık (opsiyonel)</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Pazar için seçilmiş setler"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled={busy === "new" || !title.trim()}
              className="h-9 rounded-lg bg-primary px-4 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "new" ? "Ekleniyor…" : "Oluştur"}
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Koleksiyon ara…"
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "Henüz koleksiyon yok. “Yeni koleksiyon” ile başla."
              : "Bu aramayla koleksiyon yok."}
          </div>
        )}
        <div className="divide-y divide-border">
          {list.map((c) => {
            const st = STATUS[c.status] ?? { l: c.status, c: "bg-muted text-muted-foreground" };
            const cover = c.items[0]?.thumbUrl;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {cover ? (
                    <Image src={cover} alt={c.title} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-white/80">
                      <ListVideo className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{c.title}</span>
                    <button
                      onClick={() => toggleStatus(c)}
                      disabled={busy === c.id}
                      title="Yayın durumunu değiştir"
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] transition hover:opacity-80 disabled:opacity-50 ${st.c}`}
                    >
                      {st.l}
                    </button>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="truncate">/{c.slug}</span>
                    <span>{c.items.length} video</span>
                    <span>{formatDateTR(c.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/collections/${c.id}`}
                    aria-label="Düzenle"
                    className="grid size-8 place-items-center rounded-md border border-border text-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    disabled={busy === c.id}
                    onClick={() => remove(c)}
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
