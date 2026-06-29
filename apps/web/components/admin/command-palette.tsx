"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api, getToken } from "@/lib/api";

type Item = { id: string; label: string; href: string; group: string };

const NAV: Item[] = [
  { id: "n-dash", label: "Dashboard", href: "/admin", group: "Sayfa" },
  { id: "n-events", label: "Etkinlikler", href: "/admin/events", group: "Sayfa" },
  { id: "n-series", label: "Tekrarlayan etkinlikler", href: "/admin/event-series", group: "Sayfa" },
  { id: "n-res", label: "Rezervasyonlar", href: "/admin/reservations", group: "Sayfa" },
  { id: "n-sub", label: "Başvurular", href: "/admin/submissions", group: "Sayfa" },
  { id: "n-blog", label: "Blog", href: "/admin/posts", group: "Sayfa" },
  { id: "n-pages", label: "İçerik Sayfaları", href: "/admin/pages", group: "Sayfa" },
  { id: "n-users", label: "Kullanıcılar", href: "/admin/users", group: "Sayfa" },
  { id: "n-cat", label: "Kategoriler", href: "/admin/categories", group: "Sayfa" },
  { id: "n-venues", label: "Mekanlar", href: "/admin/venues", group: "Sayfa" },
  { id: "n-artists", label: "Sanatçılar", href: "/admin/artists", group: "Sayfa" },
  { id: "n-coupons", label: "Kuponlar", href: "/admin/coupons", group: "Sayfa" },
  { id: "n-checkin", label: "Check-in", href: "/admin/check-in", group: "Sayfa" },
  { id: "n-settings", label: "Ayarlar", href: "/admin/settings", group: "Sayfa" },
  { id: "n-maint", label: "Bakım", href: "/admin/maintenance", group: "Sayfa" },
];

const ACTIONS: Item[] = [
  { id: "a-event", label: "Yeni etkinlik oluştur", href: "/admin/events/new", group: "Eylem" },
  { id: "a-post", label: "Yeni blog yazısı", href: "/admin/posts/new", group: "Eylem" },
  { id: "a-page", label: "Yeni içerik sayfası", href: "/admin/pages/new", group: "Eylem" },
  { id: "a-notify", label: "Bildirim gönder", href: "/admin/notifications", group: "Eylem" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [events, setEvents] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("luca:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("luca:command", onOpen);
    };
  }, []);

  // Etkinlikleri açılışta bir kez çek (arama için).
  useEffect(() => {
    if (!open || events.length || !getToken()) return;
    api<{ id: string; title: string }[]>("/admin/events?take=100")
      .then((rows) =>
        setEvents(
          rows.map((e) => ({ id: "e-" + e.id, label: e.title, href: `/admin/events/${e.id}/edit`, group: "Etkinlik" })),
        ),
      )
      .catch(() => {});
  }, [open, events.length]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const term = q.trim().toLowerCase();
  const results = term
    ? [...ACTIONS, ...NAV, ...events].filter((i) => i.label.toLowerCase().includes(term)).slice(0, 12)
    : [...ACTIONS, ...NAV].slice(0, 9);

  function go(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Ara: etkinlik, sayfa, eylem…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">Sonuç yok.</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                i === active ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
            >
              <span className="min-w-0 truncate text-sm text-foreground">{item.label}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{item.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
