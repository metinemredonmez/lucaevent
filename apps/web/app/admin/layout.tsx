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

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/events", label: "Etkinlikler", icon: CalendarDays },
  { href: "/admin/event-series", label: "Tekrarlayan", icon: Repeat },
  { href: "/admin/reservations", label: "Rezervasyonlar", icon: ClipboardList },
  { href: "/admin/submissions", label: "Başvurular", icon: Inbox },
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
    </div>
  );
}
