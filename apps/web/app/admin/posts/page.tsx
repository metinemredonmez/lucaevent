"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Yayında",
  DRAFT: "Taslak",
  ARCHIVED: "Arşiv",
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default function PostsAdmin() {
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");

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

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        subtitle="Blog yazılarını yönet"
        actions={
          <Link
            href="/admin/posts/new"
            className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            + Yeni yazı
          </Link>
        }
      />
      {err && <p className="text-destructive text-sm mb-3">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Güncellendi</th>
              <th className="px-4 py-3 font-medium text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      STATUS_COLOR[p.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTR(p.updatedAt)}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="text-xs rounded-md border border-border text-foreground px-2 py-1 hover:bg-muted"
                  >
                    Düzenle
                  </Link>
                  <button
                    disabled={busy === p.id}
                    onClick={() => remove(p)}
                    className="text-xs rounded-md border border-destructive/40 text-destructive px-2 py-1 hover:bg-destructive/10 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && !err && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz yazı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
