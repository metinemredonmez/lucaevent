"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { Menu, User } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/session";

const LINKS = [
  { href: "#kategoriler", label: "Deneyim" },
  { href: "#aktiviteler", label: "Program" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAuthed(!!getSession());
    const sync = () => setAuthed(!!getSession());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-border/40 bg-background/70 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5 min-w-0">
          <svg viewBox="0 0 100.93 101.9" fill="currentColor" aria-label="Luca" className="size-8 shrink-0 text-foreground transition-transform group-hover:scale-110">
            <path d="M25.37,67.83c-6.42-6.42-10.39-15.29-10.39-25.09,0-7.46,2.31-14.39,6.24-20.1h-8.49c-3.2,5.99-5.02,12.84-5.02,20.1,0,11.8,4.79,22.49,12.52,30.22,4.99,4.99,11.22,8.76,18.18,10.8l-6.06-10.5c-2.55-1.51-4.89-3.34-6.98-5.43Z"/>
            <path d="M50.46,7.26c9.8,0,18.67,3.97,25.09,10.39,2.83,2.83,5.18,6.13,6.93,9.78l4.24-7.34c-1.72-2.75-3.75-5.29-6.03-7.58C72.95,4.79,62.27,0,50.46,0s-21.8,4.48-29.47,11.78h12.13c5.13-2.88,11.04-4.52,17.34-4.52Z"/>
            <path d="M85.94,43.15c-.11,9.64-4.06,18.35-10.39,24.69-6.42,6.42-15.29,10.39-25.09,10.39-.93,0-1.85-.04-2.76-.11l1.12,1.94,3.12,5.4c11.21-.38,21.33-5.09,28.74-12.49,7.73-7.73,12.52-18.42,12.52-30.22,0-3.48-.42-6.86-1.2-10.09l-6.07,10.5Z"/>
            <path d="M94.65,13.6h-10.48c1.48,1.72,2.85,3.57,4.08,5.55l.57.91-.46.8h0l-3.2,5.54-1.12,1.94-1.71,2.98-12.91,22.36h0s-12.79,22.16-12.79,22.16c2.33-.43,4.58-1.1,6.71-1.98,1.34-.56,2.64-1.2,3.89-1.92l8.45-14.64h0s22.09-38.26,22.09-38.26l3.15-5.45h-6.28Z"/>
            <path d="M11.14,21.82l.51-.95h.92,0s6.4,0,6.4,0h0s2.24,0,2.24,0h3.43s0,0,0,0h51.42c-1.54-1.81-3.25-3.42-5.08-4.83-1.16-.89-2.38-1.7-3.64-2.43H0l3.14,5.45,5.23,9.07c.75-2.14,1.66-4.24,2.76-6.3Z"/>
            <path d="M50.92,87.31l-.45-.79h0s-4.33-7.49-4.33-7.49l-1.72-2.97-12.92-22.37-12.79-22.15c-.8,2.24-1.34,4.52-1.64,6.81-.19,1.44-.29,2.89-.29,4.34l8.45,14.63,22.09,38.27,3.13,5.42,3.14-5.44,5.23-9.05c-2.22.42-4.5.68-6.82.76l-1.08.04Z"/>
          </svg>
          <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.18em] truncate group-hover:text-primary transition-colors">
            LUCA
            <span className="text-muted-foreground font-normal ml-2 text-xs tracking-widest uppercase">
              Etkinlik
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="/kesfet"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Keşfet
          </Link>
          <Link
            href="/mekanlar"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Mekanlar
          </Link>
          {authed && (
            <Link
              href="/takvim"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Takvim
            </Link>
          )}
          {authed && (
            <Link
              href="/topluluk"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Topluluk
            </Link>
          )}
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href="/basvuru">Bize Ulaş</a>
          </Button>
          {authed ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href="/hesap">
                <User className="mr-1.5 size-4" /> Hesabım
              </a>
            </Button>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href="/giris">Giriş</a>
            </Button>
          )}
          <button
            onClick={() => setOpen((s) => !s)}
            className="md:hidden p-2 rounded-md hover:bg-secondary"
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="container py-4 flex flex-col gap-1">
            <Link href="/kesfet" onClick={() => setOpen(false)} className="py-2 text-sm">
              Keşfet
            </Link>
            <Link href="/mekanlar" onClick={() => setOpen(false)} className="py-2 text-sm">
              Mekanlar
            </Link>
            {authed && (
              <Link href="/takvim" onClick={() => setOpen(false)} className="py-2 text-sm">
                Takvim
              </Link>
            )}
            {authed && (
              <Link href="/topluluk" onClick={() => setOpen(false)} className="py-2 text-sm">
                Topluluk
              </Link>
            )}
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm"
              >
                {l.label}
              </a>
            ))}
            <Button asChild size="sm" className="mt-2 sm:hidden">
              <a href={authed ? "/hesap" : "/giris"} onClick={() => setOpen(false)}>
                {authed ? "Hesabım" : "Giriş"}
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
