"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";

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
  PUBLISHED: "bg-[#657257]/15 text-[#3A5A3A]",
  DRAFT: "bg-[#6F6F6F]/15 text-[#6F6F6F]",
  CANCELED: "bg-[#A23E48]/15 text-[#A23E48]",
  ARCHIVED: "bg-[#6F6F6F]/10 text-[#6F6F6F]",
  SCHEDULED: "bg-[#3E5A78]/15 text-[#3E5A78]",
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl text-[#171717] mb-1"
            style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
          >
            Etkinlikler
          </h1>
          <p className="text-sm text-[#6F6F6F]">{rows.length} etkinlik</p>
        </div>
        <Link
          href="/admin/events/new"
          className="rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Yeni etkinlik
        </Link>
      </div>
      {err && <p className="text-[#A23E48] text-sm mb-3">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-[#E3DED5] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F5F0] text-left text-xs text-[#6F6F6F]">
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
              <tr key={e.id} className="border-t border-[#E3DED5]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#171717]">{e.title}</div>
                  <div className="text-xs text-[#6F6F6F]">
                    {e.kind} · {e.venue?.name ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#6F6F6F]">{e.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-[#6F6F6F]">{formatDateTR(e.startsAt)}</td>
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
                    href={`/admin/events/${e.id}/edit`}
                    className="text-xs rounded-md border border-[#E3DED5] text-[#171717] px-2 py-1 hover:bg-[#F7F5F0]"
                  >
                    Düzenle
                  </Link>
                  {e.status !== "PUBLISHED" && e.status !== "CANCELED" && (
                    <button
                      disabled={busy === e.id}
                      onClick={() => action(e.id, "publish")}
                      className="text-xs rounded-md border border-[#657257] text-[#3A5A3A] px-2 py-1 hover:bg-[#657257]/10"
                    >
                      Yayınla
                    </button>
                  )}
                  {e.status === "PUBLISHED" && (
                    <button
                      disabled={busy === e.id}
                      onClick={() => action(e.id, "unpublish")}
                      className="text-xs rounded-md border border-[#E3DED5] text-[#6F6F6F] px-2 py-1 hover:bg-[#F7F5F0]"
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
                      className="text-xs rounded-md border border-[#A23E48] text-[#A23E48] px-2 py-1 hover:bg-[#A23E48]/10"
                    >
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#6F6F6F]">
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
