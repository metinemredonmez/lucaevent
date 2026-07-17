"use client";

import { useEffect, useState } from "react";

const SERIF = "Georgia, 'Cormorant Garamond', serif";

/** 1s-ticking HH:mm clock, isolated so it never re-renders the dashboard lists. */
export function LiveClock() {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{t}</span>;
}

function greetingTr(): string {
  const h = new Date().getHours();
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Use the greeting (time-of-day) as the H1 instead of `title`. */
  greeting?: boolean;
  /** Cinematic gradient band (dashboard). Otherwise a calm bordered spine. */
  hero?: boolean;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

/**
 * Shared admin page header. Default = calm spine (serif h1 + subtitle + actions
 * over a bottom border). Hero = gradient band with greeting + meta strip, used
 * by the dashboard. Adopt across all admin pages to kill the bare-<h1> look.
 */
export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  greeting,
  hero,
  actions,
  meta,
}: Props) {
  if (!hero) {
    return (
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          {eyebrow && (
            <div className="mb-1 text-[11px] uppercase tracking-widest text-primary/70">{eyebrow}</div>
          )}
          <h1 className="text-2xl text-foreground" style={{ fontFamily: SERIF }}>
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#0e9a8c]/20 via-card to-card p-5 dark:from-[#0e9a8c]/14">
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-1 text-[10px] uppercase tracking-widest text-primary/70">
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl text-foreground sm:text-[1.7rem]" style={{ fontFamily: SERIF }}>
              {greeting ? greetingTr() : title}
            </h1>
            {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
    </div>
  );
}

/** Small pill used in the hero meta strip. */
export function MetaPill({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot?: "live" | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
      {dot === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      )}
      {children}
    </span>
  );
}
