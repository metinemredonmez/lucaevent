"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Repeat,
  Tag,
  Ticket,
  ClipboardList,
  Inbox,
  MessageCircle,
  FileText,
  Files,
  Users,
  Bell,
  MapPin,
  Mic2,
  ScanLine,
  Settings,
  Wrench,
  LogOut,
} from "lucide-react";
import { getToken, logout } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/admin/command-palette";
import { Search } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/events", label: "Etkinlikler", icon: CalendarDays },
  { href: "/admin/event-series", label: "Tekrarlayan", icon: Repeat },
  { href: "/admin/reservations", label: "Rezervasyonlar", icon: ClipboardList },
  { href: "/admin/submissions", label: "Başvurular", icon: Inbox },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/posts", label: "Blog", icon: FileText },
  { href: "/admin/pages", label: "İçerik Sayfaları", icon: Files },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/notifications", label: "Bildirim Gönder", icon: Bell },
  { href: "/admin/categories", label: "Kategoriler", icon: Tag },
  { href: "/admin/venues", label: "Mekanlar", icon: MapPin },
  { href: "/admin/artists", label: "Sanatçılar", icon: Mic2 },
  { href: "/admin/coupons", label: "Kuponlar", icon: Ticket },
  { href: "/admin/check-in", label: "Check-in", icon: ScanLine },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
  { href: "/admin/maintenance", label: "Bakım", icon: Wrench },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (!ready) return null;
  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 shrink-0 bg-[#15121f] text-white/85 flex flex-col border-r border-white/10">
        <div className="px-6 py-6 border-b border-white/10">
          <span
            className="text-2xl"
            style={{ fontFamily: "Georgia, 'Cormorant Garamond', serif" }}
          >
            Luca
          </span>
          <span className="block text-[11px] tracking-wide text-white/40">
            YÖNETİM
          </span>
        </div>
        <div className="px-3 pt-3">
          <button
            onClick={() => window.dispatchEvent(new Event("luca:command"))}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Ara…</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/40">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.exact
              ? pathname === n.href
              : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 flex items-center gap-2 border-t border-white/10 pt-3">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
      <CommandPalette />
    </div>
  );
}
