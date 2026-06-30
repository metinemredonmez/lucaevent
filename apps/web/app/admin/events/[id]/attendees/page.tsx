"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Check } from "lucide-react";
import { api, apiDownload } from "@/lib/api";
import { formatDateTR } from "@/lib/utils";

type Attendee = {
  holderName: string;
  email: string;
  tier: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
};
type WaitEntry = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  status: string;
  notifiedAt?: string | null;
  createdAt: string;
  tier?: { name: string } | null;
};

const WAIT_COLOR: Record<string, string> = {
  WAITING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  NOTIFIED: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  CONVERTED: "bg-[#657257]/15 text-emerald-600 dark:text-emerald-400",
  EXPIRED: "bg-[#6F6F6F]/15 text-muted-foreground",
};

export default function EventAttendees() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [title, setTitle] = useState("");
  const [att, setAtt] = useState<Attendee[]>([]);
  const [wait, setWait] = useState<WaitEntry[]>([]);
  const [err, setErr] = useState("");
  const [dl, setDl] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<{ title: string }>(`/admin/events/${id}`).then((e) => setTitle(e.title)).catch(() => {});
    api<Attendee[]>(`/admin/events/${id}/attendees`).then(setAtt).catch((e) => setErr(e.message));
    api<WaitEntry[]>(`/admin/events/${id}/waitlist`).then(setWait).catch(() => {});
  }, [id]);

  const checkedCount = att.filter((a) => a.checkedIn).length;

  async function exportCsv() {
    setDl(true);
    try {
      await apiDownload(`/admin/events/${id}/attendees.csv`, `katilimcilar-${id}.csv`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setDl(false);
    }
  }

  return (
    <div>
      <Link href="/admin/events" className="text-sm text-muted-foreground hover:text-foreground">
        ← Etkinlikler
      </Link>
      <div className="mb-6 mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-foreground" style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}>
            Katılımcılar
          </h1>
          <p className="text-sm text-muted-foreground">{title || "…"}</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={dl || att.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {dl ? "İndiriliyor…" : "CSV indir"}
        </button>
      </div>

      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}

      {/* Katılımcılar */}
      <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{att.length}</span> bilet ·
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{checkedCount}</span> giriş yaptı
      </div>
      <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">E-posta</th>
              <th className="px-4 py-3 font-medium">Bilet</th>
              <th className="px-4 py-3 font-medium">Giriş</th>
            </tr>
          </thead>
          <tbody>
            {att.map((a, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{a.holderName || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.tier}</td>
                <td className="px-4 py-3">
                  {a.checkedIn ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> {a.checkedInAt ? formatDateTR(a.checkedInAt) : "Evet"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {att.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Henüz katılımcı yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bekleme listesi */}
      <h2 className="mb-3 text-lg font-medium text-foreground">Bekleme listesi ({wait.length})</h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Kişi</th>
              <th className="px-4 py-3 font-medium">Bilet</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {wait.map((w, i) => (
              <tr key={w.id} className="border-t border-border">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{w.fullName || "—"}</div>
                  <div className="text-xs text-muted-foreground">{w.email}{w.phone ? ` · ${w.phone}` : ""}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{w.tier?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${WAIT_COLOR[w.status] ?? ""}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTR(w.createdAt)}</td>
              </tr>
            ))}
            {wait.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Bekleme listesi boş.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
