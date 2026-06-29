"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/page-header";

type Ev = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  status: string;
  startsAt: string;
  category?: { name: string } | null;
  venue?: { name: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: "bg-[#657257]/15 text-emerald-400",
  DRAFT: "bg-[#6F6F6F]/15 text-muted-foreground",
  CANCELED: "bg-[#A23E48]/15 text-rose-400",
  ARCHIVED: "bg-[#6F6F6F]/10 text-muted-foreground",
  SCHEDULED: "bg-[#3E5A78]/15 text-sky-400",
};

export default function EventsAdmin() {
  const [rows, setRows] = useState<Ev[]>([]);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState("");

  function load() {
    api<Ev[]>("/admin/events?take=100").then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, []);

  async function action(id: string, path: string) {
    setBusy(id);
    try {
      await api(`/admin/events/${id}/${path}`, { method: "POST" });
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Etkinlikler"
        subtitle={`${rows.length} etkinlik`}
        actions={
          <Link
            href="/admin/events/new"
            className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            + Yeni etkinlik
          </Link>
        }
      />
      {err && <p className="text-rose-400 text-sm mb-3">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.kind} · {e.venue?.name ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTR(e.startsAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      STATUS_COLOR[e.status] ?? ""
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <Link
                    href={`/admin/events/${e.id}/attendees`}
                    className="text-xs rounded-md border border-border text-muted-foreground px-2 py-1 hover:bg-muted"
                  >
                    Katılımcılar
                  </Link>
                  <Link
                    href={`/admin/events/${e.id}/edit`}
                    className="text-xs rounded-md border border-border text-foreground px-2 py-1 hover:bg-muted"
                  >
                    Düzenle
                  </Link>
                  {e.status !== "PUBLISHED" && e.status !== "CANCELED" && (
                    <button
                      disabled={busy === e.id}
                      onClick={() => action(e.id, "publish")}
                      className="text-xs rounded-md border border-[#657257] text-emerald-400 px-2 py-1 hover:bg-[#657257]/10"
                    >
                      Yayınla
                    </button>
                  )}
                  {e.status === "PUBLISHED" && (
                    <button
                      disabled={busy === e.id}
                      onClick={() => action(e.id, "unpublish")}
                      className="text-xs rounded-md border border-border text-muted-foreground px-2 py-1 hover:bg-muted"
                    >
                      Geri çek
                    </button>
                  )}
                  {e.status !== "CANCELED" && (
                    <button
                      disabled={busy === e.id}
                      onClick={() => {
                        if (confirm(`"${e.title}" iptal edilsin mi? Ödenmiş biletler iade edilir.`))
                          action(e.id, "cancel");
                      }}
                      className="text-xs rounded-md border border-[#A23E48] text-rose-400 px-2 py-1 hover:bg-[#A23E48]/10"
                    >
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
