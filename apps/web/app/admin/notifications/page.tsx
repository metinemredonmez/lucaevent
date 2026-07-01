"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Bell, Send, Users, CalendarDays, Smartphone } from "lucide-react";

type Ev = { id: string; title: string; startsAt: string };

const INP =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50";

export default function NotificationsAdmin() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);

  const [target, setTarget] = useState<"all" | "event">("all");
  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [inapp, setInapp] = useState(true);
  const [push, setPush] = useState(false);

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ configured: boolean }>("/admin/notifications/status")
      .then((r) => { setConfigured(r.configured); setPush(r.configured); })
      .catch(() => {});
    api<Ev[]>("/admin/events?take=200").then(setEvents).catch(() => {});
  }, []);

  async function send() {
    setErr("");
    setOk("");
    if (!title.trim() || !message.trim()) return setErr("Başlık ve mesaj zorunlu.");
    if (target === "event" && !eventId) return setErr("Bir etkinlik seç.");
    if (!inapp && !push) return setErr("En az bir kanal seç (uygulama-içi / push).");
    setBusy(true);
    try {
      const r = await api<{ recipients: number; inapp: number; push: any }>("/admin/notifications/dispatch", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: url.trim() || undefined,
          target,
          eventId: target === "event" ? eventId : undefined,
          inapp,
          push,
        }),
      });
      const parts = [];
      if (inapp) parts.push(`${r.inapp} kişiye uygulama-içi`);
      if (push) parts.push(r.push?.recipients != null ? `${r.push.recipients} push` : "push denendi");
      setOk(`Gönderildi — ${parts.join(" · ")} (hedef: ${r.recipients} kişi)`);
      setTitle(""); setMessage(""); setUrl("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Bildirim Gönder" subtitle="Hedefli, çok kanallı bildirim — uygulama-içi (çan) ve/veya push." />

      {configured === false && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          OneSignal anahtarı yok → <b>push</b> çalışmaz (Ayarlar'dan gir). <b>Uygulama-içi</b> bildirimler yine de gönderilir.
        </div>
      )}
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      {ok && <p className="mb-3 text-sm text-emerald-600 dark:text-emerald-400">{ok}</p>}

      <div className="max-w-xl space-y-5 rounded-xl border border-border bg-card p-6">
        {/* hedef */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Kime?</label>
          <div className="flex gap-2">
            {[
              { v: "all", l: "Herkes (tüm üyeler)", icon: Users },
              { v: "event", l: "Belirli etkinlik katılımcıları", icon: CalendarDays },
            ].map((t) => {
              const on = target === t.v;
              const Icon = t.icon;
              return (
                <button
                  key={t.v}
                  onClick={() => setTarget(t.v as "all" | "event")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                    on ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {t.l}
                </button>
              );
            })}
          </div>
          {target === "event" && (
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={`${INP} mt-2`}>
              <option value="">Etkinlik seç…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Başlık</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bildirim başlığı" className={INP} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mesaj</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bildirim metni" rows={4} className={`${INP} resize-y`} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Link / URL (opsiyonel)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (ör. /kesfet)" className={INP} />
        </div>

        {/* kanallar */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Kanal</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={inapp} onChange={(e) => setInapp(e.target.checked)} className="h-4 w-4 accent-[#8B5CF6]" />
              <Bell className="h-4 w-4 text-primary" /> Uygulama-içi (çan) <span className="text-xs text-muted-foreground">— anahtar gerekmez</span>
            </label>
            <label className={`flex items-center gap-2 text-sm ${configured ? "text-foreground" : "text-muted-foreground"}`}>
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="h-4 w-4 accent-[#8B5CF6]" />
              <Smartphone className="h-4 w-4 text-primary" /> Push (OneSignal)
              {configured === false && <span className="text-xs text-amber-600 dark:text-amber-400">— anahtar yok</span>}
            </label>
          </div>
        </div>

        <button
          disabled={busy || !title.trim() || !message.trim()}
          onClick={send}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {busy ? "Gönderiliyor…" : target === "event" ? "Katılımcılara gönder" : "Herkese gönder"}
        </button>
      </div>
    </div>
  );
}
