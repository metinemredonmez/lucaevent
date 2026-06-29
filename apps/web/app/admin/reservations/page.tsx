"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";

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

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-[#B7791F]/15 text-[#92600A]",
  CONFIRMED: "bg-[#657257]/15 text-[#3A5A3A]",
  CANCELED: "bg-[#A23E48]/15 text-[#A23E48]",
};
const FILTERS = ["", "PENDING", "CONFIRMED", "CANCELED"];
const FILTER_LABEL: Record<string, string> = {
  "": "Hepsi",
  PENDING: "Bekleyen",
  CONFIRMED: "Onaylı",
  CANCELED: "İptal",
};

export default function ReservationsAdmin() {
  const [rows, setRows] = useState<Resv[]>([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    const qs = filter ? `?status=${filter}&take=200` : "?take=200";
    api<Resv[]>(`/admin/reservations${qs}`).then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, [filter]);

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

  return (
    <div>
      <h1 className="mb-1 text-3xl text-[#171717]" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
        Rezervasyonlar
      </h1>
      <p className="mb-5 text-sm text-[#6F6F6F]">{rows.length} kayıt</p>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              filter === f ? "bg-[#171717] text-white" : "border border-[#E3DED5] text-[#6F6F6F] hover:bg-[#F7F5F0]"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-[#A23E48]">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-[#E3DED5] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F5F0] text-left text-xs text-[#6F6F6F]">
            <tr>
              <th className="px-4 py-3 font-medium">Kod / Kişi</th>
              <th className="px-4 py-3 font-medium">İletişim</th>
              <th className="px-4 py-3 font-medium">Alan</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Kişi</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 text-right font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#E3DED5] align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#171717]">{r.fullName}</div>
                  <div className="font-mono text-xs text-[#6F6F6F]">{r.code}</div>
                </td>
                <td className="px-4 py-3 text-[#6F6F6F]">
                  <div>{r.phone}</div>
                  <div className="text-xs">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-[#6F6F6F]">{r.area}</td>
                <td className="px-4 py-3 text-[#6F6F6F]">{formatDateTR(r.date)}</td>
                <td className="px-4 py-3 tabular-nums text-[#171717]">{r.partySize}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                  {r.status === "PENDING" && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => action(r.id, "confirm")}
                      className="rounded-md border border-[#657257] px-2 py-1 text-xs text-[#3A5A3A] hover:bg-[#657257]/10"
                    >
                      Onayla
                    </button>
                  )}
                  {r.status !== "CANCELED" && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => {
                        if (confirm(`${r.fullName} — ${r.code} rezervasyonu iptal edilsin mi?`))
                          action(r.id, "cancel");
                      }}
                      className="rounded-md border border-[#A23E48] px-2 py-1 text-xs text-[#A23E48] hover:bg-[#A23E48]/10"
                    >
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#6F6F6F]">
                  Kayıt yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
