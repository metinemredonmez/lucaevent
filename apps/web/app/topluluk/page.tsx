"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Crown, Loader2, Flame } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/sections/footer";
import { getSession, getLeaderboard, getScore, type LeaderEntry, type MemberScore } from "@/lib/session";

const RANK_COLOR = ["#FBBF24", "#CBD5E1", "#D6A06A"]; // altın / gümüş / bronz

export default function ToplulukPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LeaderEntry[] | null>(null);
  const [me, setMe] = useState<MemberScore | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!getSession()) {
      router.replace("/giris?next=/topluluk");
      return;
    }
    getLeaderboard(30).then(setRows).catch((e) => { setErr(e.message); setRows([]); });
    getScore().then(setMe).catch(() => {});
  }, [router]);

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-[6.5rem] pb-20">
        <div className="container max-w-3xl">
          <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.22em] text-primary/70">Topluluk</div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">En aktifler.</h1>
          <p className="mt-2 text-muted-foreground">Etkinliklere en çok katılan üyeler. Katıl, puan topla, yüksel.</p>

          {/* benim durumum */}
          {me && (
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-[#0e9a8c]/15 via-card to-card p-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-xl">
                <span aria-hidden>{me.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">Senin rütben: {me.badge} · Seviye {me.level}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">{me.score}</span> puan
                  {me.nextBadge && <> · sıradaki <span className="text-foreground">{me.nextBadge}</span> ({me.nextAt} puan)</>}
                </div>
              </div>
              {me.nextBadge && (
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0e9a8c] to-[#22c9b8]" style={{ width: `${me.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* liderlik */}
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground">
            <Trophy className="size-4 text-primary" /> Liderlik tablosu
          </div>

          {rows === null && (
            <div className="mt-6 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Yükleniyor…
            </div>
          )}
          {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
          {rows && rows.length === 0 && !err && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
              Henüz sıralama yok — ilk aktif üye sen ol. <Link href="/kesfet" className="text-primary hover:underline">Keşfet →</Link>
            </div>
          )}

          {rows && rows.length > 0 && (
            <div className="mt-3 space-y-2">
              {rows.map((u) => {
                const top = u.rank <= 3;
                const rc = top ? RANK_COLOR[u.rank - 1] : undefined;
                return (
                  <div
                    key={u.rank}
                    className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${top ? "border-primary/30" : "border-border"}`}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold tabular-nums" style={top ? { background: rc + "22", color: rc } : { color: "hsl(var(--muted-foreground))" }}>
                      {top ? <Crown className="size-4" style={{ color: rc }} /> : u.rank}
                    </div>
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {u.avatarUrl ? (
                        <Image src={u.avatarUrl} alt={u.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#0e9a8c] to-[#22c9b8] text-sm font-semibold text-white">
                          {u.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{u.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span aria-hidden>{u.icon}</span> {u.badge}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
                      <Flame className="size-3.5 text-primary" /> {u.score}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground/70">
            Puan: bilet ×60 · favori ×8 · yorum ×25. Mesajlaşma yok — sadece aktivite.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
