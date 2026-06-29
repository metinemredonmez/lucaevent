"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Series = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  [key: string]: any;
};

export default function EventSeriesAdmin() {
  const [rows, setRows] = useState<Series[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<Series[]>("/admin/event-series")
      .then(setRows)
      .catch((e: any) => setErr(e.message));
  }
  useEffect(load, []);

  async function generate(s: Series) {
    if (!confirm(`"${s.title}" serisi için seanslar üretilsin mi?`)) return;
    setBusy(s.id);
    setErr("");
    setMsg("");
    try {
      const res: any = await api(`/admin/event-series/${s.id}/generate`, {
        method: "POST",
      });
      const count =
        res?.created ?? res?.count ?? (Array.isArray(res) ? res.length : null);
      setMsg(
        count != null
          ? `"${s.title}": ${count} seans üretildi.`
          : res?.message || `"${s.title}" için seanslar üretildi.`,
      );
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function remove(s: Series) {
    if (!confirm(`"${s.title}" serisi silinsin mi?`)) return;
    setBusy(s.id);
    setErr("");
    setMsg("");
    try {
      await api(`/admin/event-series/${s.id}`, { method: "DELETE" });
      setMsg(`"${s.title}" silindi.`);
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <h1
        className="mb-1 text-3xl text-foreground"
        style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
      >
        Tekrarlayan Etkinlikler
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">{rows.length} seri</p>

      <div className="mb-5 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Yeni seri oluşturma karmaşık; şu an seriler API'den oluşturulur, burada
        seansları üretip yönetebilirsin.
      </div>

      {msg && <p className="mb-3 text-sm text-emerald-400">{msg}</p>}
      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Tür</th>
              <th className="px-4 py-3 text-right font-medium">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{s.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{s.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-[#657257]/15 px-2 py-0.5 text-xs text-emerald-400">
                    {s.kind}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                  <button
                    disabled={busy === s.id}
                    onClick={() => generate(s)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Seansları üret
                  </button>
                  <button
                    disabled={busy === s.id}
                    onClick={() => remove(s)}
                    className="rounded-md border border-[#A23E48] px-2 py-1 text-xs text-rose-400 hover:bg-[#A23E48]/10 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !err && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
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
