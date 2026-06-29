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
  PENDING: "bg-[#B7791F]/15 text-amber-400",
  CONFIRMED: "bg-[#657257]/15 text-emerald-400",
  CANCELED: "bg-[#A23E48]/15 text-rose-400",
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
      <h1 className="mb-1 text-3xl text-foreground" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
        Rezervasyonlar
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">{rows.length} kayıt</p>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              filter === f ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
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
              <tr key={r.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.fullName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{r.code}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{r.phone}</div>
                  <div className="text-xs">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.area}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTR(r.date)}</td>
                <td className="px-4 py-3 tabular-nums text-foreground">{r.partySize}</td>
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
                      className="rounded-md border border-[#657257] px-2 py-1 text-xs text-emerald-400 hover:bg-[#657257]/10"
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
                      className="rounded-md border border-[#A23E48] px-2 py-1 text-xs text-rose-400 hover:bg-[#A23E48]/10"
                    >
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
