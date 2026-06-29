"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Page = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
};

export default function PagesAdmin() {
  const [rows, setRows] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<Page[]>("/admin/pages")
      .then(setRows)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function remove(p: Page) {
    if (!confirm(`"${p.title}" sayfası silinsin mi?`)) return;
    setBusy(p.id);
    try {
      await api(`/admin/pages/${p.id}`, { method: "DELETE" });
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
        title="İçerik Sayfaları"
        subtitle="Hakkımızda, Güvenlik gibi statik sayfaları düzenle"
        actions={
          <Link
            href="/admin/pages/new"
            className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            + Yeni sayfa
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
                      p.isPublished
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.isPublished ? "Yayında" : "Gizli"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTR(p.updatedAt)}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <Link
                    href={`/admin/pages/${p.id}/edit`}
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
            {!loading && rows.length === 0 && !err && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Henüz sayfa yok.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Yükleniyor…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
