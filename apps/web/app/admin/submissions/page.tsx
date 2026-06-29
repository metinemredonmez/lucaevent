"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";

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
  CONTACT: "bg-[#3E5A78]/15 text-[#3E5A78]",
  EVENT_PROPOSAL: "bg-[#8B5CF6]/15 text-[#6D28D9]",
  MEMBERSHIP: "bg-[#657257]/15 text-[#3A5A3A]",
};
const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-[#B7791F]/15 text-[#92600A]",
  REVIEWED: "bg-[#657257]/15 text-[#3A5A3A]",
  ARCHIVED: "bg-[#6F6F6F]/15 text-[#6F6F6F]",
};
const TYPE_FILTERS = ["", "CONTACT", "EVENT_PROPOSAL", "MEMBERSHIP"];

export default function SubmissionsAdmin() {
  const [rows, setRows] = useState<Sub[]>([]);
  const [type, setType] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  function load() {
    const qs = type ? `?type=${type}` : "";
    api<Sub[]>(`/admin/submissions${qs}`).then(setRows).catch((e) => setErr(e.message));
  }
  useEffect(load, [type]);

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

  return (
    <div>
      <h1 className="mb-1 text-3xl text-[#171717]" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
        Başvurular & Mesajlar
      </h1>
      <p className="mb-5 text-sm text-[#6F6F6F]">{rows.length} kayıt</p>

      <div className="mb-4 flex gap-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t || "all"}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              type === t ? "bg-[#171717] text-white" : "border border-[#E3DED5] text-[#6F6F6F] hover:bg-[#F7F5F0]"
            }`}
          >
            {t ? TYPE_LABEL[t] : "Hepsi"}
          </button>
        ))}
      </div>

      {err && <p className="mb-3 text-sm text-[#A23E48]">{err}</p>}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#E3DED5] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#171717]">{r.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${TYPE_COLOR[r.type] ?? ""}`}>
                    {TYPE_LABEL[r.type] ?? r.type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLOR[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-[#6F6F6F]">
                  {[r.email, r.phone].filter(Boolean).join(" · ")} · {formatDateTR(r.createdAt)}
                </div>
                {r.subject && <div className="mt-2 text-sm font-medium text-[#171717]">{r.subject}</div>}
                {r.message && <div className="mt-1 whitespace-pre-wrap text-sm text-[#444]">{r.message}</div>}
                {r.payload?.interests?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.payload.interests.map((i) => (
                      <span key={i} className="rounded-full bg-[#F7F5F0] px-2 py-0.5 text-[10px] text-[#6F6F6F]">{i}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {r.status !== "REVIEWED" && (
                  <button disabled={busy === r.id} onClick={() => setStatus(r.id, "REVIEWED")} className="rounded-md border border-[#657257] px-2 py-1 text-xs text-[#3A5A3A] hover:bg-[#657257]/10">
                    İncelendi
                  </button>
                )}
                {r.status !== "ARCHIVED" && (
                  <button disabled={busy === r.id} onClick={() => setStatus(r.id, "ARCHIVED")} className="rounded-md border border-[#E3DED5] px-2 py-1 text-xs text-[#6F6F6F] hover:bg-[#F7F5F0]">
                    Arşivle
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && !err && (
          <div className="rounded-xl border border-[#E3DED5] bg-white px-4 py-10 text-center text-sm text-[#6F6F6F]">
            Henüz başvuru yok.
          </div>
        )}
      </div>
    </div>
  );
}
