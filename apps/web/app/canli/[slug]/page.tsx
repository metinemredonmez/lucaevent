"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Radio, Lock, LogIn, Ticket, ArrowLeft, Loader2, CalendarClock } from "lucide-react";
import {
  getStreamMeta,
  getStreamPlay,
  getSession,
  type StreamMeta,
} from "@/lib/session";
import { LivePlayer } from "@/components/live-player";

const tl = (m: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format((m || 0) / 100);

export default function CanliPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [meta, setMeta] = useState<StreamMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [gate, setGate] = useState<"login" | "pay" | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getSession());
  }, []);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      setGate(null);
      setUrl(null);
      try {
        const m = await getStreamMeta(slug);
        if (!alive) return;
        setMeta(m);
        if (!m.isLive) {
          setLoading(false);
          return;
        }
        if (m.playbackUrl) {
          setUrl(m.playbackUrl); // PUBLIC
          setLoading(false);
          return;
        }
        if (!getSession()) {
          setGate(m.access === "PAID" ? "pay" : "login");
          setLoading(false);
          return;
        }
        try {
          const p = await getStreamPlay(slug);
          if (!alive) return;
          setUrl(p.playbackUrl);
        } catch (e: any) {
          if (!alive) return;
          const msg = e?.message || "";
          setGate(/oturum/i.test(msg) ? "login" : m.access === "PAID" ? "pay" : "login");
        }
        setLoading(false);
      } catch (e: any) {
        if (alive) {
          setErr(e?.message || "Yayın bulunamadı");
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#0b0b10] text-white">
      <header className="border-b border-white/10">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Luca
          </Link>
          {meta?.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              CANLI
            </span>
          )}
        </div>
      </header>

      <div className="container max-w-4xl py-6 sm:py-10">
        {loading && (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-white/5 text-white/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && err && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <Radio className="mx-auto mb-3 h-7 w-7 text-white/40" />
            <p className="text-white/80">{err}</p>
            <Link href="/kesfet" className="mt-4 inline-block text-sm text-violet-400 hover:underline">
              Etkinlikleri keşfet →
            </Link>
          </div>
        )}

        {!loading && meta && !err && (
          <>
            {/* oynatıcı / durum */}
            {url ? (
              <LivePlayer url={url} poster={meta.coverUrl} />
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                {meta.coverUrl && (
                  <Image src={meta.coverUrl} alt={meta.title} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover opacity-30" />
                )}
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  {!meta.isLive ? (
                    <div>
                      <CalendarClock className="mx-auto mb-3 h-8 w-8 text-white/50" />
                      <p className="text-lg font-medium">
                        {meta.liveStatus === "ENDED" ? "Yayın sona erdi" : "Yayın henüz başlamadı"}
                      </p>
                      <p className="mt-1 text-sm text-white/50">
                        {meta.liveStatus === "ENDED"
                          ? "Bu etkinliğin canlı yayını tamamlandı."
                          : "Yayın başladığında bu sayfada izleyebilirsin."}
                      </p>
                    </div>
                  ) : gate === "pay" ? (
                    <div>
                      <Ticket className="mx-auto mb-3 h-8 w-8 text-violet-400" />
                      <p className="text-lg font-medium">Ücretli canlı yayın</p>
                      {meta.priceMinor != null && (
                        <p className="mt-1 text-2xl font-semibold text-violet-300">{tl(meta.priceMinor)}</p>
                      )}
                      <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
                        İzlemek için giriş yap ve bu etkinliğe bilet/ödeme yap.
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {!authed && (
                          <Link href="/giris" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
                            <LogIn className="h-4 w-4" /> Giriş yap
                          </Link>
                        )}
                        <Link href="/kesfet" className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium">
                          <Ticket className="h-4 w-4" /> Bilet al
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Lock className="mx-auto mb-3 h-8 w-8 text-white/50" />
                      <p className="text-lg font-medium">Üyelere özel canlı yayın</p>
                      <p className="mt-1 text-sm text-white/60">İzlemek için Luca hesabınla giriş yap.</p>
                      <Link href="/giris" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-4 py-2 text-sm font-medium">
                        <LogIn className="h-4 w-4" /> Giriş yap
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* başlık + meta */}
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{meta.title}</h1>
                {meta.access === "MEMBERS" && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70">Üyelere özel</span>
                )}
                {meta.access === "PAID" && (
                  <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] text-violet-300">Ücretli</span>
                )}
              </div>
              {url && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-red-400">
                  <Radio className="h-4 w-4" /> Şu an canlı yayında
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
