"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#kategoriler", label: "Deneyim" },
  { href: "#aktiviteler", label: "Program" },
  { href: "#aile", label: "Topluluk" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          <div className="relative size-9 shrink-0 rounded-md overflow-hidden">
            <Image
              src="/img/logo.png"
              alt="Luca"
              fill
              sizes="36px"
              className="object-contain transition-transform group-hover:scale-110"
              priority
            />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.18em] truncate group-hover:text-primary transition-colors">
            LUCA
            <span className="text-muted-foreground font-normal ml-2 text-xs tracking-widest uppercase">
              Etkinlik
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
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
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="/giris">Giriş</a>
          </Button>
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
              <a href="/giris" onClick={() => setOpen(false)}>
                Giriş
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
