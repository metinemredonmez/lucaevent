"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getSession,
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  type AppNotification,
} from "@/lib/session";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const g = Math.floor(h / 24);
  if (g < 7) return `${g} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAuthed(!!getSession());
  }, []);

  // okunmamış sayacı (60 sn poll)
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    const tick = () =>
      getUnreadCount()
        .then((r) => alive && setCount(r.count))
        .catch(() => {});
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [authed]);

  // dışarı tıklayınca kapat
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const list = await getNotifications().catch(() => []);
      setItems(list);
      if (count > 0) {
        markNotificationsRead()
          .then(() => setCount(0))
          .catch(() => {});
      }
    }
  }

  if (!authed) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Bildirimler"
        className="relative grid size-9 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            Bildirimler
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Yükleniyor…</div>
            )}
            {items?.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                Henüz bildirim yok.
              </div>
            )}
            {items?.map((n) => {
              const body = (
                <div className={`flex gap-3 px-4 py-3 ${n.read ? "" : "bg-primary/5"}`}>
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ background: n.read ? "transparent" : "hsl(var(--primary))" }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{n.title}</div>
                    {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                    <div className="mt-0.5 text-[11px] text-muted-foreground/60">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="block transition-colors hover:bg-muted/40">
                  {body}
                </Link>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
