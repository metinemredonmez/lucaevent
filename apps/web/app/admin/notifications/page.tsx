"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";

export default function NotificationsAdmin() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  function load() {
    api<{ configured: boolean }>("/admin/notifications/status")
      .then((r) => setConfigured(r.configured))
      .catch((e: any) => setErr(e.message));
  }
  useEffect(load, []);

  async function send() {
    setErr("");
    setOk("");
    if (!title.trim() || !message.trim()) {
      setErr("Başlık ve mesaj zorunlu.");
      return;
    }
    setBusy(true);
    try {
      await api("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || undefined,
        }),
      });
      setOk("Bildirim gönderildi");
      setTitle("");
      setMessage("");
      setUrl("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Bildirim Gönder" subtitle="Tüm aboneliklere push bildirimi gönderin." />

      {configured === false && (
        <div className="mb-5 rounded-xl border border-[#B7791F]/40 bg-[#B7791F]/10 px-4 py-3 text-sm text-amber-400">
          OneSignal anahtarı girilmemiş — Ayarlar'dan gir.
        </div>
      )}

      {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
      {ok && <p className="mb-3 text-sm text-emerald-400">{ok}</p>}

      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Başlık</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bildirim başlığı"
          className="mb-4 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
        />

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Mesaj</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Bildirim metni"
          rows={4}
          className="mb-4 w-full resize-y rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
        />

        <label className="mb-1 block text-xs font-medium text-muted-foreground">Link / URL (opsiyonel)</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="mb-5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-[#C86B42]"
        />

        <button
          disabled={busy || !title.trim() || !message.trim()}
          onClick={send}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Gönderiliyor…" : "Herkese gönder"}
        </button>
      </div>
    </div>
  );
}
