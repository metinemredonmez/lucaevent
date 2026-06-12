import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export function PageShell({ eyebrow, title, lead, updatedAt, children }: Props) {
  return (
    <main className="pt-28 md:pt-36 pb-28">
      <div className="container max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Ana sayfa
        </Link>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 backdrop-blur-sm px-3 py-1">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </span>
          </div>
        </div>

        <h1 className="mt-5 font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight text-balance font-semibold">
          {title}
        </h1>

        {lead && (
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">{lead}</p>
        )}

        {updatedAt && (
          <div className="mt-8 text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            Son güncelleme · {updatedAt}
          </div>
        )}

        <div className="mt-10 h-px bg-border" />

        <div className="mt-10 space-y-10 text-[15px] md:text-base leading-relaxed text-foreground/90">
          {children}
        </div>
      </div>
    </main>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid md:grid-cols-[80px_1fr] gap-4 md:gap-8">
      <div className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground pt-1">
        {n}
      </div>
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-4">
          {title}
        </h2>
        <div className="space-y-4 text-muted-foreground">{children}</div>
      </div>
    </section>
  );
}
